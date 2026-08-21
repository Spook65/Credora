import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type DnsResolver,
  validatePublicUrl,
  type ValidationFailureReason
} from "./public-url.js";

function resolverFor(records: Record<string, string[]>): DnsResolver {
  return async (hostname) => {
    const addresses = records[hostname.toLowerCase()];

    if (!addresses) {
      throw new Error(`No mocked DNS record for ${hostname}`);
    }

    return addresses;
  };
}

async function expectAllowed(input: string, addresses = ["93.184.216.34"]) {
  const result = await validatePublicUrl(input, {
    resolver: resolverFor({
      "example.com": addresses
    })
  });

  assert.equal(result.ok, true, input);

  if (result.ok) {
    assert.equal(result.hostname, "example.com");
    assert.deepEqual(result.resolvedAddresses, addresses);
  }
}

async function expectRejected(
  input: string,
  reason: ValidationFailureReason,
  resolver: DnsResolver = resolverFor({
    "example.com": ["93.184.216.34"]
  })
) {
  const result = await validatePublicUrl(input, { resolver });

  assert.equal(result.ok, false, input);

  if (!result.ok) {
    assert.equal(result.reason, reason);
    assert.ok(result.message.length > 0);
  }
}

describe("validatePublicUrl", () => {
  describe("allowed candidates", () => {
    it("accepts ordinary HTTP and HTTPS URLs with public DNS results", async () => {
      await expectAllowed("https://example.com");
      await expectAllowed("http://example.com");
      await expectAllowed("https://example.com/");
      await expectAllowed("https://example.com/path?query=value");
    });

    it("accepts public IPv4 literals without DNS resolution", async () => {
      const result = await validatePublicUrl("https://93.184.216.34");

      assert.equal(result.ok, true);

      if (result.ok) {
        assert.equal(result.hostname, "93.184.216.34");
        assert.deepEqual(result.resolvedAddresses, ["93.184.216.34"]);
      }
    });

    it("accepts a public IPv6 literal without DNS resolution", async () => {
      const result = await validatePublicUrl("https://[2001:4860:4860::8888]");

      assert.equal(result.ok, true);

      if (result.ok) {
        assert.equal(result.hostname, "2001:4860:4860::8888");
        assert.deepEqual(result.resolvedAddresses, ["2001:4860:4860:0:0:0:0:8888"]);
      }
    });

    it("accepts mixed public IPv4 and public IPv6 DNS answers", async () => {
      const result = await validatePublicUrl("https://example.com", {
        resolver: resolverFor({
          "example.com": ["93.184.216.34", "2001:4860:4860::8888"]
        })
      });

      assert.equal(result.ok, true);

      if (result.ok) {
        assert.deepEqual(result.resolvedAddresses, [
          "93.184.216.34",
          "2001:4860:4860:0:0:0:0:8888"
        ]);
      }
    });
  });

  describe("syntax and scheme validation", () => {
    it("rejects malformed URLs", async () => {
      await expectRejected("not a url", "MALFORMED_URL");
      await expectRejected("://broken", "MALFORMED_URL");
    });

    it("rejects unsupported protocols", async () => {
      await expectRejected("file:///etc/passwd", "UNSUPPORTED_PROTOCOL");
      await expectRejected("ftp://example.com", "UNSUPPORTED_PROTOCOL");
      await expectRejected("data:text/plain,test", "UNSUPPORTED_PROTOCOL");
      await expectRejected("javascript:alert(1)", "UNSUPPORTED_PROTOCOL");
      await expectRejected("gopher://example.com", "UNSUPPORTED_PROTOCOL");
      await expectRejected("ws://example.com", "UNSUPPORTED_PROTOCOL");
      await expectRejected("wss://example.com", "UNSUPPORTED_PROTOCOL");
    });

    it("rejects embedded credentials", async () => {
      await expectRejected("https://user:pass@example.com", "EMBEDDED_CREDENTIALS");
      await expectRejected("https://admin@example.com", "EMBEDDED_CREDENTIALS");
    });
  });

  describe("hostname and port policy", () => {
    it("rejects localhost hostnames case-insensitively", async () => {
      await expectRejected("http://localhost", "LOCALHOST_HOSTNAME");
      await expectRejected("http://localhost.", "LOCALHOST_HOSTNAME");
      await expectRejected("https://LOCALHOST", "LOCALHOST_HOSTNAME");
    });

    it("accepts omitted/default ports and explicit 80/443", async () => {
      await expectAllowed("http://example.com");
      await expectAllowed("http://example.com:80");
      await expectAllowed("https://example.com");
      await expectAllowed("https://example.com:443");
    });

    it("rejects non-web ports", async () => {
      await expectRejected("http://example.com:3000", "DISALLOWED_PORT");
      await expectRejected("https://example.com:8443", "DISALLOWED_PORT");
      await expectRejected("http://example.com:22", "DISALLOWED_PORT");
      await expectRejected("http://example.com:6379", "DISALLOWED_PORT");
      await expectRejected("http://example.com:5432", "DISALLOWED_PORT");
    });
  });

  describe("IP literal validation", () => {
    it("rejects IPv4 loopback addresses beyond 127.0.0.1", async () => {
      await expectRejected("http://127.0.0.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://127.0.0.2", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://127.255.255.254", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects IPv4 private ranges", async () => {
      await expectRejected("http://10.0.0.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://172.16.0.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://172.31.255.254", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://192.168.1.10", "FORBIDDEN_IP_ADDRESS");
    });

    it("keeps the 172.16.0.0/12 private range boundary precise", async () => {
      const resultBelow = await validatePublicUrl("http://172.15.255.255");
      const resultAbove = await validatePublicUrl("http://172.32.0.0");

      assert.equal(resultBelow.ok, true);
      assert.equal(resultAbove.ok, true);
      await expectRejected("http://172.16.0.0", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://172.31.255.255", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects IPv4 link-local and cloud metadata-style destinations", async () => {
      await expectRejected("http://169.254.1.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://169.254.169.254", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects other non-public IPv4 ranges conservatively", async () => {
      await expectRejected("http://0.0.0.0", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://100.64.0.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://198.51.100.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://224.0.0.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://255.255.255.255", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects IPv6 loopback, link-local, and unique-local addresses", async () => {
      await expectRejected("http://[::1]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[fe80::1]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[fc00::1]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[fd12:3456:789a::1]", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects other non-public IPv6 ranges conservatively", async () => {
      await expectRejected("http://[::]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[ff02::1]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[2001:db8::1]", "FORBIDDEN_IP_ADDRESS");
    });

    it("rejects IPv4-mapped IPv6 private destinations", async () => {
      await expectRejected("http://[::ffff:192.168.1.1]", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://[::ffff:127.0.0.1]", "FORBIDDEN_IP_ADDRESS");
    });

    it("accepts IPv4-mapped IPv6 public destinations", async () => {
      const result = await validatePublicUrl("http://[::ffff:8.8.8.8]");

      assert.equal(result.ok, true);

      if (result.ok) {
        assert.deepEqual(result.resolvedAddresses, ["8.8.8.8"]);
      }
    });

    it("rejects URL-normalized alternate IPv4 loopback forms", async () => {
      await expectRejected("http://127.1", "FORBIDDEN_IP_ADDRESS");
      await expectRejected("http://0177.0.0.1", "FORBIDDEN_IP_ADDRESS");
    });
  });

  describe("DNS validation", () => {
    it("rejects mixed public and private DNS answers", async () => {
      await expectRejected(
        "https://example.com",
        "FORBIDDEN_IP_ADDRESS",
        resolverFor({
          "example.com": ["93.184.216.34", "10.0.0.1"]
        })
      );
    });

    it("rejects hostnames that resolve only to IPv6 private destinations", async () => {
      await expectRejected(
        "https://example.com",
        "FORBIDDEN_IP_ADDRESS",
        resolverFor({
          "example.com": ["fc00::1"]
        })
      );
    });

    it("handles DNS resolution failures without throwing", async () => {
      await expectRejected("https://example.com", "DNS_RESOLUTION_FAILED", async () => {
        throw new Error("getaddrinfo ENOTFOUND example.com");
      });
    });

    it("rejects empty DNS results", async () => {
      await expectRejected(
        "https://example.com",
        "NO_DNS_ADDRESSES",
        resolverFor({
          "example.com": []
        })
      );
    });
  });
});

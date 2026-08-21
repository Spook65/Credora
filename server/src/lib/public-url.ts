import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

export type ValidationFailureReason =
  | "MALFORMED_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "EMBEDDED_CREDENTIALS"
  | "LOCALHOST_HOSTNAME"
  | "DISALLOWED_PORT"
  | "DNS_RESOLUTION_FAILED"
  | "NO_DNS_ADDRESSES"
  | "FORBIDDEN_IP_ADDRESS";

export type ValidationResult =
  | {
      ok: true;
      normalizedUrl: string;
      hostname: string;
      resolvedAddresses: string[];
    }
  | {
      ok: false;
      reason: ValidationFailureReason;
      message: string;
    };

export type DnsResolver = (hostname: string) => Promise<ReadonlyArray<string>>;

export type ValidatePublicUrlOptions = {
  resolver?: DnsResolver;
};

const allowedProtocols = new Set(["http:", "https:"]);
const allowedPorts = new Set(["80", "443"]);

const defaultResolver: DnsResolver = async (hostname) => {
  const records = await lookup(hostname, {
    all: true,
    verbatim: true
  });

  return records.map((record) => record.address);
};

export async function validatePublicUrl(
  input: string,
  options: ValidatePublicUrlOptions = {}
): Promise<ValidationResult> {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return fail("MALFORMED_URL", "Enter a complete HTTP or HTTPS URL.");
  }

  if (!allowedProtocols.has(url.protocol)) {
    return fail("UNSUPPORTED_PROTOCOL", "Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username !== "" || url.password !== "") {
    return fail("EMBEDDED_CREDENTIALS", "URLs with embedded credentials are not accepted.");
  }

  if (url.hostname === "") {
    return fail("MALFORMED_URL", "The URL must include a hostname.");
  }

  const hostname = normalizeHostname(url.hostname);

  if (isLocalhostHostname(hostname)) {
    return fail("LOCALHOST_HOSTNAME", "Localhost destinations are not accepted.");
  }

  if (url.port !== "" && !allowedPorts.has(url.port)) {
    return fail(
      "DISALLOWED_PORT",
      "Only conventional web ports 80 and 443 are accepted in this MVP."
    );
  }

  if (ipaddr.isValid(hostname)) {
    const addressResult = validatePublicAddress(hostname);

    if (!addressResult.ok) {
      return addressResult;
    }

    return {
      ok: true,
      normalizedUrl: url.href,
      hostname,
      resolvedAddresses: [addressResult.address]
    };
  }

  const resolver = options.resolver ?? defaultResolver;
  let resolvedAddresses: ReadonlyArray<string>;

  try {
    resolvedAddresses = await resolver(hostname);
  } catch {
    return fail("DNS_RESOLUTION_FAILED", "The hostname could not be resolved.");
  }

  const uniqueAddresses = [...new Set(resolvedAddresses.map((address) => address.trim()))].filter(
    Boolean
  );

  if (uniqueAddresses.length === 0) {
    return fail("NO_DNS_ADDRESSES", "The hostname did not resolve to an IP address.");
  }

  const normalizedAddresses: string[] = [];

  for (const address of uniqueAddresses) {
    const addressResult = validatePublicAddress(address);

    if (!addressResult.ok) {
      return addressResult;
    }

    normalizedAddresses.push(addressResult.address);
  }

  return {
    ok: true,
    normalizedUrl: url.href,
    hostname,
    resolvedAddresses: normalizedAddresses
  };
}

function fail(reason: ValidationFailureReason, message: string): ValidationResult {
  return {
    ok: false,
    reason,
    message
  };
}

function normalizeHostname(hostname: string): string {
  const lowerHostname = hostname.toLowerCase();

  if (lowerHostname.startsWith("[") && lowerHostname.endsWith("]")) {
    return lowerHostname.slice(1, -1);
  }

  return lowerHostname;
}

function isLocalhostHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "localhost.";
}

function validatePublicAddress(address: string):
  | {
      ok: true;
      address: string;
    }
  | {
      ok: false;
      reason: "FORBIDDEN_IP_ADDRESS";
      message: string;
    } {
  if (!ipaddr.isValid(address)) {
    return {
      ok: false,
      reason: "FORBIDDEN_IP_ADDRESS",
      message: "The destination resolved to an invalid IP address."
    };
  }

  const parsedAddress = ipaddr.parse(address);

  if (parsedAddress instanceof ipaddr.IPv6 && parsedAddress.isIPv4MappedAddress()) {
    const mappedAddress = parsedAddress.toIPv4Address();
    const range = mappedAddress.range();

    if (range !== "unicast") {
      return forbiddenAddress(range);
    }

    return {
      ok: true,
      address: mappedAddress.toString()
    };
  }

  const range = parsedAddress.range();

  if (range !== "unicast") {
    return forbiddenAddress(range);
  }

  return {
    ok: true,
    address: parsedAddress.toNormalizedString()
  };
}

function forbiddenAddress(range: string) {
  return {
    ok: false as const,
    reason: "FORBIDDEN_IP_ADDRESS" as const,
    message: `The destination resolves to a non-public IP address (${range}).`
  };
}

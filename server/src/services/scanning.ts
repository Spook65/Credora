export { validatePublicUrl } from "../lib/public-url.js";
export type {
  DnsResolver,
  ValidatePublicUrlOptions,
  ValidationFailureReason,
  ValidationResult
} from "../lib/public-url.js";

// Future URL-scanning code belongs here.
//
// Important: validation-time DNS resolution alone does not fully solve DNS
// rebinding or time-of-check-to-time-of-use problems. The future fetcher must
// either connect only to an address that passed validation or revalidate DNS at
// request time before opening the connection.
//
// Redirects must not be followed automatically without validation. Every
// redirect target must pass the same public URL validation before it can be
// requested.

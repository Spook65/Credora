// Future URL-scanning code belongs here.
//
// TODO: Before fetching any user-supplied URL, implement SSRF defenses that
// validate public HTTP/HTTPS targets, reject private/internal IP ranges and
// localhost aliases, restrict unsafe ports, enforce timeout and byte limits,
// and revalidate every redirect destination after DNS resolution.
export {};

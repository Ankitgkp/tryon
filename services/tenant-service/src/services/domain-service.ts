/**
 * Domain Allowlist Service
 *
 * Validates that an API request's origin is allowed for a given tenant.
 *
 * Design decisions:
 * - Empty allowedDomains = no restriction (opt-in security)
 * - Comparison is case-insensitive
 * - Supports wildcard subdomains (e.g., "*.example.com")
 */

/**
 * Checks whether the given origin is allowed for a tenant's domain list.
 * Returns true if:
 * - The allowlist is empty (no restrictions configured)
 * - The origin matches an entry in the allowlist
 * - The origin matches a wildcard entry (e.g., "*.example.com")
 */
export function isDomainAllowed(
  origin: string | undefined,
  allowedDomains: string[]
): boolean {
  // No restrictions configured — allow everything.
  if (allowedDomains.length === 0) return true;

  // No origin provided — deny when restrictions are in place.
  // This prevents server-to-server calls from bypassing domain checks
  // when the tenant has explicitly configured an allowlist.
  if (!origin) return false;

  const normalizedOrigin = origin.toLowerCase();

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.toLowerCase();

    // Exact match
    if (normalizedOrigin === normalizedDomain) return true;

    // Wildcard subdomain match: "*.example.com" matches "app.example.com"
    if (normalizedDomain.startsWith("*.")) {
      const baseDomain = normalizedDomain.slice(2); // "example.com"
      return (
        normalizedOrigin.endsWith(baseDomain) &&
        normalizedOrigin[normalizedOrigin.length - baseDomain.length - 1] === "."
      );
    }

    return false;
  });
}

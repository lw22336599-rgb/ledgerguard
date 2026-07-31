/** Set on Vercel after DNS is live — see docs/CUSTOM_DOMAIN.md */
export const PREFERRED_PUBLIC_ORIGIN = "https://ledgerguard.app";

const DEFAULT_PUBLIC_BASE_URL = "https://ledgerguard-gules.vercel.app";

export function getPublicBaseUrl(): string {
  const configured =
    process.env.PUBLIC_BASE_URL?.trim() || DEFAULT_PUBLIC_BASE_URL;
  const url = new URL(configured);
  const local =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1";

  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "PUBLIC_BASE_URL must be an HTTPS origin (HTTP is allowed only for localhost).",
    );
  }

  return url.origin;
}

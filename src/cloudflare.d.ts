/** Minimal typing for the one Cloudflare runtime module the site uses (/api/chat). */
declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}

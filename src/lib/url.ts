/**
 * Resolves the true public base URL of the application.
 * Solves the issue where internal server socket bindings (e.g., 0.0.0.0:3000)
 * leak into redirects, webhooks, or OAuth callbacks in containerized environments like Render.
 */
export function getPublicBaseUrl(req?: Request): string {
  // 1. Explicitly configured public URL (Render or custom domain)
  let envUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.APP_URL ||
    ''
  ).trim();

  if (envUrl) {
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Derive from request headers (Render / Reverse Proxy)
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const hostHeader = req.headers.get('host');
    let host = forwardedHost || hostHeader || '';

    // Strip internal 0.0.0.0 wildcard bind address
    if (host.startsWith('0.0.0.0')) {
      host = host.replace('0.0.0.0', 'localhost');
    }

    if (host) {
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const proto = forwardedProto || (isLocalhost ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }

    // 3. Fallback to req.url if valid
    try {
      const parsed = new URL(req.url);
      if (parsed.hostname === '0.0.0.0') {
        parsed.hostname = 'localhost';
      }
      return parsed.origin.replace(/\/+$/, '');
    } catch {}
  }

  return 'http://localhost:3000';
}

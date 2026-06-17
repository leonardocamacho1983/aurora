export function siteUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }

  return "http://localhost:3000";
}

export function referralUrl(code: string, baseUrl = siteUrl()): string {
  return `${baseUrl.replace(/\/+$/, "")}/r/${encodeURIComponent(code)}`;
}

export function statusUrl(token: string, baseUrl = siteUrl()): string {
  return `${baseUrl.replace(/\/+$/, "")}/lista/${encodeURIComponent(token)}`;
}

export function confirmUrl(token: string, baseUrl = siteUrl()): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/waitlist/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Cloudflare Worker — Decap CMS GitHub OAuth Proxy
 *
 * This worker handles the GitHub OAuth flow so Decap CMS can authenticate
 * users without exposing the client secret in the browser or the repo.
 *
 * Required environment variables (set in Cloudflare dashboard, NOT here):
 *   GITHUB_CLIENT_ID     — from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET — from your GitHub OAuth App
 *
 * Deployment steps:
 *   1. Create a GitHub OAuth App (see README below).
 *   2. Deploy this worker with `wrangler deploy` or paste into the Cloudflare
 *      dashboard editor.
 *   3. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET as Worker environment
 *      variables (Settings → Variables → Add variable → Encrypt).
 *   4. Set the OAuth App's callback URL to:
 *        https://<your-worker-subdomain>.workers.dev/callback
 *   5. Update site/static/admin/config.yml:
 *        base_url: https://<your-worker-subdomain>.workers.dev
 *
 * ─── GitHub OAuth App setup ───────────────────────────────────────────────
 *   GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
 *     Application name:      Decap CMS – audit-analytics
 *     Homepage URL:          https://audit-analytics.com
 *     Authorization callback URL:
 *                            https://<your-worker-subdomain>.workers.dev/callback
 *   After creating the app:
 *     - Copy the Client ID   → GITHUB_CLIENT_ID env var
 *     - Generate a secret    → GITHUB_CLIENT_SECRET env var
 * ──────────────────────────────────────────────────────────────────────────
 */

const GITHUB_OAUTH_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_OAUTH_TOKEN = "https://github.com/login/oauth/access_token";

// Scopes needed by Decap CMS to read/write repo content
const SCOPES = "repo,user";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/auth":
        return handleAuth(url, env);
      case "/callback":
        return handleCallback(url, env);
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};

/**
 * /auth — redirect the browser to GitHub's OAuth authorization page
 */
function handleAuth(url, env) {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/callback`,
    scope: SCOPES,
    state: crypto.randomUUID(),
  });

  return Response.redirect(
    `${GITHUB_OAUTH_AUTHORIZE}?${params.toString()}`,
    302
  );
}

/**
 * /callback — exchange the GitHub `code` for an access token, then send it
 * back to the Decap CMS window via postMessage.
 */
async function handleCallback(url, env) {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return postMessageResponse("error", { error: error ?? "no_code" });
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch(GITHUB_OAUTH_TOKEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    return postMessageResponse("error", {
      error: "token_request_failed",
      status: tokenResponse.status,
    });
  }

  const data = await tokenResponse.json();

  if (data.error) {
    return postMessageResponse("error", { error: data.error });
  }

  return postMessageResponse("success", {
    token: data.access_token,
    provider: "github",
  });
}

/**
 * Returns an HTML page that uses window.opener.postMessage to pass the token
 * back to the Decap CMS window, then closes itself.
 *
 * This is the protocol Decap CMS expects from an external OAuth gateway.
 */
function postMessageResponse(status, content) {
  const message = JSON.stringify({ provider: "github", ...content });

  // Decap CMS listens for a message in the format:
  //   "authorization:github:success:{"token":"...","provider":"github"}"
  // or
  //   "authorization:github:error:{"error":"..."}"
  const decapMessage = `authorization:github:${status}:${message}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authenticating…</title></head>
<body>
<script>
  (function () {
    var msg = ${JSON.stringify(decapMessage)};
    function send() {
      if (window.opener) {
        window.opener.postMessage(msg, "*");
        window.close();
      } else {
        // Fallback: try again shortly (popup may not be fully open yet)
        setTimeout(send, 100);
      }
    }
    send();
  })();
<\/script>
<p>Authenticating, please wait…</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

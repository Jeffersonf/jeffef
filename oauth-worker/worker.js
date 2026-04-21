const COOKIE_NAME = "decap-oauth-state";
const STATE_TTL_SECONDS = 600;

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function html(body, init = {}) {
  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function randomHex(bytes = 16) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, value => value.toString(16).padStart(2, "0")).join("");
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function callbackUrl(url) {
  return `${url.origin}/callback?provider=github`;
}

function cookieForState(state) {
  return `${COOKIE_NAME}=${encodeURIComponent(state)}; Max-Age=${STATE_TTL_SECONDS}; Path=/callback; HttpOnly; Secure; SameSite=Lax`;
}

function clearStateCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/callback; HttpOnly; Secure; SameSite=Lax`;
}

function callbackPage(status, payload) {
  const encoded = JSON.stringify(payload).replace(/</g, "\\u003c");

  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Authorizing Decap CMS</title>
  </head>
  <body>
    <p>Authorizing Decap CMS...</p>
    <script>
      const payload = ${encoded};
      const sendResult = () => {
        if (!window.opener) return;
        window.opener.postMessage(
          "authorization:github:${status}:" + JSON.stringify(payload),
          "*"
        );
        window.removeEventListener("message", receiveMessage, false);
        window.setTimeout(() => window.close(), 150);
      };

      const receiveMessage = () => {
        sendResult();
      };

      window.addEventListener("message", receiveMessage, false);
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
      }
    </script>
  </body>
</html>`);
}

async function exchangeCodeForToken({ code, redirectUri, env }) {
  const body = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_CLIENT_ID,
    client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "jeffef-decap-oauth-worker",
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const message = data.error_description || data.error || `GitHub token exchange failed with ${response.status}`;
    throw new Error(message);
  }

  if (!data.access_token) {
    throw new Error("GitHub did not return an access token.");
  }

  return data.access_token;
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");

  if (provider !== "github") {
    return json({ error: "invalid_provider" }, { status: 400 });
  }

  const scope =
    url.searchParams.get("scope") ||
    (env.GITHUB_REPO_VISIBILITY === "private" ? "repo" : "public_repo");

  const state = randomHex(16);
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl(url));
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorizeUrl.toString(),
      "set-cookie": cookieForState(state),
      "cache-control": "no-store",
    },
  });
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");

  if (provider !== "github") {
    return callbackPage("error", { message: "Invalid provider." });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(request.headers.get("cookie"));
  const savedState = cookies[COOKIE_NAME];

  if (!code) {
    return new Response("Missing code.", {
      status: 400,
      headers: { "set-cookie": clearStateCookie() },
    });
  }

  if (!state || !savedState || state !== savedState) {
    return new Response("Invalid OAuth state.", {
      status: 400,
      headers: { "set-cookie": clearStateCookie() },
    });
  }

  try {
    const token = await exchangeCodeForToken({
      code,
      redirectUri: callbackUrl(url),
      env,
    });

    return new Response(callbackPage("success", { token }).body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "set-cookie": clearStateCookie(),
      },
    });
  } catch (error) {
    return new Response(
      callbackPage("error", {
        message: error instanceof Error ? error.message : "Unknown OAuth error.",
      }).body,
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "set-cookie": clearStateCookie(),
        },
      },
    );
  }
}

function handleHome(request) {
  const url = new URL(request.url);

  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Decap OAuth Worker</title>
  </head>
  <body>
    <h1>Decap OAuth Worker</h1>
    <p>GitHub Pages hosts the Decap admin UI, and this worker handles OAuth.</p>
    <ul>
      <li><code>/auth</code> starts the GitHub OAuth flow.</li>
      <li><code>/callback</code> receives GitHub's authorization response.</li>
    </ul>
    <p>Worker origin: <code>${url.origin}</code></p>
  </body>
</html>`);
}

export default {
  async fetch(request, env) {
    if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
      return json(
        {
          error: "missing_env",
          required: ["GITHUB_OAUTH_CLIENT_ID", "GITHUB_OAUTH_CLIENT_SECRET"],
        },
        { status: 500 },
      );
    }

    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      return handleAuth(request, env);
    }

    if (url.pathname === "/callback") {
      return handleCallback(request, env);
    }

    return handleHome(request);
  },
};

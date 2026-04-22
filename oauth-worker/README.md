# OAuth worker for `/admin`

This worker is the missing auth piece for running Decap CMS on GitHub Pages.

## What it does

- `/auth` redirects the Decap popup to GitHub's OAuth flow
- `/callback` exchanges the GitHub `code` for an access token and sends it back to Decap with `window.postMessage`

That matches the external OAuth proxy flow described in the Decap docs:

- Decap backend overview: https://decapcms.org/docs/backends-overview/
- Decap GitHub backend: https://decapcms.org/docs/github-backend/
- GitHub OAuth app creation: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- GitHub OAuth web application flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

## 1. Create the GitHub OAuth app

In GitHub, create an OAuth App with:

- Homepage URL: the worker base URL
- Authorization callback URL: the worker base URL plus `/callback`

Example:

- Homepage URL: `https://jeffef-oauth.your-domain.workers.dev`
- Callback URL: `https://jeffef-oauth.your-domain.workers.dev/callback`

## 2. Deploy the worker

One simple route is Cloudflare Workers.

1. Copy `wrangler.toml.example` to `wrangler.toml`
2. Adjust the worker name and optional custom domain
3. Set the secrets in Cloudflare:

```bash
wrangler secret put GITHUB_OAUTH_CLIENT_ID
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
```

4. Deploy:

```bash
wrangler deploy
```

If your GitHub repo is private, set `GITHUB_REPO_VISIBILITY = "private"` in `wrangler.toml`.

## 3. Point Decap to the worker

After deploy, edit `public/admin/config.yml` and `public/config.yml` and uncomment:

```yml
backend:
  name: github
  repo: Jeffersonf/jeffef
  branch: main
  base_url: https://your-worker.your-subdomain.workers.dev
  auth_endpoint: auth
```

For this site on GitHub Pages, the admin URL remains:

`https://jeffersonf.github.io/jeffef/admin/`

The callback URL is on the worker, not on GitHub Pages.

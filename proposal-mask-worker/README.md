# Proposal Mask Worker

This Cloudflare Worker is designed to mask the Heyzine flipbook URL `https://heyzine.com/flip-book/6ffda81bd4.html` with your custom domain `proposal.landoffairytales.com`.

## How It Works

1. **Root Requests (`/` or `/index.html`)**: The Worker fetches the target flipbook page from Heyzine, rewrites references to the canonical URL, Open Graph tags, and configuration domains to use `proposal.landoffairytales.com`, and serves the modified HTML.
2. **Sub-paths and API Requests**: All other relative paths (such as stats tracking or layout configurations) are transparently proxied back to `heyzine.com` to ensure all flipbook functionality works seamlessly.

## Configuration

The Worker is configured in `wrangler.toml` with the custom domain route:

```toml
[[routes]]
pattern = "proposal.landoffairytales.com"
custom_domain = true
```

## Deployment Instructions

To deploy this worker to Cloudflare (Rosemary's account):

### Step 1: Install Wrangler CLI (if not already installed)
Wrangler is Cloudflare's official CLI tool. You can run it via `npx` without global installation:

```bash
npx wrangler --version
```

### Step 2: Log In to Rosemary's Account
Run the login command in your terminal. This will open a browser window for you to authenticate:

```bash
npx wrangler login
```

*Note: Alternatively, if you have a Cloudflare API token, you can set it as an environment variable:*
```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
```

### Step 3: Deploy the Worker
From the `proposal-mask-worker` directory, deploy the worker to Cloudflare:

```bash
npx wrangler deploy
```

This will upload the worker script and automatically bind the custom domain route `proposal.landoffairytales.com` to it. If the domain is managed by Cloudflare on Rosemary's account, Cloudflare will automatically set up the DNS records and SSL certificates.

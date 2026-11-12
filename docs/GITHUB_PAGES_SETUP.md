# GitHub Pages setup (click-by-click)

Owner actions. No password, token, or 2FA code is ever needed in chat. If the
owner prefers the assistant to do the GitHub steps, the owner grants the
smallest access (see "If you want help with the GitHub steps" below) and says
"yes" explicitly. Otherwise the owner follows the steps below and sends back
the URLs + any error text.

## Step 0 — Before you start

- Decide the repository name. Suggestion: `apissight` (the decided brand name;
  rename later only if the brand changes — a rename changes the site URL).
- Decide the account: personal account or a new organisation. Personal is
  fine for this release.
- Visibility: **Public**, by owner decision (12 Nov 2026). GitHub Pages on a
  free plan requires a public repository; publishing Pages from a private
  repository needs a paid plan. The early-release protection here is the
  noindex tag + banner — the site URL is public to anyone who has it, and the
  code is public too. If that is not acceptable, do not deploy yet — review
  the zip locally instead.
- Do not upload the original `.h5` files, converted model weights, parity
  images, the report PDF, the poster, or the four local-only documents
  (research findings, open items, access log, outreach drafts) to the repo.
  `.gitignore` already blocks the files; the four documents live outside the
  repo folder. Double-check before pushing.

## Step 1 — Create the repository

1. On github.com, click **+ → New repository**.
2. Owner: your account. Repository name: `apissight`.
3. Visibility: **Public**.
4. Do NOT tick "Add a README file" (this repo already has one).
5. Click **Create repository**. Copy the repository URL shown on the next page.

## Step 2 — Push this code

On your computer, in the unzipped repo folder:

```bash
git init
git add .
git status        # check: no .h5, no model weights, no parity images,
                  # no report PDF, no poster, no .env, none of the four
                  # local-only documents
git commit -m "Early release: site + detector UI (noindex, models pending)"
git branch -M main
git remote add origin https://github.com/<your-username>/apissight.git
git push -u origin main
```

If `git push` asks for a password, use a personal access token as the password
(GitHub no longer accepts account passwords). Create one at
Settings → Developer settings → Personal access tokens → Tokens (classic),
scope `repo` only, short expiry. Never paste the token in chat.

## Step 3 — Set the site variables

In the repository: **Settings → Secrets and variables → Actions → Variables**
tab → **New repository variable**. Add two:

| Name | Value |
|---|---|
| `SITE_URL` | `https://<your-username>.github.io` |
| `BASE_PATH` | `/apissight` |

(Use the real username and repo name. The deploy workflow reads these and
passes them to the Astro build. If the repo is later renamed, update both.)

## Step 4 — Turn on Pages

1. **Settings → Pages**.
2. Under "Build and deployment", set **Source: GitHub Actions**.
3. No other change needed. The `deploy.yml` workflow runs automatically on
   push to `main` and on manual dispatch (Actions tab → "Deploy to GitHub
   Pages" → Run workflow).

## Step 5 — Check the deploy

1. **Actions** tab → "Deploy to GitHub Pages" → latest run → all steps
   green.
2. **Settings → Pages** shows the site URL, e.g.
   `https://<your-username>.github.io/apissight/`.
3. Open it. Check: early-release banner visible, pages load, navigation works.
4. If a run fails: open the failed step, copy the error text, and send it back.

Note: the CI workflow's **launch-gate job is report-only (non-blocking)** for
the early release. It lists remaining blockers without failing the build. Do
not "fix" the gate by removing the markers; clear the underlying items.

## Step 6 — Custom domain (later, after launch approval)

Do not do this step until the brand name and launch are approved.

1. Buy/configure the domain with your registrar (separate decision; nothing is
   bought from this repo).
2. In the repository: **Settings → Pages → Custom domain**, enter the domain,
   Save. This creates a `CNAME` file — commit it if GitHub does not.
3. At your DNS provider, for an apex domain add A records to GitHub Pages IPs
   (as documented by GitHub at time of setup; the master plan §11 lists
   185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 — confirm
   against GitHub's current docs before adding). For a `www` subdomain, add a
   CNAME to `<username>.github.io`.
4. Update repo variables: `SITE_URL` = `https://<domain>`, `BASE_PATH` = `/`.
5. Wait for DNS, then tick **Enforce HTTPS** in Settings → Pages.
6. Flip `allowIndexing` to `true` and `earlyRelease` to `false` in
   `apps/web/src/site.config.ts` ONLY after the launch gate passes and the
   owner approves the full launch.

## What to send back

- Repository URL.
- Deployed site URL (if deployed).
- Screenshots or copied error text for any failed step.

## If you want help with the GitHub steps

Smallest access: the owner connects the GitHub connector (OAuth under the
owner's own GitHub identity) and installs the Muse GitHub App on this one
repository only ("Only select repositories" → `apissight`). No password, token,
or 2FA code is shared. The assistant logs every change in the local access log
(kept outside the public repo). Creating/deleting the repo, pushing to main,
and making anything public still need an explicit owner "yes" each time.

# Model publishing — decision note

Status: **undecided**. No converted weights exist yet, and nothing is
published until two things are true: the ownership/licensing decision is
recorded (local open-items list, IP-1), and the parity run passes (see
`docs/PARITY_REPORT.md`). This note lists the options and the ownership
risks of each. The project lead chooses; the choice is recorded in the
local open-items list before any weights are published.

The detector loads models from one configurable location:
`modelBaseUrl` in `apps/web/src/site.config.ts`. The default serves them
from this site (`/models`). Switching options means changing that one
value (plus the hosting step for that option) — no code changes.

## Option A — Commit the weights to this repository

Converted folders (`stage1/`, `stage2/`) are committed under
`apps/web/public/models/` and served by GitHub Pages with the site.

Risks:

- The repo is public. Committed weights can be downloaded by anyone, and
  removing them later does not retract copies already taken. Git history
  keeps them even after a later commit deletes them.
- Every clone and every deploy carries the full weight files, so the repo
  grows with each model version.
- If ownership or licensing between the university, the industry partner,
  and the team is disputed later, the weights are already public. This is
  why the IP decision must be recorded first.

## Option B — GitHub Release assets

Weights are attached to a GitHub Release (one release per model version),
and `modelBaseUrl` points at the release download URLs. The repo itself
stays small.

Risks:

- Release downloads are public too. Deleting a release removes the
  official copy, but not copies already downloaded.
- The weights still live on GitHub under the same account, so the same
  ownership questions apply; only the exposure mechanics differ.
- Release URLs must stay stable. Renaming or deleting a release breaks
  the live detector until `modelBaseUrl` is updated and redeployed.

## Option C — A separate host

Weights live on storage the team (or the rights holder) controls — for
example object storage, a CDN, a model hub, or university hosting — and
`modelBaseUrl` points there.

Risks:

- Access control is possible (private buckets, signed URLs, referrer
  rules), but it adds an account, possible cost, CORS configuration, and
  a second place that must stay up. If the host lapses, the detector
  breaks.
- The host must serve CORS headers that allow the site's origin, or the
  browser will refuse to load the weights. The service worker can only
  cache them if the host allows it.
- Ownership is clearest when the rights holder hosts, but that needs the
  rights holder's agreement and a named maintainer.

## Rules for every option

- No weights are published before the IP decision (IP-1) is recorded and
  the parity run passes.
- Any change to the weight files — re-conversion, quantization, a new
  model version — needs a fresh parity run before the new files go live.
- The published files must be the exact conversion output, with manifests
  that include the source file hash (see `ml/COLAB_RUNBOOK.md`). Never
  hand-write a manifest for shipped models.
- The original `.h5` files are never published under any option.

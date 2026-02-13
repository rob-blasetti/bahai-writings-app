# iOS TestFlight pipeline (Bahai Writings)

This repo includes a GitHub Actions workflow to build and upload the iOS app to TestFlight.

## Triggers

- On pushes to `main` (typically PR merges), **when relevant files change** (see workflow `paths`).
- On tags matching `v*` (e.g. `v1.4.0`).
- Manually via GitHub Actions (workflow_dispatch).

## Required GitHub Secrets

App Store Connect:
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_KEY_P8` (contents of the `.p8` file)

Signing (match):
- `SIGNING_REPO_SSH_KEY` (SSH private key with access to `rob-blasetti/signing-repo`)
- `MATCH_PASSWORD`

Runtime/build config (injected into iOS Config.xcconfig during build):
- `API_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

## Notes

- Workflow runs `bundle exec fastlane ios beta` by default.
- Uses Yarn (`yarn install --frozen-lockfile`) to match the repo’s lockfile.

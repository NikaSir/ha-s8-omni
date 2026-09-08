# Release policy

## Source of truth

- `main` is the canonical source branch.
- Every public release is produced from a reviewed and green commit already merged to `main`.
- Release tags and published GitHub releases are immutable.
- Release artifacts are produced from committed source, never from an uncommitted working tree.

## Version contract

- `custom_components/s8_omni/manifest.json` contains the SemVer value without a prefix, for example `1.0.0`.
- Runtime diagnostics use the matching display value, for example `v1.0.0`.
- The panel has its own coherent UI version. The first stable release aligns it to `UI v1.0.0`.
- The Git tag and GitHub Release use the matching `v1.0.0` form.
- Routine beta revisions remain in Git history and `CHANGELOG.md`; they are not republished as stable releases.

## Stable release gate

Before publishing a stable release:

1. Repository checks, browser regression and official HACS validation are green.
2. The release candidate passes the physical smoke test in [`TESTING.md`](TESTING.md).
3. `README.md`, `CHANGELOG.md`, `manifest.json`, runtime constants, frontend cache keys and panel metadata describe the same release.
4. No unverified command is promoted into the public integration or panel.
5. Unknown, unavailable and stale telemetry remains explicit and fail-closed.
6. No Tuya Local Keys, cloud credentials, tokens, private identifiers, APK files without a redistributable licence, or private diagnostics are present in tracked files or release artifacts.
7. The release tag points to the exact reviewed `main` commit.

## Publication sequence

1. Freeze functional changes and create one release-only pull request.
2. Run the complete automated gate and the physical smoke checklist.
3. Merge the release pull request into `main`.
4. Record the accepted `main` commit SHA.
5. Create the immutable tag `v1.0.0` on that exact commit.
6. Publish the GitHub Release `v1.0.0` from the tag using the matching changelog section.
7. Confirm that HACS presents `v1.0.0` as the remote version and that a clean install contains only `custom_components/s8_omni/` runtime files.

The repository uses the normal GitHub source archive; `hacs.json` does not enable a separate zip release artifact.

## Post-release development

New protocol work starts from a new prerelease line. Map/Rooms, schedules, manual movement, consumable resets and other complex writes remain excluded until an outbound official-application capture and physical readback prove their exact S8 contract.

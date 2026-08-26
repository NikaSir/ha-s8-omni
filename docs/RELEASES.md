# Update and publication policy

## Source of truth

- `main` is the canonical source branch.
- Every accepted update is traceable to a reviewed pull request and its immutable merged commit.
- Generated assets must be produced from committed source, never from an uncommitted local working tree.
- GitHub Releases and automatic release tags are not used; HACS follows the accepted `main` state.

## Version lineage

Existing project version history must be preserved during GitHub migration. Repository bootstrap is not a functional update.

The integration manifest and panel UI versions support diagnostics, compatibility and cache invalidation. They do not require a Git tag or GitHub Release.

## Publication gate

Before an accepted update is merged into `main`:

1. Repository checks are green.
2. Functional tests for robot and station behavior are complete.
3. `CHANGELOG.md` is updated.
4. No Tuya local keys, cloud credentials, tokens, private identifiers or private diagnostics are present in tracked files or generated assets.
5. The panel passes the required real-phone acceptance checks.

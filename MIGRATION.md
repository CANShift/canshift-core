# Migration status (monorepo → CANShift org)

Split from `tburkhalterr/CANShift` with history. Remaining cutover steps:

1. Create the `canshift` npm org (npmjs.com) and add an automation token as the `NPM_TOKEN` secret here.
2. Tag `v1.0.0` — the publish workflow ships `@canshift/core` with provenance.
3. Tuner and mobile then regenerate their lockfiles against the published package.
4. Transfer `scope:core` issues; flip public.

Versioning: the npm version tracks the package, `CURRENT_SCHEMA_VERSION` keeps tracking the config schema — they are independent.

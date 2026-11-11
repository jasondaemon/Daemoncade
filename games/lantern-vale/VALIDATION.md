# Correction validation · 2026-11-11

Supplied QA finding: `3f010946-9991-4632-bc68-42ac632e1646`, profile
`lantern-campaign`, reported “Dev deployment changed or wrong revision”.
The report contains no scenarios and stopped at the revision gate. It does not
establish a gameplay, artwork, persistence, input or layout failure or pass.
Its requested SHA is `08c28c88b53a7ba3885835b8db2dc4c4ac7c7269`; its observed
deployment commit is `b1e541af179002cdb93c66cb8f9c50c1529a3c7a`.

No game implementation change is justified by this finding. Deployment and
revision-gate changes are outside the approved game-only scope. No revision
markers, security policy, tests, gameplay routes or assets were changed to
work around the gate.

Local validation command:

```sh
node --test games/lantern-vale/*.test.mjs games/lantern-vale/prototype/*.test.mjs games/lantern-vale/assets/gameplay/*.test.mjs
```

Result: exit 0; seven test files passed, zero failed, skipped or cancelled.
These cover campaign rules, content, progression, prototype rules, renderer,
runtime adapter and raster atlas integrity. Inspected the HTML/CSS UI sources,
renderer raster usage, atlas adapter, provenance notes and runtime adapter
assertions. This is local source validation; no deployed browser run or new
visual gameplay acceptance is claimed.

The trusted deployment QA job must assess a stable intended revision before
any browser acceptance conclusion can be drawn. That downstream verification
does not require changing the game to disguise the deployment mismatch.

# X3 Preview & QA Lab v0.1.0-alpha.6

Alpha.6 adds deterministic recovery coverage for the content-volume failures
that are easiest to miss in a small, occasionally connected reader. The public
lab remains synthetic, loopback-only, and unable to contact or flash a device.

## What changed

- Daily Cards V1 now rejects a partial manifest instead of presenting fewer
  than its four fixed slots.
- Inbox V2 models the device's bounded request size of eight changes per page
  and ten-page limit per refresh pass.
- A synthetic 81-item burst proves that the first refresh reports catch-up
  pending after 80 changes, retains the newest 64 items, and converges after a
  second pass without advancing past missing content.
- The normal `8/8/2` cursor, artifact byte/SHA, cache, receipt, action,
  malformed-response, and interrupted-transfer scenarios remain covered.
- The bundled firmware remains the unchanged official CrossPoint Reader
  `v1.5.0` baseline. It is inspected read-only and is never executed or flashed.

## Evidence boundary

The new behavior is MODELED / SYNTHETIC and REAL LOOPBACK CONTRACT evidence.
It does not prove the companion custom firmware on physical X3 hardware, real
E-Ink output, ADC buttons, microSD interruption safety, radios, RTC wake,
watchdog timing, fragmented heap, battery use, or board power.

For device-side source and a separately validated, endpoint-free public
candidate, use the companion
[XTINCT X3 Reference Stack](https://github.com/RO11/xtinct-x3-reference-stack).
Keep both projects at prerelease status until their outstanding physical and
outside-tester gates are recorded against the exact published artifacts.

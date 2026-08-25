# X3 Preview & QA Lab v0.1.0-alpha.4

This is the first public alpha candidate of the unofficial X3 Preview & QA Lab for Windows.

## Download

Download `X3-Preview-QA-Lab-Windows-v0.1.0-alpha.4-bundled-python.zip`, extract the complete folder, then double-click `Launch X3 Preview QA Lab.cmd`.

The ZIP includes the official 64-bit CPython 3.14.7 embeddable runtime, so a separate Python installation is not required.

## Recommended operating model

This is currently an AI-first alpha. It was developed and exercised with an AI coding/browser agent managing verification, launch, navigation, scenario selection, and evidence reporting. Unguided human-only use has not been usability-tested.

For best results, give an AI assistant access to the extracted folder and local browser, then ask it to follow [`docs/AI_AGENT_WORKFLOW.md`](docs/AI_AGENT_WORKFLOW.md). The lab does not contain an AI model and does not require an AI API key.

ZIP SHA-256:

```text
0b879482ca03ccd069bcf0e1c035ac582c35b7ac10a5a4fe248189394870b931
```

## Included

- A `528 x 792`, four-gray browser preview for the Xteink X3.
- Modeled button navigation, Files, Recents, readers, settings and sleep/wake flows.
- Synthetic Daily Cards V1 and Inbox V2 loopback scenarios.
- Cursor paging, cache, receipt retry, deletion/open actions and malformed/interrupted response scenarios.
- A read-only copy of the official stable CrossPoint Reader v1.5.0 `firmware.bin` baseline, verified at 5,544,112 bytes with SHA-256 `a7087155757bc63c1fcf60ae8d60a3760ce6d3406aaf7b9f23d0025244434f08`.

## Safety boundary

- The server binds only to `127.0.0.1` and performs no outbound HTTP.
- The lab has no physical-device discovery, upload or flashing path.
- The included firmware baseline is inspected but never executed or installed automatically.
- No private XTINCT firmware, Xteink stock firmware, credentials, device dumps or production content are included.

## Evidence boundary

The package passed the local JavaScript, Python, release-engineering, deterministic-build and sanitization checks. Results labeled **MODELED** are not embedded firmware execution. Source-bound **REAL CONTRACT TEST** evidence applies only to the frozen compatible firmware checkout used to build the candidate. QEMU and physical X3 behavior are separate gates.

This alpha still needs AI-guided clean-machine feedback from three outside testers. Unguided human-only usability is also unverified. It does not prove real E-Ink waveform or ghosting, physical buttons, microSD power-loss behavior, Wi-Fi/BLE behavior, RTC wake, fragmented heap, watchdog timing or battery use.

Please report only synthetic reproductions. Do not attach private books, firmware, credentials, logs containing host paths, or device dumps.

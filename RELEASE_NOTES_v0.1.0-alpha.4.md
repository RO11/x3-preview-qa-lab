# X3 Preview & QA Lab v0.1.0-alpha.4

X3 Preview & QA Lab is an unofficial, local Windows tool for people designing, modifying, or testing CrossPoint experiences for the Xteink X3. It provides a fast approximation of the reader's four-gray screen and controls, plus repeatable Daily Cards and Inbox protocol scenarios, without repeatedly flashing a physical device.

This release is a public alpha: useful for development and early QA, but deliberately explicit about the difference between a browser model, a protocol test, an emulated CPU boot, and proof from real hardware.

> **AI-first alpha:** This version was developed and exercised with an AI coding/browser agent supervising verification, launch, navigation, scenario selection, and evidence reporting. That is currently the best-supported way to use it. A person can operate the visible controls directly, but unguided human-only use has not yet been usability-tested. The lab contains no AI model, needs no AI API key, and does not send project data to an AI service. See the [AI-first operating guide](https://github.com/RO11/x3-preview-qa-lab/blob/main/docs/AI_AGENT_WORKFLOW.md).

## Why this exists

X3 development otherwise creates a slow feedback loop: build firmware, transfer it, reboot the reader, navigate to the changed screen, and then repeat the whole process for every normal and failure case. Hardware testing remains essential, but it is a poor place to discover basic layout, navigation, paging, cache, or malformed-response errors.

The lab shortens that loop. It lets a developer or AI assistant explore product flows on a Windows PC, replay deterministic content-service cases, and produce an evidence report before spending time on firmware builds and physical-device checks.

It complements the [official CrossPoint Simulator](https://github.com/crosspoint-reader/crosspoint-simulator); it does not replace it. The official simulator remains the preferred route for shared firmware rendering. This lab concentrates on Windows-friendly product-flow preview, synthetic network contracts, failure injection, and explicit QA boundaries.

## What you can do

### Preview the X3 experience

- Work inside a `528 x 792` portrait canvas matching the X3 display geometry.
- See all output clamped to the X3's four native gray levels.
- Navigate with clickable controls or keyboard equivalents for Back, Confirm, Left, Right, Up, Down, and a modeled completed power hold.
- Walk through modeled Home, Inbox, Daily Cards, Files, Recents, TXT and EPUB readers, Settings, Crash Report, Pocket Sync, File Transfer, and sleep/wake flows.
- Open items, advance through lists, invoke actions, remove synthetic items, and record synthetic feedback.
- Exercise a disposable per-browser-session SD-card model without touching a real card.

### Test Daily Cards V1 and Inbox V2 behavior

The local loopback service can replay both successful and deliberately broken cases, including:

- valid Cards V1 reports and Inbox V2 manifests/artifacts;
- `8/8/2` cursor paging and end-of-feed behavior;
- ETag and cache-first paths;
- exact artifact bytes, SHA-256, MIME type, revision, and manifest checks;
- receipt batching, duplicate suppression, retry, and outbox behavior;
- opening, deletion, and feedback actions;
- interrupted or short artifacts and reports;
- malformed JSON, invalid payloads, and HTTP failures;
- missing configuration, no Wi-Fi, unsynchronized clock, and storage-preflight failures; and
- the Today EPUB reading path.

These are synthetic, deterministic scenarios. They do not contact a production service or a physical X3.

### Inspect a known public firmware baseline

The package includes an unchanged, read-only copy of the official stable CrossPoint Reader `v1.5.0` `firmware.bin` as a community reference:

- Size: `5,544,112` bytes
- SHA-256: `a7087155757bc63c1fcf60ae8d60a3760ce6d3406aaf7b9f23d0025244434f08`
- Policy: `bundled-official-baseline-read-only`
- Evidence: inspected, not executed

The lab reports its metadata and verifies its identity. It never uploads, installs, boots, or flashes that image. The package contains no private XTINCT firmware and no Xteink stock firmware.

## How it was made

The lab intentionally uses a small, inspectable architecture:

- A Python standard-library loopback server owns the synthetic sessions, content endpoints, fixture delivery, failure injection, and report export.
- A static HTML/CSS/JavaScript client renders the modeled X3 surface and implements navigation and preview state.
- The server binds only to `127.0.0.1`; the application has no outbound HTTP path and no device-discovery or firmware-transfer path.
- The end-user demo needs neither Node.js nor PlatformIO. Alpha.4 bundles the official 64-bit CPython `3.14.7` Windows embeddable runtime, with automatic `site` import disabled, so a separate Python installation is unnecessary.
- Development tests use Node.js 20 or newer, Python, and a C++ compiler for the small source-parity gate.

The public package is built from an explicit allowlist rather than copying a working directory wholesale. The release builder:

1. selects only approved public source, documentation, synthetic fixtures, the pinned Python runtime, and the one explicitly allowed public firmware baseline;
2. rejects links, secrets, personal paths, production data, device dumps, and unapproved firmware-like files;
3. normalizes archive ordering, timestamps, and permissions for a deterministic ZIP;
4. writes a per-file `FILES.SHA256` manifest inside the archive;
5. emits schema-2 `release-metadata.json` with the target, policies, payload digest, builder hash, demo-contract hash, source epoch, and source-state context; and
6. emits a separate `.sha256` file for the final ZIP.

The frozen artifact records `dirty: true` as source-state provenance rather than concealing it. Its authoritative identities are the explicitly transformed public-payload digest and the final ZIP hash. The published archive was also downloaded again and its bytes matched the expected SHA-256.

## Download and quick start

Download `X3-Preview-QA-Lab-Windows-v0.1.0-alpha.4-bundled-python.zip`, then:

1. Verify its SHA-256 against the value below.
2. Extract the **entire** ZIP to a normal folder. Do not launch it from inside the archive.
3. Double-click `Launch X3 Preview QA Lab.cmd`.
4. Confirm that the page opens on a `127.0.0.1` address.
5. Try Home and Inbox, then open **Network** and run one normal Cards + Inbox scenario and one interrupted or malformed-response scenario.
6. Stop the lab cleanly with `Ctrl+C` in the launcher window.

For the strongest current workflow, give an AI coding/browser assistant access to the extracted folder and local browser, then use the ready-made prompt and report format in the [AI-first operating guide](https://github.com/RO11/x3-preview-qa-lab/blob/main/docs/AI_AGENT_WORKFLOW.md). Do not provide credentials, private books, private firmware, device dumps, or production endpoints.

## What is inside the ZIP

- The loopback QA server and static browser client.
- Synthetic Daily Cards V1 and Inbox V2 fixtures and failure cases.
- The Windows launcher.
- Bundled CPython `3.14.7` amd64 embeddable runtime.
- Release profile, machine-readable metadata, and internal per-file checksums.
- Documentation, testing notes, security guidance, license, and third-party notices available at the time the archive was frozen.
- The read-only CrossPoint Reader `v1.5.0` firmware baseline described above.

The QEMU runtime, firmware build outputs, private forks, credentials, real content, and physical-device tools are not included.

## Evidence model

The UI and reports keep four kinds of evidence separate:

- **MODELED** — JavaScript/Python state and screen behavior. This is not embedded firmware execution.
- **REAL CONTRACT TEST** — bounded loopback HTTP exchanges were checked against the compatible source contract in the full development checkout. The private compatible fork is intentionally absent from this standalone public repository, so users cannot independently reproduce this source-bound gate from this repository alone.
- **QEMU** — optional ESP32-C3 CPU and boot evidence. No QEMU runtime or complete same-build boot set is distributed in this release, and the bundled OTA image alone cannot boot QEMU.
- **PHYSICAL DEVICE REQUIRED** — behavior that can only be established on the exact firmware and real X3 hardware.

The four-gray browser surface is a browser-font, mirrored-renderer approximation. It is designed to reveal product-flow and contract problems quickly; it is not a pixel-identical rendering of CrossPoint firmware.

## Important limitations

This release does **not** prove:

- real E-Ink waveform behavior, refresh quality, ghosting, or sleep-screen appearance;
- ADC-ladder button timing, holds, bounce, or physical navigation feel;
- microSD behavior during brownouts, interrupted writes, or power loss;
- Wi-Fi or Bluetooth radio behavior, hotspot compatibility, or transfer reliability;
- RTC wake scheduling, deep sleep, IMU behavior, or wake causes;
- fragmented-heap behavior, peak free heap, largest free block, task stack high-water marks, or watchdog timing;
- battery life, board power behavior, thermal behavior, or long-duration endurance;
- installation or operation of the included CrossPoint firmware baseline; or
- successful operation by an unguided human on a clean PC.

It also does not reproduce the firmware renderer byte-for-byte. Passing the lab means a modeled flow or bounded contract behaved as expected; it does not mean a firmware image is ready to flash or that an X3 has been physically verified.

Three independent AI-guided clean-machine testers are still required before this can be described as broadly validated. Human-only discoverability and usability need a separate test pass. Windows is the packaged target; the public source test suite is also exercised on Ubuntu, but no Linux binary bundle is supplied.

The alpha.4 ZIP was byte-frozen before the current AI operating guide was added. The canonical guide is therefore hosted in the repository and will be included in future packages. The tag and downloadable files remain frozen so their published hashes stay meaningful.

## QA completed for this candidate

The candidate passed:

- deterministic package construction and repeat-build comparison;
- source-tree and finished-archive sanitization;
- JavaScript loopback and modeled-flow tests;
- Python behavior, server, and QEMU-unit tests;
- release-engineering and packaged-launch checks;
- exact baseline/runtime identity checks; and
- the public Windows and Ubuntu GitHub Actions documentation/source suite.

At the current public source revision, the suite contains 42 JavaScript checks, 76 Python checks, and 3 release-engineering checks. Two Windows symlink cases are expected to skip when the host cannot create symlinks. Automated checks establish package integrity and modeled software behavior—not the physical-device items listed above.

## Privacy and safety

- The server listens only on `127.0.0.1`.
- The lab performs no outbound HTTP.
- It has no serial, WebDAV, Bluetooth, X3 discovery, upload, or flashing feature.
- Synthetic browser-session state is disposable.
- The exported bug bundle is allowlisted and privacy-filtered.
- No credentials, private books, device dumps, production endpoints, OEM images, or private firmware are included.

Please report only synthetic reproductions. Never attach credentials, private SD contents, private books, device dumps, or logs containing personal host paths. Use the private process in [SECURITY.md](https://github.com/RO11/x3-preview-qa-lab/blob/main/SECURITY.md) for security issues.

## Artifact identity

Windows ZIP:

```text
X3-Preview-QA-Lab-Windows-v0.1.0-alpha.4-bundled-python.zip
16,727,675 bytes
SHA-256 0b879482ca03ccd069bcf0e1c035ac582c35b7ac10a5a4fe248189394870b931
```

Bundled CPython source archive:

```text
python-3.14.7-embed-amd64.zip
12,673,227 bytes
SHA-256 d297e5ff019966817ad8502465176139f2d3d840fa4ed84b13bed399a6ab1f15
```

Public payload digest recorded in the release metadata:

```text
df8db0a92456ba1c28111ac54b8ac50965635a0c0a66cce42051742fa91ea16d
```

## Feedback and community

- Read the full [README](https://github.com/RO11/x3-preview-qa-lab#readme).
- Follow the [AI-first operating guide](https://github.com/RO11/x3-preview-qa-lab/blob/main/docs/AI_AGENT_WORKFLOW.md).
- Use the [beta checklist](https://github.com/RO11/x3-preview-qa-lab/blob/main/BETA_TEST_CHECKLIST.md) for a structured clean-machine pass.
- Join the [CrossPoint community discussion](https://github.com/crosspoint-reader/crosspoint-reader/discussions/3208).
- Report reproducible public issues in the [issue tracker](https://github.com/RO11/x3-preview-qa-lab/issues).

MIT licensed. CrossPoint and Xteink names belong to their respective owners; this unofficial project is not endorsed by them.

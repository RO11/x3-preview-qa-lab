# AI-first operating guide

X3 Preview & QA Lab is currently best used with an AI coding/browser agent that can read local files, run commands, and control a local browser. The lab itself contains no AI model, requires no AI API key, and sends no prompt or project data to an AI service. "AI-first" describes the recommended operator workflow.

## Current usability evidence

- The alpha was developed, launched, navigated, and QA-checked with an AI agent supervising the workflow.
- Automated Windows and Ubuntu tests cover the software contracts and modeled behavior.
- Unguided, human-only operation has not been usability-tested.
- The visible controls remain available for manual use, but their discoverability and instructions should be treated as unverified until outside users test them.

For the strongest current experience, give an AI assistant the extracted folder and ask it to follow this document before opening the lab.

The published alpha.4 ZIP was byte-frozen before this guide was added. Keep that verified archive unchanged and give the AI the canonical online guide at <https://github.com/RO11/x3-preview-qa-lab/blob/main/docs/AI_AGENT_WORKFLOW.md> when the extracted folder does not contain it. Future packages include the guide through the public-package allowlist.

## What the agent needs

- Local read access to the extracted release folder.
- Permission to run the bundled launcher.
- Browser access to the loopback page opened by the launcher.
- No X3, serial port, Wi-Fi credential, account credential, API key, or private firmware.

The agent must stop if the server tries to bind anywhere other than `127.0.0.1`, if an unexpected outbound request appears, or if the package hash does not match the published release.

## Release verification

Before launch, verify the downloaded ZIP:

```powershell
(Get-FileHash -LiteralPath '.\X3-Preview-QA-Lab-Windows-v0.1.0-alpha.4-bundled-python.zip' -Algorithm SHA256).Hash.ToLowerInvariant()
```

Expected SHA-256:

```text
0b879482ca03ccd069bcf0e1c035ac582c35b7ac10a5a4fe248189394870b931
```

Extract the complete ZIP. Do not run the launcher from inside the archive.

## Prompt for an AI assistant

Paste this prompt into an AI coding/browser assistant that has access to the extracted folder:

```text
Operate this extracted X3 Preview & QA Lab as a local, read-only QA session.

1. Read README.md, docs/FIRMWARE_TESTING.md, release-profile.json, and
   release-metadata.json before launch. Read docs/AI_AGENT_WORKFLOW.md from the
   folder when present, or use the canonical online guide linked above.
2. Verify that the release is v0.1.0-alpha.4 and that the packaged firmware
   policy is bundled-official-baseline-read-only with device_access set to none.
3. Launch "Launch X3 Preview QA Lab.cmd" only after I authorize running it.
4. Confirm that it binds only to 127.0.0.1 and opens the local browser UI.
5. Navigate Home and Inbox, open one item, then run one normal Cards + Inbox
   scenario and one interrupted or malformed-response scenario.
6. Keep MODELED, REAL CONTRACT TEST, QEMU, and PHYSICAL DEVICE REQUIRED evidence
   separate. Never claim that the lab flashed, booted, or physically tested an X3.
7. Do not enter credentials, private books, private firmware, device dumps, or
   production endpoints. Do not attempt device discovery or firmware transfer.
8. Report exact passes, failures, skipped checks, the release version, and the
   limits that still require physical hardware.
```

## Recommended first pass

The AI should complete these visible flows:

1. Confirm the page identifies the package as an unofficial alpha and shows the `528 x 792` four-gray modeled surface.
2. Open Inbox and exercise Confirm, directional navigation, and Back.
3. Open Network and run the normal Cards + Inbox scenario.
4. Run one interrupted artifact or malformed-response scenario and confirm that it fails safely without silently advancing the cursor.
5. Review the evidence labels and confirm that the official CrossPoint `v1.5.0` baseline is read-only and not executed.
6. Stop the launcher cleanly with `Ctrl+C`.

## Report format

Ask the AI to return:

```text
Release:
ZIP SHA-256 checked:
Launch result:
Loopback address:
Normal scenario:
Failure scenario:
Modeled flows checked:
Skipped or unavailable:
Physical-device gates still open:
Unexpected outbound traffic or private data:
```

## Human-only use

A person can launch the lab and use the on-screen controls without an AI assistant, but that path is currently unvalidated. If you try it without AI guidance, please report where instructions are unclear, which controls are hard to discover, and whether you can complete the recommended first pass without opening this guide again.

# X3 Preview & QA Lab v0.1.0-alpha.5

Alpha.5 is the first package to include the expanded AI-first guide, the
sanitized Cards V1 / Inbox V2 architecture write-up, and native-resolution
Inbox previews in the downloadable Windows bundle.

## What changed

- Replaced the enlarged low-resolution Inbox composite with two lossless,
  native `528 x 792` modeled captures: the default Inbox card view and an
  opened synthetic text artifact.
- Corrected the public description of the Inbox. The primary view is the
  Cards-style preview used by the compatible firmware; the compact Browse List
  is a secondary view.
- Documented the implemented content modules and their producer roles without
  including real mailboxes, addresses, prompts, content, project names,
  credentials or deployment endpoints.
- Included `AI_AGENT_WORKFLOW.md` in the package and changed verification to
  compare the ZIP with its separately downloaded checksum asset. The archive no
  longer tries to contain a self-referential checksum for itself.
- Retained deterministic packaging, per-file manifests, path/payload privacy
  scanning, loopback-only operation and the reviewed CPython 3.14.7 embedded
  runtime.

## Cards V1 and Inbox V2

Daily Cards V1 models a fixed, glanceable briefing surface. Each card has a
bounded identifier, revision, renderer metadata, immutable report bytes and a
checksum. The lab tests conditional refresh, cache behavior and safe failure.

Inbox V2 models a cursor-paged stream of richer deliveries. Each delivery
references an immutable SHA-addressed artifact and may expose open, delete,
like or dislike actions. The loopback contract covers paging, exact bytes and
hashes, interrupted transfers, cursor safety, receipts, deduplication and
retryable outbox behavior for text, EPUB, image and native sleep-screen routes.

The included examples are synthetic. ChatGPT, Gemini/Spark, Grok or a
deterministic script can act as a producer in a separate private system, but no
AI service, mailbox or cloud account is included or contacted by this lab.

## Firmware context

The package still bundles only the unchanged official CrossPoint Reader v1.5.0
firmware as a read-only, hash-checked baseline. It does not bundle, execute,
upload or flash the companion XTINCT custom candidate.

For device-side source and installable candidate artifacts, use the companion
[XTINCT X3 Reference Stack](https://github.com/RO11/xtinct-x3-reference-stack).
At the time of this release, that repository's public custom image is
`1.6.2-xtinct.1`, 6,481,008 bytes, SHA-256
`b689b26b47f08e7df955c8a5bbd6453d1f11562b99a161c45af7f913b99c71f4`,
from frozen source SHA-256
`c001a496408cdb05fe7e45621dcdc07be602d655ad992f055dbfb8499fd041b7`.
That identity is context only and is not an executable input to the Preview Lab.

## Evidence boundary

Alpha.5 exercises modeled screens and real loopback protocol contracts. It does
not prove physical E-Ink output, ADC-ladder buttons, microSD power interruption,
Wi-Fi/Bluetooth radio behavior, fragmented heap, watchdog timing, RTC wake,
battery use or recovery. Those remain exact-firmware physical-X3 gates.

The custom Inbox V2 path must not be called stable until a physical X3 test is
recorded against its exact firmware SHA. Three independent AI-guided
clean-machine usability rows also remain pending for this Windows package.

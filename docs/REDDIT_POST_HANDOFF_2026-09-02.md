# Reddit post handoff — 2026-09-02

Status: **BLOCKED_HUMAN_CAPTCHA**

Submission state: **Nothing was submitted.**

Resume only after the user completes Reddit's CAPTCHA in the existing signed-in
session. Recheck the title, body, and images below, submit once, then read back and
record the live post URL. Do not retry blindly or claim publication from a filled form.

## Approved title

I built an Xteink X3 once-a-day briefing system: Cards V1 + Inbox V2 (open source, AI-assisted)

## Approved body

AI-assistance disclosure: I designed and tested this project with ChatGPT/Codex helping with implementation, QA, documentation and the fictional public demo copy. This is my personal, free/open-source project, not sponsored content. I will stay around to answer questions and take criticism.

I use a small Xteink X3 as something I deliberately check once a day. I wanted it to collect a useful, bounded set of material while it sleeps instead of turning it into another constantly updating notification screen.

The result is an unofficial CrossPoint-based system called XTINCT. The most important design choice was not forcing everything into one feed.

CARDS V1

V1 is a tiny dashboard with exactly four replace-in-place cards:

• a morning market briefing
• a weekday opportunity scan
• a weekly 3D-job scan, clearly marked WEEKLY
• an attention watch for things that need a same-day human look

The complete four-card manifest is replaced atomically. That keeps the dashboard predictable and lets it open from a verified cache when the network fails.

INBOX V2

V2 is for longer, independent items. It is an immutable, cursor-paged inbox with byte/SHA verification, local caching, open and delete actions, and a retryable feedback outbox.

The public demo includes the content types I have actually implemented: Reader Genome recommendations, an original E-Ink serial, a Daily Puzzle page, Project Watchlist, Business Opportunities, Hardware Research and a Weekend City Guide. Some items support Like/Dislike; others use Keep/Archive or Open on phone.

WHY TWO FEEDS?

A four-card status board and a growing reading queue have different replacement, paging, deletion and feedback rules. Combining them made both harder to understand and less reliable. V1 is replaced as one small daily unit. V2 preserves individual items and their action history. A Today/Radar EPUB remains a third, separate daily reading surface.

THE STOCK-MARKET EXAMPLE

The screenshots show a fictional Market Briefing with invented companies and values. The production pattern is ChatGPT using the official Interactive Brokers app for bounded, read-only analysis, followed by a sanitized V1 handoff. The public project contains no account details, positions, order identifiers or live quotes and it cannot place a trade.

WHAT IS PUBLIC

Preview & QA Lab:
https://github.com/RO11/x3-preview-qa-lab

This is a Windows-friendly lab with a bundled runtime, native 528 × 792 four-gray previews, normal and failure scenarios, contract tests, and clearly separated evidence labels.

Sanitized firmware/source reference:
https://github.com/RO11/xtinct-x3-reference-stack

This contains the device-side source, V1/V2 contracts, build and installation documentation, and checksum-bound release artifacts. The current custom firmware is still labeled as a beta candidate, not a stable physical-device claim.

LIMITATIONS

The lab works best when an AI assistant drives the scenarios and explains the evidence, although no AI model or API key is built into it. Simulator and QEMU passes do not prove the physical E-Ink waveform, buttons, microSD power-loss behavior, radios, RTC wake, fragmented heap, watchdog timing or battery life. Those remain separate tests on the real device.

The attached images are exported at native X3 proportions or clean 2× nearest-neighbor scale. They are modeled screens, not photographs of physical E-Ink output.

I would especially appreciate feedback on whether the Cards V1 / Inbox V2 split makes sense at a glance, which once-a-day modules would be useful to other people, and whether the information density feels right for a 528 × 792 display.

## Image order and verified hashes

1. `docs/images/engagement/xtinct-x3-native-showcase-2x.png` — SHA-256 `60112FAE8E6CE2DA215D5F5B1436C2687A3BF3F237729D4928C18EB75F61D9C6`; `167661` bytes.
2. `docs/images/engagement/xtinct-implemented-content-map-2400x1740.png` — SHA-256 `8107FE396335066FE8785D3B986D9A5E1C86A6A08AA02D7D5318E26DC76C3D45`; `201707` bytes.
3. `docs/images/engagement/daily-cards-v1-market-briefing-2x-1056x1584.png` — SHA-256 `93F9E68F34965AB8F0956D6EA51812A71217B4491834C023949AFEDE352D4213`; `22223` bytes.

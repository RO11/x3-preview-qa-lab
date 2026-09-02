# Reddit post handoff — 2026-09-02

Status: **POSTED_AND_READBACK_VERIFIED**

Submission state: **Published exactly once to `r/eink` and verified at the direct URL.**

The user explicitly instructed publication after the inline-image layout was corrected.
Reddit accepted the post without presenting a CAPTCHA. Direct readback verified the
title, author, AI disclosure, recurring-scheduled-task explanation, official Interactive
Brokers app provenance, both GitHub links, three inline images, and the intended image
order. Reddit discarded the optional image captions on save, so the useful-content
explanation is preserved in the post body instead.

## Published outcome

- State: `POSTED_AND_READBACK_VERIFIED`
- Subreddit: `r/eink`
- Author: `u/Roin1`
- Latest edit verified: 2026-09-02 19:50 Australia/Brisbane
- Permalink:
  `https://www.reddit.com/r/eink/comments/1w50e4s/i_built_an_xteink_x3_onceaday_briefing_system/`
- Post count: one
- Inline order: six-panel useful-content gallery after the scheduled-task explanation;
  V1/V2 content map after “Why two feeds?”; opened fictional market report after the
  stock-market explanation
- Live readback: three post images; no duplicate post; useful-content appendix present
- Linked repositories: both `RO11/x3-preview-qa-lab` and
  `RO11/xtinct-x3-reference-stack` changed from private to public after the first
  anonymous check exposed the 404. At 2026-09-02 20:16 Australia/Brisbane, an
  unauthenticated GitHub API read reported `visibility=public` for both; the preview
  README and lead image also returned HTTP 200 without credentials.

Do not submit this body again. Any future Reddit publication is a separate operation
that requires a duplicate check and fresh user authorization.

## Approved title

I built an Xteink X3 once-a-day briefing system: Cards V1 + Inbox V2 (open source, AI-assisted)

## Originally approved body

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

## Published useful-content appendix

WHAT THE NEW SCREENSHOTS SHOW

The lead gallery now shows the useful path rather than only navigation: the compact Cards V1 market summary beside the full report it opens, plus opened Project Watchlist, Business Opportunities, Hardware Research and Reader Genome pages. These are fictional examples with invented companies and values, but their structure mirrors the scheduled content I receive.

The standalone market image is the opened report, not just its card: overnight context, a three-holding decision lens, catalysts, risks and an explicit no-trade boundary. In my private setup, ChatGPT uses the official Interactive Brokers app for bounded read-only analysis before a sanitized V1 handoff; the public demo contains no account details, live positions, order identifiers or live quotes, and it cannot place trades.

## Image order and verified hashes

1. `docs/images/engagement/xtinct-x3-native-showcase-2x.png` — SHA-256 `17171277108419266B5126F0AA5B905C9C504EB2C7D2C447622D164FFAD3AFBE`; `196102` bytes; Reddit media ID `b8tkydtxu2nh1`.
2. `docs/images/engagement/xtinct-implemented-content-map-2400x1740.png` — SHA-256 `8107FE396335066FE8785D3B986D9A5E1C86A6A08AA02D7D5318E26DC76C3D45`; `201707` bytes; Reddit media ID `3146y77td1nh1`.
3. `docs/images/engagement/daily-cards-v1-market-briefing-report-2x-1056x1584.png` — SHA-256 `0FB79F2987C74A091F0350B732B2431F0F6952C21027972BA3EF996BFBDE2B6E`; `23388` bytes; Reddit media ID `p1ob86k0v2nh1`.

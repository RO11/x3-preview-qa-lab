import {
  MAX_RECORDED_INPUTS,
  appendInputAction,
  createInputRecording,
  createSanitizedBugBundle,
  createState,
  decodeX3Bmp,
  deriveFirmwareContext,
  inboxActions,
  reduceInput,
  validateInputRecording
} from "./simulator-core.js";
import {
  NetworkContractError,
  SyntheticNetworkController,
  X3NetworkModel,
  normalizeSyntheticNetworkOverrides
} from "./network-model.js";
import { X3Renderer } from "./x3-renderer.js";

const canvas = document.querySelector("#x3-screen");
const renderer = new X3Renderer(canvas);
const nativeFrameExport = document.querySelector("#native-frame-export");
let fixtures;
let state;
let contract = null;
let firmware = null;
let qemu = null;
let release = null;
let sdEntries = [];
let networkScenarios = null;
let networkServerStatus = null;
let networkBusy = false;
let inputRecording = createInputRecording();
let recordingEnabled = true;
let recordingStartedAt = performance.now();
let replayBusy = false;
let recordingMessage = "Ready to capture a reproducible input sequence.";
let visualBaseline = null;
let visualCandidate = null;
let visualSummary = null;
const syntheticNetwork = new SyntheticNetworkController(globalThis.fetch.bind(globalThis));
const networkModel = new X3NetworkModel(syntheticNetwork.fetch.bind(syntheticNetwork));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.download = filename;
  link.href = objectUrl;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function publicDemoFixtures(raw) {
  const cardTemplates = [
    {
      taskId: "market-briefing",
      title: "Market Briefing - FICTIONAL",
      summary: "CADENCE: MON-SAT / 03:00 - Imaginary markets ended mixed as the Meridian 50 rose and Copperline metals eased.",
      metrics: [
        { value: "MON-SAT / 03:00", label: "CADENCE" },
        { value: "+0.4%", label: "MERIDIAN 50" },
        { value: "-0.7%", label: "COPPERLINE" }
      ],
      sections: [
        { heading: "OVERNIGHT", lines: ["Glasswing Energy lifted the Meridian 50", "Copperline metals cooled after a four-day rise"] },
        { heading: "WATCH", lines: ["Harbor Bond yield held at an invented 3.2%"] },
        { heading: "PRODUCER PATH", lines: ["ChatGPT + Interactive Brokers app pattern", "Fictional values; read-only; no trades"] }
      ],
      pages: [
        `FICTIONAL MARKET BRIEFING

TUE 02 SEP · MON-SAT / 03:00

OVERNIGHT
Meridian 50 +0.4%. Glasswing Energy led after an invented grid-storage contract.

Copperline Metals -0.7% as the fictional ore basket cooled after four stronger sessions.

PORTFOLIO LENS
Northstar Compute — HOLD. Momentum is positive, but valuation leaves little margin for error.

Harbor Grid — WATCH. A breakout still needs volume confirmation.

Tideglass Health — REVIEW. Its imaginary trial date is the next decision point.

DEMO DATA ONLY · NO TRADES`,
        `CATALYSTS

10:00 — Meridian manufacturing survey
12:30 — fictional central-bank remarks
After close — Northstar Compute update

RISKS
An energy-led index can hide weak breadth. Copperline's reversal may matter if it persists for two more sessions.

ONE DECISION
Do nothing at the open. Recheck Harbor Grid only if volume exceeds its invented 20-day average.

SOURCE PATH
Scheduled ChatGPT task + Interactive Brokers app pattern. Read-only analysis; no order creation or modification.

Every company, price, event and holding shown here is invented.`
      ],
      hasReport: true
    },
    {
      taskId: "weekday-freelancer-scan",
      title: "Opportunity Scan - FICTIONAL",
      summary: "CADENCE: WEEKDAYS / 08:00 - One invented studio brief is a strong fit; two need more evidence.",
      metrics: [
        { value: "WEEKDAYS / 08:00", label: "CADENCE" },
        { value: "1", label: "STRONG FIT" },
        { value: "2", label: "WATCH" }
      ],
      sections: [
        { heading: "BEST LEAD", lines: ["Maple Arc Studio wants a compact E-Ink prototype", "First action: prepare a two-screen mockup"] },
        { heading: "BOUNDARY", lines: ["Fictional company and opportunity", "No application or external contact"] }
      ],
      hasReport: true
    },
    {
      taskId: "3d-job-search",
      title: "3D Job Search - WEEKLY",
      summary: "CADENCE: WEEKLY / MON 08:00 - Two fictional 3D roles match the demo profile; one is remote-friendly.",
      metrics: [
        { value: "WEEKLY / MON 08:00", label: "CADENCE" },
        { value: "2", label: "MATCHES" },
        { value: "1", label: "REMOTE" }
      ],
      sections: [
        { heading: "SHORTLIST", lines: ["Lantern Foldworks - realtime environment artist", "Paper Harbor - procedural tools generalist"] },
        { heading: "NEXT", lines: ["Review a fictional portfolio brief on the phone"] }
      ],
      hasReport: true
    },
    {
      taskId: "outlook-attention-watch",
      title: "Attention Watch - FICTIONAL",
      summary: "CADENCE: WEEKDAYS / 03:30 - One invented message needs a same-day decision; routine mail stays off the reader.",
      metrics: [
        { value: "WEEKDAYS / 03:30", label: "CADENCE" },
        { value: "1", label: "TODAY" },
        { value: "4", label: "FILTERED" }
      ],
      sections: [
        { heading: "NEEDS ATTENTION", lines: ["Approve the fictional Tideglass prototype window"] },
        { heading: "PRIVACY", lines: ["No sender, address or message body is shown"] }
      ],
      hasReport: true
    }
  ];
  const inboxTemplates = [
    {
      moduleId: "spark-serial-demo",
      kind: "text",
      title: "Spark Serial: The Paper City",
      summary: "A courier enters a station where tomorrow's notices are already printing - and one bears her own name.",
      points: ["Original fiction with a two-line recap", "Like or dislike joins the feedback queue"],
      actions: ["like", "dislike"],
      pages: [
        `SPARK DEMO · FICTIONAL SERIAL

THE PAPER CITY

RECAP

Courier Mara Vale found a blank railway ticket that warmed whenever she faced east. At midnight it printed one instruction: BOARD THE TRAIN THAT ISN'T LISTED.

EPISODE THREE

Platform Nine had been sealed for twenty years, but the clock above its gate was keeping perfect time.

Mara held the ticket against the brass lock. Somewhere behind the wall, a press began to turn: one slow revolution, a pause, then another. The gate clicked open.

The platform smelled of rain and hot paper. No rails remained. In their place ran two silver grooves filled with thousands of narrow cards. Each card carried tomorrow's date and one ordinary event: a missed tram, a cracked teacup, a stranger returning a blue umbrella.

At the far end, a kiosk glowed beneath the fictional crest of Bellwether Transit. Its printer was already awake.`,
        `Mara approached the kiosk. A fresh notice slid into the tray.

08:14 - MARA VALE DECLINES THE OFFER.

Below it, in smaller type: THE CITY LOSES ONE HOUR.

"That machine is dramatic," said a voice behind her.

An old conductor stood beside the locked gate, silver braid bright against his coat. His badge read ORIN PIKE, though Bellwether Transit had never employed anyone by that name. Mara knew because she had delivered the company's archive to the museum herself.

Orin lifted a stack of tomorrow cards. "Most predictions are harmless. The press notices pressure, not destiny. A crowded crossing. A promise almost broken. It prints the shape of what is likely."

"And the offer?"

"Mine." He pointed to a narrow carriage waiting where the rails should have been. Its windows showed different weather in every pane. "Help me stop the press before sunrise."

Mara read the notice again. The letters were fading, as if the future had begun reconsidering itself.`,
        `Inside the carriage, the seats were filing cabinets and the ceiling was paper sky. Orin opened the first drawer. It contained one card for every person in the city.

"Bellwether built the press to plan timetables," he said. "Then it learned that people are easier to schedule than trains. The company buried it. The press kept printing."

Mara found her own drawer. It was empty except for the warm ticket.

The carriage shuddered. In the silver grooves, tomorrow cards began racing toward a black slot beneath the clock. Each card that vanished made the minute hand jump backward.

08:13.

08:12.

The city above them was losing its morning before it arrived.

Orin offered her a red lever. "Pull this and the press forgets every prediction. Leave it, and we can choose which ones come true."

Mara put her hand on the lever.

The kiosk printed one final notice.

MARA VALE PULLS THE LEVER.

Then, beneath it, a second line appeared in ink so fresh it shone:

ORIN PIKE HAS LIED ABOUT THE TRAIN.

Mara released the lever.

Orin did not reach for it. Instead he sat on the nearest cabinet and watched the minute hand jump to 08:10.

"The train is not here to stop the press," Mara said.

"No."

"It carries the predictions away."

Orin nodded. Each night the carriage collected the cards and delivered them to Bellwether's sealed planning room. Every morning, executives had opened the drawers and chosen which delays, shortages and lucky accidents would be allowed to happen. The system had made the city efficient. It had also made it obedient.

"I drove the last train," he said. "Then I realised the press had printed my rebellion before I chose it. I never learned whether the choice was mine."

The carriage doors locked. A bell rang once.

From the final cabinet came a soft knocking. Not mechanical. Human.

Mara pulled the drawer open. A girl of perhaps twelve crouched inside, holding a roll of blank paper. Her coat bore the crest of a company Mara had never heard of: LANTERN FOLDWORKS.

"You're late," the girl said. "Bellwether is only the first city."

Outside, the silver grooves changed direction. Thousands of tomorrow cards streamed back out of the black slot, blank side up.`,
        `The blank cards climbed the platform pillars like pale leaves. Wherever one touched stone, a new sentence appeared.

THE MAYOR FORGETS THE RIVER.

THE EASTERN BRIDGE OPENS INTO A FIELD.

MARA VALE REMEMBERS A DAY THAT NEVER HAPPENED.

The girl handed Mara the roll. It was a map printed on both sides. One showed the city above them. The other showed nine more cities connected by lines that did not follow any coast or border.

"Lantern Foldworks built the paper," she said. "Bellwether only taught it to predict."

08:07.

Mara could pull the red lever and erase the press, but the map suggested the other presses would continue. She could board the carriage and follow the network, but every minute spent below would be stolen from the city above.

Orin stood beside the open door. For the first time, he looked afraid.

The kiosk printed two tickets. One was marked SURFACE. The other was marked NEXT CITY.

Both carried Mara's name.

STOPPING POINT

Mara takes one ticket while the clock reaches 08:06. The episode ends before revealing which one.

All people, companies and events in this demonstration are fictional.`
      ]
    },
    {
      moduleId: "reader-genome-demo",
      kind: "text",
      title: "Reader Genome: The Quiet Factory",
      summary: "A fictional design essay asks what changes when a workshop treats silence as a measurable output.",
      points: ["A made-up company anchors the case study", "The structure mirrors a long-form daily article"],
      actions: ["like", "dislike"],
      pages: [
        `READER GENOME DEMO · FICTIONAL CASE STUDY

THE QUIET FACTORY

At the imaginary Thimbleglass Instruments workshop, every machine has two production targets. The first is familiar: parts per hour. The second is stranger: minutes of comfortable conversation preserved on the factory floor.

The company began measuring silence after a prototype maker noticed that the loudest bench produced the most rework. Nothing was wrong with the tools. The problem was that operators stopped asking each other small questions when speaking became tiring.

Thimbleglass moved compressors behind a dense service wall, replaced alert beeps with low-frequency light cues, and gave each noisy process a short acoustic signature instead of a constant drone. Output rose only slightly. Mistakes fell sharply.`,
        `The interesting lesson is not that every workshop should become silent. It is that secondary effects deserve a place in the design brief.

A fast machine may slow the team around it. A bright dashboard may hide the one warning that matters. A feature that saves ten seconds can create an hour of background attention.

The fictional workshop used a simple review question: what human behaviour does this tool make easier, and what behaviour does it quietly suppress? That question changed equipment placement, maintenance schedules and even the wording of work orders.

For a small E-Ink reader, the parallel is useful. The absence of animation is not merely a limitation. It creates a calmer rhythm in which one well-chosen page can feel complete.

All organisations, measurements and people in this demonstration are invented; the article structure is representative of the implemented long-form feed.`
      ]
    },
    {
      moduleId: "daily-puzzle-demo",
      kind: "text",
      title: "Spark Puzzle: The Lighthouse Page",
      summary: "Three original demonstration puzzles designed for a short, offline morning break.",
      points: ["One logic puzzle and one word puzzle", "Hints and answers stay in the same artifact"],
      actions: ["like", "dislike"],
      pages: [
        "SPARK DEMO · SYNTHETIC PUZZLES\n\nPOCKET PUZZLE PAGE\n\nLOGIC\nThree boxes are all labelled incorrectly: APPLES, PEARS and MIXED. You may draw one fruit from one box. Which box should you choose to identify all three?\n\nWORDS\nChange COLD to WARM one letter at a time. Every step must remain a four-letter English word.\n\nMove to the next page only when you want the hints.",
        "HINTS\n\nFor the boxes, begin with the label that cannot possibly describe its contents.\n\nFor the word ladder, a path can pass through something tied with string, then a playing card.\n\nANSWERS\n\nDraw from MIXED; that fruit identifies the box because every label is wrong, and the others follow by elimination.\n\nOne ladder is COLD, CORD, CARD, WARD, WARM."
      ]
    },
    {
      moduleId: "project-watchlist-demo",
      kind: "text",
      title: "Project Watch: Weekly Build Radar",
      summary: "Three fictional active projects are condensed into changes, unknowns and one bounded thing to build next.",
      points: ["Weekly progress and open evidence gaps", "Cost, effort and first action stay visible"],
      actions: ["keep", "archive", "open-phone"],
      pages: [
        "PROJECT WATCHLIST DEMO\n\nWEEKLY BUILD RADAR\n\nCHANGED\nNorthstar Notes — Offline search now passes an invented 2,400-note library.\nHarbor Relay — Retry queue repaired; hotspot testing remains unverified.\nGlasswing Planner — Three screens added; accessibility review is still open.\n\nRISK\nNo battery or wake-cycle measurements exist for physical hardware.\n\nONE THING TO BUILD\nOne six-field morning status page across every active project. Cost: $0. Effort: four hours. First action: freeze the JSON contract.\n\nAll names and results are fictional."
      ]
    },
    {
      moduleId: "business-opportunities-demo",
      kind: "text",
      title: "Opportunity Brief: Today's Shortlist",
      summary: "Three invented leads are ranked by fit, scope and evidence, with one safe next action and nothing sent automatically.",
      points: ["Strong and medium-fit leads are separated", "Budget, constraint and first check are explicit"],
      actions: ["keep", "archive", "open-phone"],
      pages: [
        "BUSINESS OPPORTUNITY DEMO\n\nTODAY'S SHORTLIST\n\n1 / MAPLE ARC STUDIO\nOffline E-Ink prototype · strong fit · two-day proof · invented budget A$1,400.\n\n2 / TIDEGLASS MUSEUM\nAccessible kiosk audit · medium fit · verify the onsite requirement.\n\n3 / LANTERN HEALTH\nAndroid companion concept · medium fit · decline if medical claims enter scope.\n\nBEST NEXT ACTION\nOpen Maple Arc on the phone, confirm rights and deadline, then draft — but do not send — a two-screen response.\n\nEvery lead, company and figure is fictional."
      ]
    },
    {
      moduleId: "hardware-research-demo",
      kind: "text",
      title: "Hardware Brief: PaperCore C3",
      summary: "A fictional upgrade claim is checked against display fit, memory headroom and recovery before earning a wait-or-build verdict.",
      points: ["Performance claims meet resource budgets", "Recovery and physical proof remain hard gates"],
      actions: ["keep", "archive", "open-phone"],
      pages: [
        "HARDWARE RESEARCH DEMO\n\nPAPERCORE C3 REV B\n\nCLAIM\n22% faster full refresh in invented vendor benchmarks.\n\nFIT\nThe 528 x 792 four-gray buffer matches, but the display API differs.\n\nBUDGET\nNeeds 38 KiB extra linked DRAM; modeled headroom is only 24 KiB.\n\nRECOVERY\nNo verified rollback image or power-loss procedure.\n\nVERDICT\nWAIT. Revisit after memory fits the budget and recovery documents exist.\n\nEvery name, specification and result is fictional."
      ]
    },
    {
      moduleId: "weekend-city-guide-demo",
      kind: "text",
      title: "Weekend Guide: Paper Harbor",
      summary: "An invented city guide turns three imaginary events into a compact offline Saturday plan.",
      points: ["Times and venues are fictional", "Practical details fit one quiet reading session"],
      actions: ["keep", "archive", "open-phone"],
      pages: [
        "WEEKEND CITY GUIDE DEMO\n\nPAPER HARBOR\n\n09:30 - Lantern Market\nSmall-print makers and imaginary bookbinders beneath the old signal hall.\n\n13:00 - Tideglass Walk\nA short fictional riverside route with a sheltered lunch stop.\n\n18:15 - Quiet Machines\nAn invented exhibition of mechanical displays and paper clocks.\n\nEvery event, venue, time and travel detail is fictional."
      ]
    }
  ];
  const practicalInboxOrder = [
    "project-watchlist-demo",
    "business-opportunities-demo",
    "hardware-research-demo",
    "reader-genome-demo",
    "weekend-city-guide-demo",
    "spark-serial-demo",
    "daily-puzzle-demo"
  ];
  inboxTemplates.sort((left, right) =>
    practicalInboxOrder.indexOf(left.moduleId) - practicalInboxOrder.indexOf(right.moduleId));
  return {
    schema: "x3-preview-lab-demo/1",
    clock: "2026-01-15T08:00:00Z",
    timezone: "UTC",
    batteryPercent: Number.isFinite(raw?.batteryPercent) ? raw.batteryPercent : 83,
    recentBooks: [{
      title: "Fictional Morning Edition",
      author: "Synthetic source",
      kind: "epub",
      spines: [[
        "Welcome to the offline X3 Preview Lab. This edition contains synthetic content only.",
        "Use the modeled page controls to check navigation, progress and end-of-book behavior."
      ]]
    }],
    cards: cardTemplates.map((template, index) => {
      const card = (raw?.cards || []).find((candidate) => candidate.taskId === template.taskId)
        || raw?.cards?.[index]
        || {};
      return {
        taskId: template.taskId,
        status: "Demo",
        generatedAt: "2026-01-15T08:00:00Z",
        hasReport: template.hasReport ?? Boolean(card.hasReport),
        ...template
      };
    }),
    inbox: inboxTemplates.map((template, index) => {
      const item = raw?.inbox?.[index] || {};
      return {
        itemId: `demo-inbox-${String(index + 1).padStart(2, "0")}`,
        moduleId: template.moduleId || "demo-source",
        kind: template.kind || item.kind || "text",
        title: template.title,
        createdAt: "2026-01-15T08:00:00Z",
        state: "pending",
        digest: { schema: "xtinct.inbox-digest/v1", summary: template.summary, points: template.points },
        actions: template.actions || item.actions || [],
        pages: Array.isArray(template.pages) ? template.pages : undefined
      };
    })
  };
}

async function loadSleep() {
  const response = await fetch("/api/sd/file?path=%2Fsleep.bmp");
  if (!response.ok) throw new Error("sleep.bmp not available in cloned SD");
  const decoded = decodeX3Bmp(await response.arrayBuffer());
  renderer.setSleepImage(new ImageData(decoded.pixels, decoded.width, decoded.height));
}

function renderFirmwareContext() {
  const context = deriveFirmwareContext({ firmware, qemu });
  const rows = [
    ["#firmware-context-package", "Package", context.package],
    ["#firmware-context-preview", "Preview", context.preview],
    ["#firmware-context-local", "Selected inspection image", context.localImage],
    ["#firmware-context-qemu", "QEMU", context.qemu],
    ["#firmware-context-physical", "Physical X3", context.physicalX3]
  ];
  for (const [selector, label, item] of rows) {
    const target = document.querySelector(selector);
    target.textContent = item.status;
    target.setAttribute("aria-label", `${label}: ${item.status}. ${item.detail}`);
  }
  document.querySelector("#firmware-context").setAttribute("aria-busy", "false");
}

function renderInspector() {
  const firmwarePanel = document.querySelector("#panel-firmware");
  const firmwareProvided = firmware?.exists === true;
  const headroom = firmware?.ota_headroom_bytes ?? null;
  const headroomStatus = firmware?.budget_status || "unknown";
  const headroomLabel = headroom == null
    ? "—"
    : `${headroom.toLocaleString()} B${headroomStatus === "pass" ? "" : ` · ${headroomStatus.toUpperCase()}`}`;
  firmwarePanel.innerHTML = `
    <h2><span class="mini-evidence modeled">MODELED</span> Selected firmware metadata</h2>
    <p class="boundary-callout"><strong>This selected image does not draw the preview.</strong><br>It is inspected read-only; header and resource metadata do not mean firmware execution.</p>
    <dl>
      <dt>Build</dt><dd>${escapeHtml(firmwareProvided ? (firmware?.embedded_build_id || "Unknown") : "Not configured")}</dd>
      <dt>Image label</dt><dd>${escapeHtml(firmwareProvided ? (firmware?.path || "Selected image") : "Not configured")}</dd>
      <dt>Bytes</dt><dd>${firmware?.byte_count?.toLocaleString() || "—"}</dd>
      <dt>SHA-256</dt><dd>${escapeHtml(firmware?.sha256 || "—")}</dd>
      <dt>ESP32-C3 image</dt><dd class="${firmwareProvided ? (firmware?.esp32c3_image_valid ? "pass" : "warn") : ""}">${firmwareProvided ? (firmware?.esp32c3_image_valid ? "HEADER PASS" : "NOT VALID") : "NOT PROVIDED"}</dd>
      <dt>OTA headroom</dt><dd class="${firmwareProvided ? (headroomStatus === "pass" ? "pass" : "warn") : ""}">${headroomLabel}</dd>
      <dt>Execution</dt><dd>${escapeHtml(firmware?.execution || "disabled")}</dd>
    </dl>`;
  const device = contract?.device || {};
  const sleep = contract?.data_limits?.sleep_screen || {};
  document.querySelector("#panel-contract").innerHTML = `
    <h2><span class="mini-evidence contract">REAL CONTRACT TEST</span> X3 contract</h2>
    <dl>
      <dt>Model</dt><dd>${escapeHtml(device.model || "Xteink X3")}</dd>
      <dt>MCU</dt><dd>${escapeHtml(device.mcu || "ESP32-C3")}</dd>
      <dt>Logical frame</dt><dd>${sleep.portrait_width_pixels || 528} × ${sleep.portrait_height_pixels || 792}</dd>
      <dt>Gray levels</dt><dd>${device.display_levels || 4}</dd>
      <dt>PSRAM</dt><dd>${device.psram_bytes || 0} B</dd>
      <dt>OTA slot</dt><dd>${device.ota_slot_bytes?.toLocaleString() || "—"} B</dd>
      <dt>Sleep BMP</dt><dd>${sleep.bits_per_pixel || 4} bpp / ${sleep.bmp_file_bytes?.toLocaleString() || "—"} B</dd>
      <dt>Network</dt><dd>DISABLED</dd>
    </dl>`;
  document.querySelector("#session-status").innerHTML = `
    <dt>Route</dt><dd>${escapeHtml(state?.route || "—")}</dd>
    <dt>Cards</dt><dd>${state?.fixtures.cards.length ?? 0}</dd>
    <dt>Inbox items</dt><dd>${state?.fixtures.inbox.length ?? 0}</dd>
    <dt>SD entries</dt><dd>${sdEntries.length}</dd>
    <dt>Recorded inputs</dt><dd>${inputRecording.actions.length} / ${MAX_RECORDED_INPUTS}</dd>
    <dt>Cloned SD</dt><dd>READ-ONLY</dd>
    <dt>Touch / radio</dt><dd>NOT EMULATED</dd>`;
  const recordingState = document.querySelector("#recording-state");
  recordingState.textContent = replayBusy ? "REPLAYING" : recordingEnabled ? "RECORDING" : "PAUSED";
  recordingState.classList.toggle("paused", !recordingEnabled || replayBusy);
  const toggleRecording = document.querySelector("#toggle-recording");
  toggleRecording.textContent = recordingEnabled ? "Pause" : "Resume";
  toggleRecording.setAttribute("aria-pressed", String(recordingEnabled));
  toggleRecording.disabled = replayBusy;
  document.querySelector("#clear-recording").disabled = replayBusy || inputRecording.actions.length === 0;
  document.querySelector("#export-recording").disabled = replayBusy || inputRecording.actions.length === 0;
  document.querySelector("#replay-recording").disabled = replayBusy;
  document.querySelector("#recording-message").textContent = recordingMessage;
  renderQemuInspector();
  renderEvidenceState();
  renderFirmwareContext();
  renderNetworkInspector();
}

function renderEvidenceState() {
  const contractCard = document.querySelector(".evidence-contract");
  const qemuCard = document.querySelector(".evidence-qemu");
  contractCard.classList.toggle("evidence-unavailable", !networkScenarios);
  qemuCard.classList.toggle("evidence-unavailable", !qemu?.ready_to_execute);
  contractCard.querySelector("span").textContent = networkScenarios
    ? "Available · isolated HTTP bytes and transaction seams"
    : "Unavailable · fixture server did not load";
  const qemuDetected = Boolean(qemu?.qemu?.available);
  qemuCard.querySelector("span").textContent = qemu?.ready_to_execute
    ? "Ready, not started · separate local runtime, never bundled"
    : qemuDetected
      ? "Detected, not started · full-flash execution is blocked"
      : "Optional, not bundled · execution is not started";
}

function renderQemuInspector() {
  const panel = document.querySelector("#panel-qemu");
  const qemuAvailable = Boolean(qemu?.qemu?.available);
  const flashReady = Boolean(qemu?.full_flash_inputs?.ready);
  const ready = Boolean(qemu?.ready_to_execute);
  panel.innerHTML = `
    <h2><span class="mini-evidence qemu">QEMU</span> Advanced execution</h2>
    <p class="network-note">QEMU is optional, offline and never bundled with this Preview Lab. Detection refers only to a separate runtime on this computer. An OTA <code>update.bin</code> alone is not a bootable full-flash image.</p>
    <dl>
      <dt>ESP32-C3 QEMU</dt><dd class="${qemuAvailable ? "pass" : "warn"}">${qemuAvailable ? "DETECTED ON THIS COMPUTER" : "NOT DETECTED"}</dd>
      <dt>Matching flash set</dt><dd class="${flashReady ? "pass" : "warn"}">${flashReady ? "READY" : "NOT RETAINED"}</dd>
      <dt>Execution readiness</dt><dd class="${ready ? "pass" : "warn"}">${ready ? "READY" : "BLOCKED"}</dd>
      <dt>Run state</dt><dd>NOT STARTED</dd>
      <dt>Network</dt><dd>DISABLED</dd>
    </dl>
    <div class="qemu-requirements">
      <h3>One authoritative build must retain</h3>
      <ul>
        <li><code>bootloader.bin</code></li>
        <li><code>partitions.bin</code></li>
        <li><code>firmware.bin</code></li>
        <li><code>boot_app0.bin</code></li>
      </ul>
    </div>
    <p class="boundary-callout"><strong>PHYSICAL DEVICE REQUIRED</strong><br>Even a successful QEMU boot cannot prove E-Ink waveform, ADC buttons, microSD power-loss recovery, Wi-Fi/Bluetooth, RTC wake or battery use.</p>
    <p class="network-note">The <a href="https://github.com/crosspoint-reader/crosspoint-simulator" target="_blank" rel="noopener noreferrer">official CrossPoint Simulator</a> is a complementary source-level rendering tool. This Preview Lab does not integrate with, proxy or replace it.</p>`;
}

function renderNetworkInspector() {
  const panel = document.querySelector("#panel-network");
  if (!panel) return;
  if (!panel.querySelector("#network-scenario")) {
    const options = (networkScenarios?.scenarios || [])
      .map(scenario => `<option value="${escapeHtml(scenario.id)}">${escapeHtml(scenario.id)}</option>`)
      .join("");
    panel.innerHTML = `
      <h2><span class="mini-evidence contract">REAL CONTRACT TEST</span> Local HTTP</h2>
      <p class="network-note">Real same-origin HTTP bytes over synthetic fixtures. Production, device access and arbitrary outbound URLs are disabled.</p>
      <label for="network-scenario">Deterministic scenario</label>
      <select id="network-scenario" ${networkBusy ? "disabled" : ""}>${options}</select>
      <div class="network-actions">
        <button id="network-run-all" ${networkBusy ? "disabled" : ""}>Run Cards + Inbox</button>
        <button id="network-flush" ${networkBusy ? "disabled" : ""}>Retry receipts</button>
      </div>
      <dl id="network-status"></dl>
      <fieldset class="synthetic-editor">
        <legend>Safe synthetic overrides</legend>
        <p>Layer bounded delay or one interrupted response onto the selected fixture. No host or URL field exists.</p>
        <label for="network-latency">Delay each fixture request (0–1500 ms)</label>
        <input id="network-latency" type="number" min="0" max="1500" step="25" value="0" inputmode="numeric">
        <label for="network-interrupt">Interrupt once</label>
        <select id="network-interrupt">
          <option value="none">None</option>
          <option value="artifact">Artifact download</option>
          <option value="report">Card report</option>
          <option value="sync">Inbox sync page</option>
          <option value="manifest">Cards manifest</option>
          <option value="card">Card JSON</option>
          <option value="ack">Receipt response</option>
        </select>
        <label for="network-interrupt-bytes">Cut after bytes (1–65536)</label>
        <input id="network-interrupt-bytes" type="number" min="1" max="65536" step="1" value="1024" inputmode="numeric">
        <div class="network-actions">
          <button id="network-apply-overrides" type="button">Apply overrides</button>
          <button id="network-clear-overrides" type="button">Clear overrides</button>
        </div>
        <p id="network-override-message" class="tool-message" aria-live="polite">Default transport; no injected delay or interruption.</p>
      </fieldset>`;
    const select = panel.querySelector("#network-scenario");
    if (networkServerStatus?.scenario) select.value = networkServerStatus.scenario;
    select.addEventListener("change", () => selectNetworkScenario(select.value));
    panel.querySelector("#network-run-all").addEventListener("click", () => runFullNetworkSync());
    panel.querySelector("#network-flush").addEventListener("click", () => retryReceipts());
    panel.querySelector("#network-apply-overrides").addEventListener("click", applyNetworkOverrides);
    panel.querySelector("#network-clear-overrides").addEventListener("click", clearNetworkOverrides);
  }
  const select = panel.querySelector("#network-scenario");
  const runButton = panel.querySelector("#network-run-all");
  const flushButton = panel.querySelector("#network-flush");
  if (select) select.disabled = networkBusy;
  if (runButton) runButton.disabled = networkBusy;
  if (flushButton) flushButton.disabled = networkBusy;
  panel.querySelectorAll(".synthetic-editor input, .synthetic-editor select, .synthetic-editor button")
    .forEach(control => { control.disabled = networkBusy; });
  const client = networkModel.status();
  const injected = syntheticNetwork.status();
  const requestCount = Object.values(networkServerStatus?.request_counts || {})
    .reduce((total, value) => total + Number(value), 0);
  const status = panel.querySelector("#network-status");
  if (status) status.innerHTML = `
    <dt>Isolation</dt><dd class="pass">LOOPBACK ONLY</dd>
    <dt>Scenario</dt><dd>${escapeHtml(networkServerStatus?.scenario || "loading")}</dd>
    <dt>Cards V1</dt><dd>${escapeHtml(client.cards)}</dd>
    <dt>Inbox V2</dt><dd>${escapeHtml(client.inbox)}</dd>
    <dt>Cursor / pages</dt><dd>${escapeHtml(client.cursor)} / ${client.pages}</dd>
    <dt>Cached</dt><dd>${client.cardsCached} cards · ${client.inboxCached} inbox · ${client.artifactsCached} artifacts</dd>
    <dt>Outbox</dt><dd>${client.outboxEvents} queued · ${escapeHtml(client.receipts)}</dd>
    <dt>Injected fault</dt><dd>${injected.interrupt_target === "none" ? "NONE" : `${escapeHtml(injected.interrupt_target).toUpperCase()}${injected.interruption_consumed ? " · USED" : " · ARMED"}`}</dd>
    <dt>Daily proof</dt><dd>${client.inboxCompleteToday && client.freshDay ? "COMPLETE" : "NOT COMPLETE"}</dd>
    <dt>HTTP requests</dt><dd>${requestCount}</dd>`;
}

function applyNetworkOverrides() {
  const panel = document.querySelector("#panel-network");
  const message = panel.querySelector("#network-override-message");
  try {
    const overrides = normalizeSyntheticNetworkOverrides({
      latency_ms: Number(panel.querySelector("#network-latency").value),
      interrupt_target: panel.querySelector("#network-interrupt").value,
      interrupt_after_bytes: Number(panel.querySelector("#network-interrupt-bytes").value)
    });
    syntheticNetwork.configure(overrides);
    message.textContent = overrides.interrupt_target === "none"
      ? `Applied ${overrides.latency_ms} ms bounded fixture delay.`
      : `Armed one ${overrides.interrupt_target} interruption after ${overrides.interrupt_after_bytes} bytes, with ${overrides.latency_ms} ms delay.`;
    state.refreshState = "Synthetic overrides applied";
    paint();
  } catch (error) {
    message.textContent = error.message;
  }
}

function clearNetworkOverrides() {
  const panel = document.querySelector("#panel-network");
  panel.querySelector("#network-latency").value = "0";
  panel.querySelector("#network-interrupt").value = "none";
  panel.querySelector("#network-interrupt-bytes").value = "1024";
  syntheticNetwork.configure({});
  panel.querySelector("#network-override-message").textContent = "Default transport; no injected delay or interruption.";
  state.refreshState = "Synthetic overrides cleared";
  paint();
}

function paint() {
  renderer.render(state);
  nativeFrameExport.src = canvas.toDataURL("image/png");
  nativeFrameExport.dataset.route = state.route;
  renderInspector();
  const flash = document.querySelector("#refresh-flash");
  flash.classList.remove("flash");
  requestAnimationFrame(() => flash.classList.add("flash"));
}

function demoDay() {
  const epoch = Date.parse(fixtures.clock);
  return Math.floor(epoch / (24 * 60 * 60 * 1000));
}

function useNetworkFixtures() {
  const cards = networkModel.cards();
  const inbox = networkModel.inbox();
  const publicView = publicDemoFixtures({ cards, inbox, batteryPercent: fixtures.batteryPercent });
  const safeCards = cards.map((card, index) => ({
    ...card,
    title: publicView.cards[index].title,
    summary: publicView.cards[index].summary,
    metrics: publicView.cards[index].metrics,
    sections: publicView.cards[index].sections,
    pages: publicView.cards[index].pages
  }));
  const safeInbox = inbox.map((item, index) => ({
    ...item,
    moduleId: publicView.inbox[index].moduleId,
    kind: publicView.inbox[index].kind,
    title: publicView.inbox[index].title,
    digest: publicView.inbox[index].digest,
    pages: publicView.inbox[index].pages
  }));
  state.fixtures = {
    ...state.fixtures,
    cards: safeCards.length ? safeCards : state.fixtures.cards,
    inbox: safeInbox.length || networkModel.status().cursor !== "0" ? safeInbox : state.fixtures.inbox
  };
  state.cardIndex = Math.min(state.cardIndex, Math.max(0, state.fixtures.cards.length - 1));
  state.inboxIndex = Math.min(state.inboxIndex, Math.max(0, state.fixtures.inbox.length - 1));
}

async function refreshNetworkServerStatus() {
  try { networkServerStatus = await json("/api/network/status"); } catch { /* Inspector remains honest with client state. */ }
}

function networkFailure(error) {
  const result = error instanceof NetworkContractError ? error.result : "NETWORK_ERROR";
  state.refreshState = `${result}: ${error.message}`;
  return result;
}

async function withNetworkWork(work) {
  if (networkBusy) return;
  networkBusy = true;
  state.refreshState = "Syncing local HTTP...";
  paint();
  try {
    await work();
  } catch (error) {
    networkFailure(error);
    console.error(error);
  } finally {
    useNetworkFixtures();
    await refreshNetworkServerStatus();
    networkBusy = false;
    paint();
  }
}

async function runFullNetworkSync() {
  await withNetworkWork(async () => {
    const result = await networkModel.runDailyRefresh(demoDay(), { manual: true });
    state.refreshState = result.result === "FRESH" ? "Updated · Cards + Inbox complete" : result.result;
  });
}

async function retryReceipts() {
  await withNetworkWork(async () => {
    const result = await networkModel.flushOutbox();
    state.refreshState = `${result.result} · ${result.remaining} receipts queued`;
  });
}

async function selectNetworkScenario(scenario) {
  if (networkBusy) return;
  networkBusy = true;
  paint();
  try {
    networkServerStatus = await json("/api/network/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario })
    });
    networkModel.reset();
    syntheticNetwork.resetAttempt();
    networkModel.setEnvironmentScenario(scenario);
    state = createState(fixtures);
    state.sdEntries = [...sdEntries];
    state.refreshState = `Scenario: ${scenario}`;
  } catch (error) {
    networkFailure(error);
  } finally {
    networkBusy = false;
    paint();
  }
}

function captureInput(button) {
  if (!recordingEnabled || replayBusy) return;
  try {
    inputRecording = appendInputAction(inputRecording, button, state?.route || "home", performance.now() - recordingStartedAt);
    recordingMessage = `Captured ${inputRecording.actions.length} action${inputRecording.actions.length === 1 ? "" : "s"}.`;
  } catch (error) {
    recordingEnabled = false;
    recordingMessage = error.message;
  }
}

async function dispatch(button, { record = true } = {}) {
  if (networkBusy) return;
  if (record) captureInput(button);
  if (state.route === "cards" && button === "confirm") {
    await runFullNetworkSync();
    return;
  }
  if (state.route === "actions" && button === "confirm") {
    const action = inboxActions(state)[state.actionIndex]?.code;
    if (action === "sync") {
      await withNetworkWork(async () => {
        const result = await networkModel.syncInbox();
        state.route = "inbox";
        state.refreshState = `${result.result} · cursor ${result.cursor}`;
      });
      return;
    }
    if (action && !["browse-list"].includes(action)) {
      const selected = state.fixtures.inbox[state.inboxIndex];
      const outcome = selected ? networkModel.applyInboxAction(selected.itemId, action) : null;
      state = reduceInput(state, button);
      if (outcome?.local) useNetworkFixtures();
      state.refreshState = outcome?.queued ? "Receipt queued" : "Local action · receipt unavailable";
      paint();
      return;
    }
  }
  if (state.route === "inbox" && state.inboxView === "preview" && ["left", "up"].includes(button)) {
    const selected = state.fixtures.inbox[state.inboxIndex];
    if (selected) {
      networkModel.recordOpenedBestEffort(selected.itemId);
      if (networkModel.artifact(selected.itemId)) state.documentBody = networkModel.documentText(selected.itemId);
    }
  }
  if (state.route === "cards" && ["left", "up"].includes(button)) {
    const selected = state.fixtures.cards[state.cardIndex];
    if (selected?.taskId) state.documentBody = networkModel.reportText(selected.taskId);
  }
  state = reduceInput(state, button);
  paint();
}

function keyToButton(event) {
  const map = {
    Escape: "back", Backspace: "back", Enter: "confirm",
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    PageUp: "up", PageDown: "down", p: "power", P: "power"
  };
  return map[event.key];
}

function inputHistogram() {
  return inputRecording.actions.reduce((counts, action) => {
    counts[action.button] = (counts[action.button] || 0) + 1;
    return counts;
  }, {});
}

function sanitizedBugBundle() {
  const client = networkModel.status();
  return createSanitizedBugBundle({
    appVersion: release?.version || "development",
    generatedAt: new Date().toISOString(),
    contractLoaded: Boolean(contract),
    firmwareLoaded: firmware?.exists === true,
    networkAvailable: Boolean(networkScenarios),
    firmware: {
      exists: firmware?.exists === true,
      byteCount: firmware?.byte_count,
      sha256: firmware?.sha256,
      headerValid: firmware?.esp32c3_image_valid,
      budgetStatus: firmware?.budget_status
    },
    qemu: {
      available: qemu?.qemu?.available,
      fullFlashReady: qemu?.full_flash_inputs?.ready,
      ready: qemu?.ready_to_execute
    },
    network: {
      scenario: networkServerStatus?.scenario,
      cards: client.cards,
      inbox: client.inbox,
      receipts: client.receipts,
      cursor: client.cursor,
      pages: client.pages,
      cardsCached: client.cardsCached,
      inboxCached: client.inboxCached,
      artifactsCached: client.artifactsCached,
      outboxEvents: client.outboxEvents
    },
    overrides: syntheticNetwork.status(),
    session: {
      route: state?.route,
      sdEntryCount: sdEntries.length,
      recordedActions: inputRecording.actions.length,
      inputHistogram: inputHistogram()
    }
  });
}

async function loadLocalImage(file, label) {
  if (!file || !["image/png", "image/jpeg", "image/webp", "image/bmp"].includes(file.type)) {
    throw new Error(`${label} must be a PNG, JPEG, WebP or BMP image`);
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new Error(`${label} must be no larger than 10 MiB`);
  }
  const bitmap = await createImageBitmap(file);
  if (
    bitmap.width < 1 || bitmap.height < 1 || bitmap.width > 4096 || bitmap.height > 4096 ||
    bitmap.width * bitmap.height > 16 * 1024 * 1024
  ) {
    bitmap.close();
    throw new Error(`${label} dimensions exceed the 16-megapixel local comparison limit`);
  }
  return bitmap;
}

function updateVisualControls() {
  document.querySelector("#visual-baseline-state").textContent = visualBaseline
    ? `Ready · ${visualBaseline.width} × ${visualBaseline.height}`
    : "No image selected";
  document.querySelector("#visual-candidate-state").textContent = visualCandidate
    ? `Ready · ${visualCandidate.width} × ${visualCandidate.height}`
    : "No image selected";
  document.querySelector("#compare-images").disabled = !visualBaseline || !visualCandidate;
}

async function selectVisualImage(kind, file) {
  const result = document.querySelector("#visual-result");
  document.querySelector("#visual-diff").hidden = true;
  try {
    const bitmap = await loadLocalImage(file, kind === "baseline" ? "Baseline" : "Candidate");
    if (kind === "baseline") {
      visualBaseline?.close();
      visualBaseline = bitmap;
    } else {
      visualCandidate?.close();
      visualCandidate = bitmap;
    }
    visualSummary = null;
    result.textContent = "Image decoded locally. Select the other image or compare now.";
  } catch (error) {
    if (kind === "baseline") {
      visualBaseline?.close();
      visualBaseline = null;
    } else {
      visualCandidate?.close();
      visualCandidate = null;
    }
    result.textContent = error.message;
  }
  updateVisualControls();
}

function compareVisualImages() {
  const result = document.querySelector("#visual-result");
  const output = document.querySelector("#visual-diff");
  output.hidden = true;
  if (!visualBaseline || !visualCandidate) return;
  if (visualBaseline.width !== visualCandidate.width || visualBaseline.height !== visualCandidate.height) {
    result.textContent = `Dimensions differ: ${visualBaseline.width} × ${visualBaseline.height} versus ${visualCandidate.width} × ${visualCandidate.height}.`;
    return;
  }
  const width = visualBaseline.width;
  const height = visualBaseline.height;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  sourceContext.drawImage(visualBaseline, 0, 0);
  const baselinePixels = sourceContext.getImageData(0, 0, width, height).data;
  sourceContext.clearRect(0, 0, width, height);
  sourceContext.drawImage(visualCandidate, 0, 0);
  const candidatePixels = sourceContext.getImageData(0, 0, width, height).data;
  output.width = width;
  output.height = height;
  const outputContext = output.getContext("2d");
  const difference = outputContext.createImageData(width, height);
  let totalDifference = 0;
  let changedPixels = 0;
  for (let index = 0; index < baselinePixels.length; index += 4) {
    const delta = Math.round((
      Math.abs(baselinePixels[index] - candidatePixels[index]) +
      Math.abs(baselinePixels[index + 1] - candidatePixels[index + 1]) +
      Math.abs(baselinePixels[index + 2] - candidatePixels[index + 2])
    ) / 3);
    totalDifference += delta;
    if (delta > 12) changedPixels += 1;
    difference.data[index] = delta > 12 ? 212 : delta;
    difference.data[index + 1] = delta > 12 ? 255 : delta;
    difference.data[index + 2] = delta > 12 ? 63 : delta;
    difference.data[index + 3] = 255;
  }
  outputContext.putImageData(difference, 0, 0);
  const pixels = width * height;
  visualSummary = {
    width,
    height,
    meanAbsoluteDifference: totalDifference / pixels,
    changedPercent: (changedPixels / pixels) * 100
  };
  result.textContent = `Changed pixels: ${visualSummary.changedPercent.toFixed(2)}% · mean RGB difference: ${visualSummary.meanAbsoluteDifference.toFixed(2)} / 255.`;
  output.setAttribute("aria-label", `Pixel difference preview. ${visualSummary.changedPercent.toFixed(2)} percent of pixels changed.`);
  output.hidden = false;
}

async function replayRecordingFile(file) {
  if (!file || file.size < 1 || file.size > 128 * 1024) {
    throw new Error("Replay JSON must be between 1 byte and 128 KiB");
  }
  const recording = validateInputRecording(JSON.parse(await file.text()));
  replayBusy = true;
  recordingMessage = `Replaying ${recording.actions.length} validated actions from a fresh modeled state…`;
  state = createState(fixtures);
  state.sdEntries = [...sdEntries];
  networkModel.reset();
  paint();
  try {
    for (const action of recording.actions) {
      await dispatch(action.button, { record: false });
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    recordingMessage = `Replay complete · ${recording.actions.length} actions applied in order.`;
  } finally {
    replayBusy = false;
    paint();
  }
}

async function boot() {
  fixtures = publicDemoFixtures(await json("/api/fixtures"));
  state = createState(fixtures);
  const [releaseResult, contractResult, firmwareResult, qemuResult, treeResult, scenarioResult, networkResult] = await Promise.allSettled([
    json("/api/release"), json("/api/device-contract"), json("/api/firmware"), json("/api/qemu"), json("/api/sd/tree"),
    json("/api/network/scenarios"), json("/api/network/status")
  ]);
  if (releaseResult.status === "fulfilled") release = releaseResult.value;
  if (contractResult.status === "fulfilled") contract = contractResult.value;
  if (firmwareResult.status === "fulfilled") firmware = firmwareResult.value;
  if (qemuResult.status === "fulfilled") qemu = qemuResult.value;
  if (treeResult.status === "fulfilled") sdEntries = treeResult.value.entries || treeResult.value;
  if (scenarioResult.status === "fulfilled") networkScenarios = scenarioResult.value;
  if (networkResult.status === "fulfilled") networkServerStatus = networkResult.value;
  renderer.setSdEntries(sdEntries);
  state.sdEntries = [...sdEntries];
  try { await loadSleep(); } catch (error) { console.warn(error); }
  document.querySelector("#connection-status").textContent = "LOCAL / ISOLATED";
  paint();
}

document.addEventListener("keydown", event => {
  if (event.target.closest("input, select, textarea, button, summary, a")) return;
  const button = keyToButton(event);
  if (!button || event.repeat) return;
  event.preventDefault();
  dispatch(button);
});

document.querySelectorAll("[data-button]").forEach(button =>
  button.addEventListener("click", () => dispatch(button.dataset.button)));

function activateInspectorTab(button, { focus = false } = {}) {
  document.querySelectorAll("[data-tab]").forEach(tab => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll(".inspector-panel").forEach(panel => {
    const active = panel.id === `panel-${button.dataset.tab}`;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (focus) button.focus();
}

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => activateInspectorTab(button));
  button.addEventListener("keydown", event => {
    const tabs = [...document.querySelectorAll("[data-tab]")];
    const current = tabs.indexOf(button);
    let next = null;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) next = tabs[(current + 1) % tabs.length];
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = tabs[(current - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs.at(-1);
    if (!next) return;
    event.preventDefault();
    activateInspectorTab(next, { focus: true });
  });
});

document.querySelector("#reset-session").addEventListener("click", async () => {
  await json("/api/session/reset", { method: "POST" });
  networkModel.reset();
  await refreshNetworkServerStatus();
  state = createState(fixtures);
  const tree = await json("/api/sd/tree");
  sdEntries = tree.entries || tree;
  renderer.setSdEntries(sdEntries);
  state.sdEntries = [...sdEntries];
  await loadSleep();
  paint();
});

document.querySelector("#export-frame").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `x3-${state.route}-528x792.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.querySelector("#toggle-recording").addEventListener("click", () => {
  recordingEnabled = !recordingEnabled;
  if (recordingEnabled && inputRecording.actions.length === 0) recordingStartedAt = performance.now();
  recordingMessage = recordingEnabled ? "Recording resumed." : "Recording paused.";
  paint();
});

document.querySelector("#clear-recording").addEventListener("click", () => {
  inputRecording = createInputRecording();
  recordingStartedAt = performance.now();
  recordingMessage = "Recording cleared. The next input starts a fresh sequence.";
  paint();
});

document.querySelector("#export-recording").addEventListener("click", () => {
  const validated = validateInputRecording(inputRecording);
  downloadJson("x3-input-recording.json", validated);
  recordingMessage = `Exported ${validated.actions.length} content-free actions.`;
  paint();
});

document.querySelector("#replay-recording").addEventListener("change", async event => {
  try {
    await replayRecordingFile(event.target.files?.[0]);
  } catch (error) {
    recordingMessage = `Replay rejected safely: ${error.message}`;
    paint();
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#visual-baseline").addEventListener("change", event =>
  selectVisualImage("baseline", event.target.files?.[0]));
document.querySelector("#visual-candidate").addEventListener("change", event =>
  selectVisualImage("candidate", event.target.files?.[0]));
document.querySelector("#compare-images").addEventListener("click", compareVisualImages);

document.querySelector("#export-bug-bundle").addEventListener("click", () => {
  downloadJson("x3-preview-lab-bug-bundle.json", sanitizedBugBundle());
  recordingMessage = "Sanitized bug bundle exported without host paths, filenames, URLs, tokens, titles or content bodies.";
  paint();
});

boot().catch(error => {
  document.querySelector("#connection-status").textContent = "BOOT ERROR";
  document.querySelector("#recording-message").textContent = `Boot failed: ${error.message}`;
  console.error(error);
});

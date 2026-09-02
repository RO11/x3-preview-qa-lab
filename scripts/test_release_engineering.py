#!/usr/bin/env python3
"""Release-engineering tests for the public Windows alpha package."""

from __future__ import annotations

import json
import os
import socket
import struct
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
import zipfile
from contextlib import contextmanager
from pathlib import Path

from PIL import Image

import build_portable
import sanitize_release
from release_common import (
    BUNDLED_PYTHON_LICENSE_PUBLIC_RELATIVE,
    BUNDLED_FIRMWARE_SOURCE_RELATIVE,
    FIRMWARE_PROFILE,
    FIRMWARE_BASELINE_PROFILE,
    PRODUCT_NAME,
    RELEASE_PROFILE,
    TARGET_PROFILE,
    VERSION,
    require_plain_directory,
    scan_text_value,
)


SCRIPT_ROOT = Path(__file__).resolve().parent
SIMULATOR_ROOT = SCRIPT_ROOT.parent


@contextmanager
def environment(**values: str):
    previous = {key: os.environ.get(key) for key in values}
    os.environ.update(values)
    try:
        yield
    finally:
        for key, value in previous.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def packaging_test_root() -> Path:
    if os.name == "nt" and os.environ.get("CI", "").casefold() != "true":
        for candidate in (Path("D:/quarantine"), Path("E:/quarantine")):
            if candidate.exists():
                return require_plain_directory(candidate, "Release-test quarantine")
        raise RuntimeError("Release tests require D:\\quarantine or E:\\quarantine")
    candidate = Path(os.environ.get("RUNNER_TEMP") or tempfile.gettempdir())
    return require_plain_directory(candidate, "Release-test temp root")


class ReleaseEngineeringTests(unittest.TestCase):
    def test_documented_examples_have_native_and_sharp_presentation_pngs(self) -> None:
        native_names = (
            "x3-home-native-528x792.png",
            "daily-cards-v1-market-briefing-528x792.png",
            "daily-cards-v1-market-briefing-report-528x792.png",
            "inbox-v2-default-preview-528x792.png",
            "inbox-v2-feedback-actions-528x792.png",
            "inbox-v2-open-article-528x792.png",
            "inbox-v2-puzzle-preview-528x792.png",
            "inbox-v2-project-watchlist-preview-528x792.png",
            "inbox-v2-project-watchlist-open-528x792.png",
            "inbox-v2-business-opportunity-open-528x792.png",
            "inbox-v2-hardware-research-open-528x792.png",
            "inbox-v2-reader-genome-open-528x792.png",
        )
        native_palette = {
            (0, 0, 0),
            (85, 85, 85),
            (170, 170, 170),
            (255, 255, 255),
        }
        for name in native_names:
            native_path = SIMULATOR_ROOT / "docs" / "images" / name
            data = native_path.read_bytes()
            self.assertEqual(b"\x89PNG\r\n\x1a\n", data[:8], name)
            self.assertEqual(b"IHDR", data[12:16], name)
            self.assertEqual((528, 792), struct.unpack(">II", data[16:24]), name)

            doubled_name = name.replace("-528x792.png", "-2x-1056x1584.png")
            doubled_path = SIMULATOR_ROOT / "docs" / "images" / "engagement" / doubled_name
            doubled = doubled_path.read_bytes()
            self.assertEqual(b"\x89PNG\r\n\x1a\n", doubled[:8], doubled_name)
            self.assertEqual((1056, 1584), struct.unpack(">II", doubled[16:24]), doubled_name)
            with Image.open(native_path) as native_image, Image.open(doubled_path) as doubled_image:
                native_rgb = native_image.convert("RGB")
                doubled_rgb = doubled_image.convert("RGB")
                colors = native_rgb.getcolors(maxcolors=528 * 792)
                self.assertIsNotNone(colors, name)
                self.assertTrue({color for _count, color in colors}.issubset(native_palette), name)
                self.assertEqual(
                    native_rgb.resize((1056, 1584), Image.Resampling.NEAREST).tobytes(),
                    doubled_rgb.tobytes(),
                    doubled_name,
                )

        showcase = (SIMULATOR_ROOT / "docs" / "images" / "engagement" /
                    "xtinct-x3-native-showcase-2x.png").read_bytes()
        self.assertEqual((3456, 3688), struct.unpack(">II", showcase[16:24]))
        content_map = (SIMULATOR_ROOT / "docs" / "images" / "engagement" /
                       "xtinct-implemented-content-map-2400x1740.png").read_bytes()
        self.assertEqual((2400, 1740), struct.unpack(">II", content_map[16:24]))

    def test_public_demo_exposes_four_v1_cards_seven_v2_modules_and_broker_provenance(self) -> None:
        app = (SIMULATOR_ROOT / "web" / "app.js").read_text(encoding="utf-8")
        for task_id in (
            "market-briefing",
            "weekday-freelancer-scan",
            "3d-job-search",
            "outlook-attention-watch",
        ):
            self.assertIn(f'taskId: "{task_id}"', app)
        for module_id in (
            "spark-serial-demo",
            "reader-genome-demo",
            "daily-puzzle-demo",
            "project-watchlist-demo",
            "business-opportunities-demo",
            "hardware-research-demo",
            "weekend-city-guide-demo",
        ):
            self.assertIn(f'moduleId: "{module_id}"', app)
        self.assertIn("ChatGPT + Interactive Brokers app pattern", app)
        self.assertIn("Fictional values; read-only; no trades", app)
        self.assertIn("FICTIONAL MARKET BRIEFING", app)
        order_start = app.index("const practicalInboxOrder")
        order_end = app.index("];", order_start)
        order_block = app[order_start:order_end]
        self.assertLess(
            order_block.index('"project-watchlist-demo"'),
            order_block.index('"spark-serial-demo"'),
        )

        guide = (SIMULATOR_ROOT / "docs" / "AI_FED_CROSSPOINT_PIPELINE.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("### Daily Cards V1 flow", guide)
        self.assertIn("### Inbox V2 flow", guide)
        self.assertIn("prevents the same result being duplicated into both feeds", guide)

    def test_public_prompts_include_copy_ready_market_briefing(self) -> None:
        prompts = (
            SIMULATOR_ROOT / "docs" / "SCHEDULED_AI_CONTENT_PRODUCERS.md"
        ).read_text(encoding="utf-8")
        for required in (
            "### Market Briefing (Cards V1)",
            "Worker task ID: market-briefing",
            "Cards!D4:F4 only",
            '"task_id": "market-briefing"',
            '"actions": []',
            "No trades placed or modified.",
            "Never retry an ambiguous or failed write.",
            "do not mirror it into Inbox V2 or Today",
        ):
            self.assertIn(required, prompts)
        self.assertNotIn("<PRIVATE_CARDS_SHEET_ID>", prompts)
        readme = (SIMULATOR_ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(
            "SCHEDULED_AI_CONTENT_PRODUCERS.md#market-briefing-cards-v1",
            readme,
        )

    def test_lyra_home_header_has_no_false_title_or_divider(self) -> None:
        renderer = (SIMULATOR_ROOT / "web" / "x3-renderer.js").read_text(encoding="utf-8")
        self.assertIn(
            'drawHeader(ctx, null, state.fixtures.batteryPercent, METRICS.homeTopPadding);',
            renderer,
        )
        self.assertNotIn(
            'drawHeader(ctx, "XTINCT", state.fixtures.batteryPercent, METRICS.homeTopPadding);',
            renderer,
        )

    def test_runtime_license_exception_is_exact_and_does_not_weaken_email_scanning(self) -> None:
        approved = "Julian Seward, jseward@acm.org"
        self.assertEqual(
            [],
            scan_text_value(approved, BUNDLED_PYTHON_LICENSE_PUBLIC_RELATIVE),
        )
        self.assertNotEqual(
            [],
            scan_text_value(approved, Path("unrelated/LICENSE.txt")),
        )
        self.assertNotEqual(
            [],
            scan_text_value(
                f"{approved}\nother@example.com",
                BUNDLED_PYTHON_LICENSE_PUBLIC_RELATIVE,
            ),
        )

    def test_public_source_set_is_sanitized_and_versioned(self) -> None:
        self.assertEqual([], sanitize_release.scan_source(SIMULATOR_ROOT))
        package = json.loads((SIMULATOR_ROOT / "package.json").read_text(encoding="utf-8"))
        self.assertEqual(VERSION, package["version"])
        self.assertNotEqual(True, package.get("private"))
        self.assertNotIn("repository", package)
        profile = json.loads(
            (SIMULATOR_ROOT / "release-profile.json").read_text(encoding="utf-8")
        )
        self.assertEqual(RELEASE_PROFILE, profile)
        self.assertEqual("x3-preview-release-profile/1", profile["schema"])
        self.assertEqual(PRODUCT_NAME, profile["product"])
        self.assertEqual(VERSION, profile["version"])
        self.assertEqual(TARGET_PROFILE, profile["target"])
        self.assertEqual(FIRMWARE_PROFILE, profile["firmware"])
        self.assertTrue(profile["firmware"]["bundled"])
        self.assertEqual(
            "bundled-official-baseline-read-only",
            profile["firmware"]["runtime_policy"],
        )
        readme = (SIMULATOR_ROOT / "README.md").read_text(encoding="utf-8")
        distribution = (SIMULATOR_ROOT / "docs/DISTRIBUTION.md").read_text(encoding="utf-8")
        self.assertIn(f"Version {VERSION}", readme)
        self.assertIn(f"v{VERSION}-bundled-python.zip", distribution)

    def test_two_builds_match_and_extracted_demo_launches(self) -> None:
        boundary = packaging_test_root()
        with tempfile.TemporaryDirectory(prefix="x3-preview-release-test-", dir=boundary) as temporary:
            root = Path(temporary)
            runner_temp = root / "runner-temp"
            output_one = root / "output-one"
            output_two = root / "output-two"
            runner_temp.mkdir()
            with environment(CI="true", RUNNER_TEMP=str(runner_temp)):
                first = build_portable.build(output_one)
                second = build_portable.build(output_two)

            self.assertEqual("source-portable", first["distribution"])
            self.assertFalse(first["bundled_runtime"])
            self.assertEqual(first["sha256"], second["sha256"])
            self.assertEqual(first["bytes"], second["bytes"])
            archive = Path(str(first["archive"]))
            self.assertEqual([], sanitize_release.scan_archive(archive))

            extracted = root / "extracted"
            extracted.mkdir()
            with zipfile.ZipFile(archive, "r") as source:
                source.extractall(extracted)
            product_roots = [path for path in extracted.iterdir() if path.is_dir()]
            self.assertEqual(1, len(product_roots))
            product_root = product_roots[0]
            application = product_root / build_portable.APP_RELATIVE_ROOT
            metadata = json.loads(
                (product_root / "release-metadata.json").read_text(encoding="utf-8")
            )
            packaged_profile = json.loads(
                (application / "release-profile.json").read_text(encoding="utf-8")
            )
            self.assertEqual(RELEASE_PROFILE, packaged_profile)
            self.assertEqual("x3-preview-qa-lab-release/2", metadata["schema"])
            self.assertEqual(RELEASE_PROFILE["schema"], metadata["profile_schema"])
            self.assertEqual(VERSION, metadata["version"])
            self.assertEqual(PRODUCT_NAME, metadata["product"])
            self.assertEqual(TARGET_PROFILE, metadata["target"])
            self.assertEqual(FIRMWARE_PROFILE, metadata["firmware"])
            self.assertTrue(metadata["firmware_included"])
            self.assertEqual(FIRMWARE_BASELINE_PROFILE, metadata["bundled_firmware"])
            packaged_baseline = application / BUNDLED_FIRMWARE_SOURCE_RELATIVE
            self.assertEqual(
                int(FIRMWARE_BASELINE_PROFILE["byte_count"]),
                packaged_baseline.stat().st_size,
            )
            self.assertEqual(
                FIRMWARE_BASELINE_PROFILE["sha256"],
                build_portable.sha256_file(packaged_baseline),
            )
            provenance = metadata["provenance"]
            self.assertEqual(
                build_portable.PUBLIC_PAYLOAD_DIGEST_ALGORITHM,
                provenance["public_payload_algorithm"],
            )
            self.assertEqual(
                build_portable.public_payload_sha256(product_root),
                provenance["public_payload_sha256"],
            )
            self.assertEqual(
                build_portable.sha256_file(Path(build_portable.__file__)),
                provenance["builder_script_sha256"],
            )
            self.assertEqual(
                build_portable.sha256_file(
                    application / "fixtures/x3-resource-budgets.demo.json"
                ),
                provenance["demo_contract_sha256"],
            )
            if provenance["git_head"] is not None:
                self.assertRegex(provenance["git_head"], r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$")
            self.assertIs(type(provenance["dirty"]), bool)
            self.assertIs(type(provenance["source_epoch"]), int)
            self.assertGreater(provenance["source_epoch"], 0)
            session_dirs_before = {
                path.name
                for path in boundary.iterdir()
                if path.is_dir() and path.name.startswith("xtinct-x3-simulator-")
            }
            self._smoke_server(application)
            session_dirs_after = {
                path.name
                for path in boundary.iterdir()
                if path.is_dir() and path.name.startswith("xtinct-x3-simulator-")
            }
            self.assertEqual(
                session_dirs_before,
                session_dirs_after,
                "extracted-package smoke leaked disposable simulator state",
            )

    def _smoke_server(self, application: Path) -> None:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.bind(("127.0.0.1", 0))
            port = int(probe.getsockname()[1])
        environment_values = dict(os.environ)
        environment_values["PYTHONUNBUFFERED"] = "1"
        # Run the extracted backend through its public classes and keep a tiny
        # stdin control channel so the test can exercise an orderly shutdown.
        # TerminateProcess on Windows skips TemporaryDirectory cleanup and
        # would leak one synthetic sleep.bmp into the quarantine per run.
        smoke_runner = """
import sys
import threading
import server

store = server.SessionStore()
httpd = server.X3SimulatorHTTPServer((server.LOOPBACK_HOST, int(sys.argv[1])), store)
thread = threading.Thread(target=httpd.serve_forever, daemon=True)
thread.start()
print("X3_RELEASE_SMOKE_READY", flush=True)
try:
    sys.stdin.readline()
finally:
    httpd.shutdown()
    httpd.server_close()
    thread.join(timeout=2)
    store.close()
"""
        process = subprocess.Popen(
            [sys.executable, "-B", "-c", smoke_runner, str(port)],
            cwd=application,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=environment_values,
        )
        try:
            origin = f"http://127.0.0.1:{port}"
            deadline = time.monotonic() + 12
            last_error: Exception | None = None
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    stdout, stderr = process.communicate(timeout=2)
                    self.fail(f"Extracted server exited with {process.returncode}: {stdout}\n{stderr}")
                try:
                    with urllib.request.urlopen(f"{origin}/api/fixtures", timeout=1) as response:
                        fixture = json.load(response)
                    break
                except Exception as error:  # bounded startup polling
                    last_error = error
                    time.sleep(0.1)
            else:
                self.fail(f"Extracted server did not become ready: {last_error}")

            self.assertEqual("xtinct-x3-simulator/1", fixture["schema"])
            self.assertEqual("Etc/UTC", fixture["timezone"])
            for endpoint in ("/api/device-contract", "/api/firmware", "/api/qemu", "/api/network/scenarios"):
                with urllib.request.urlopen(f"{origin}{endpoint}", timeout=2) as response:
                    self.assertEqual(200, response.status)
                    self.assertEqual("application/json", response.headers.get_content_type())
            with urllib.request.urlopen(f"{origin}/api/network/status", timeout=2) as response:
                status = json.load(response)
            self.assertEqual("disabled", status["outbound_network"])
        finally:
            if process.poll() is None:
                assert process.stdin is not None
                process.stdin.write("stop\n")
                process.stdin.flush()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # This is failure-only containment. The passing path must
                    # exit through the orderly cleanup above.
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
            if process.stdin is not None:
                process.stdin.close()
            if process.stdout is not None:
                process.stdout.close()
            if process.stderr is not None:
                process.stderr.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)

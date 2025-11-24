#!/usr/bin/env python3

import argparse
import json
import os
import subprocess
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class TestSuiteResult:
    name: str
    tests: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    errors: int = 0
    duration_ms: float = 0.0
    failures: list = field(default_factory=list)


@dataclass
class AggregatedResults:
    suites: list = field(default_factory=list)
    total_tests: int = 0
    total_passed: int = 0
    total_failed: int = 0
    total_skipped: int = 0
    total_errors: int = 0
    total_duration_ms: float = 0.0
    success: bool = True


def find_project_root() -> Path:
    current = Path.cwd()
    while current != current.parent:
        if (current / "package.json").exists() and (current / "apps").exists():
            return current
        current = current.parent
    return Path.cwd()


def run_jest_tests(project_root: Path, coverage: bool = False) -> Optional[TestSuiteResult]:
    api_dir = project_root / "apps" / "api"
    if not api_dir.exists():
        print(f"[WARN] API directory not found: {api_dir}")
        return None

    json_output_file = api_dir / "test-results.json"

    cmd = ["npm", "test", "--", "--json", f"--outputFile={json_output_file}"]
    if coverage:
        cmd.append("--coverage")

    print(f"\n{'='*60}")
    print("Running Jest Tests (Node.js API)")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print(f"Working directory: {api_dir}\n")

    env = os.environ.copy()
    env["NODE_ENV"] = "test"
    env["FORCE_COLOR"] = "0"

    use_shell = sys.platform == "win32"

    try:
        result = subprocess.run(
            cmd if not use_shell else " ".join(cmd),
            cwd=api_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,
            shell=use_shell
        )

        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

    except subprocess.TimeoutExpired:
        print("[ERROR] Jest tests timed out after 5 minutes")
        return TestSuiteResult(name="Jest (API)", failed=1, errors=1)
    except Exception as e:
        print(f"[ERROR] Failed to run Jest: {e}")
        return TestSuiteResult(name="Jest (API)", failed=1, errors=1)

    return parse_jest_json(json_output_file)


def parse_jest_json(json_file: Path) -> TestSuiteResult:
    suite = TestSuiteResult(name="Jest (API)")

    if not json_file.exists():
        print(f"[WARN] Jest JSON output not found: {json_file}")
        suite.errors = 1
        return suite

    try:
        with open(json_file, "r") as f:
            data = json.load(f)

        suite.tests = data.get("numTotalTests", 0)
        suite.passed = data.get("numPassedTests", 0)
        suite.failed = data.get("numFailedTests", 0)
        suite.skipped = data.get("numPendingTests", 0) + data.get("numTodoTests", 0)

        start_time = data.get("startTime", 0)
        end_time = start_time
        for test_result in data.get("testResults", []):
            if test_result.get("endTime", 0) > end_time:
                end_time = test_result.get("endTime", 0)
        suite.duration_ms = end_time - start_time if end_time > start_time else 0

        for test_result in data.get("testResults", []):
            for assertion in test_result.get("assertionResults", []):
                if assertion.get("status") == "failed":
                    failure_info = {
                        "test": assertion.get("fullName", "Unknown"),
                        "file": test_result.get("name", "Unknown"),
                        "message": "\n".join(assertion.get("failureMessages", []))[:500]
                    }
                    suite.failures.append(failure_info)

    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse Jest JSON: {e}")
        suite.errors = 1
    except Exception as e:
        print(f"[ERROR] Error processing Jest results: {e}")
        suite.errors = 1

    return suite


def run_gradle_tests(project_root: Path) -> Optional[TestSuiteResult]:
    java_dir = project_root / "services" / "reco-java"
    if not java_dir.exists():
        print(f"[WARN] Java service directory not found: {java_dir}")
        return None

    gradlew = java_dir / ("gradlew.bat" if sys.platform == "win32" else "gradlew")
    if not gradlew.exists():
        gradlew = "gradle"
    else:
        if sys.platform != "win32":
            os.chmod(gradlew, 0o755)

    cmd = [str(gradlew), "test", "--no-daemon"]

    print(f"\n{'='*60}")
    print("Running JUnit Tests (Java Service)")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print(f"Working directory: {java_dir}\n")

    use_shell = sys.platform == "win32"

    try:
        result = subprocess.run(
            cmd if not use_shell else " ".join(cmd),
            cwd=java_dir,
            capture_output=True,
            text=True,
            timeout=300,
            shell=use_shell
        )

        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

    except subprocess.TimeoutExpired:
        print("[ERROR] Gradle tests timed out after 5 minutes")
        return TestSuiteResult(name="JUnit (Java)", failed=1, errors=1)
    except FileNotFoundError:
        print("[WARN] Gradle not found, skipping Java tests")
        return None
    except Exception as e:
        print(f"[ERROR] Failed to run Gradle: {e}")
        return TestSuiteResult(name="JUnit (Java)", failed=1, errors=1)

    test_results_dir = java_dir / "build" / "test-results" / "test"
    return parse_junit_xml(test_results_dir)


def parse_junit_xml(test_results_dir: Path) -> TestSuiteResult:
    suite = TestSuiteResult(name="JUnit (Java)")

    if not test_results_dir.exists():
        print(f"[WARN] JUnit results directory not found: {test_results_dir}")
        return suite

    xml_files = list(test_results_dir.glob("TEST-*.xml"))
    if not xml_files:
        print(f"[WARN] No JUnit XML files found in {test_results_dir}")
        return suite

    for xml_file in xml_files:
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()

            tests = int(root.get("tests", 0))
            failures = int(root.get("failures", 0))
            errors = int(root.get("errors", 0))
            skipped = int(root.get("skipped", 0))
            time_str = root.get("time", "0")

            suite.tests += tests
            suite.failed += failures
            suite.errors += errors
            suite.skipped += skipped
            suite.passed += tests - failures - errors - skipped
            suite.duration_ms += float(time_str) * 1000

            for testcase in root.findall(".//testcase"):
                failure = testcase.find("failure")
                error = testcase.find("error")

                if failure is not None or error is not None:
                    elem = failure if failure is not None else error
                    failure_info = {
                        "test": f"{testcase.get('classname', '')}.{testcase.get('name', '')}",
                        "file": testcase.get("classname", "Unknown"),
                        "message": (elem.text or elem.get("message", ""))[:500]
                    }
                    suite.failures.append(failure_info)

        except ET.ParseError as e:
            print(f"[ERROR] Failed to parse {xml_file}: {e}")
            suite.errors += 1
        except Exception as e:
            print(f"[ERROR] Error processing {xml_file}: {e}")
            suite.errors += 1

    return suite


def aggregate_results(suites: list) -> AggregatedResults:
    results = AggregatedResults()

    for suite in suites:
        if suite is None:
            continue

        results.suites.append(suite)
        results.total_tests += suite.tests
        results.total_passed += suite.passed
        results.total_failed += suite.failed
        results.total_skipped += suite.skipped
        results.total_errors += suite.errors
        results.total_duration_ms += suite.duration_ms

        if suite.failed > 0 or suite.errors > 0:
            results.success = False

    return results


def generate_summary_report(results: AggregatedResults, output_file: Optional[Path] = None) -> str:
    lines = []
    lines.append("")
    lines.append("=" * 70)
    lines.append("TEST RESULTS SUMMARY")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 70)
    lines.append("")

    for suite in results.suites:
        status = "PASS" if suite.failed == 0 and suite.errors == 0 else "FAIL"
        duration_sec = suite.duration_ms / 1000

        lines.append(f"Suite: {suite.name}")
        lines.append(f"  Status:  {status}")
        lines.append(f"  Tests:   {suite.tests}")
        lines.append(f"  Passed:  {suite.passed}")
        lines.append(f"  Failed:  {suite.failed}")
        lines.append(f"  Skipped: {suite.skipped}")
        lines.append(f"  Errors:  {suite.errors}")
        lines.append(f"  Time:    {duration_sec:.2f}s")
        lines.append("")

    lines.append("-" * 70)
    lines.append("TOTALS")
    lines.append("-" * 70)
    lines.append(f"  Total Tests:   {results.total_tests}")
    lines.append(f"  Total Passed:  {results.total_passed}")
    lines.append(f"  Total Failed:  {results.total_failed}")
    lines.append(f"  Total Skipped: {results.total_skipped}")
    lines.append(f"  Total Errors:  {results.total_errors}")
    lines.append(f"  Total Time:    {results.total_duration_ms / 1000:.2f}s")
    lines.append("")

    if results.total_tests > 0:
        pass_rate = (results.total_passed / results.total_tests) * 100
        lines.append(f"  Pass Rate:     {pass_rate:.1f}%")
        lines.append("")

    if results.success:
        lines.append("=" * 70)
        lines.append("ALL TESTS PASSED")
        lines.append("=" * 70)
    else:
        lines.append("=" * 70)
        lines.append("SOME TESTS FAILED")
        lines.append("=" * 70)
        lines.append("")

        for suite in results.suites:
            if suite.failures:
                lines.append(f"Failures in {suite.name}:")
                for i, failure in enumerate(suite.failures[:5], 1):
                    lines.append(f"  {i}. {failure['test']}")
                    if failure.get("message"):
                        msg_lines = failure["message"].split("\n")[:3]
                        for msg_line in msg_lines:
                            lines.append(f"     {msg_line[:80]}")
                if len(suite.failures) > 5:
                    lines.append(f"  ... and {len(suite.failures) - 5} more failures")
                lines.append("")

    report = "\n".join(lines)

    if output_file:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, "w") as f:
            f.write(report)
        print(f"\nReport saved to: {output_file}")

    return report


def generate_json_report(results: AggregatedResults, output_file: Path) -> None:
    report = {
        "generated_at": datetime.now().isoformat(),
        "success": results.success,
        "summary": {
            "total_tests": results.total_tests,
            "total_passed": results.total_passed,
            "total_failed": results.total_failed,
            "total_skipped": results.total_skipped,
            "total_errors": results.total_errors,
            "total_duration_ms": results.total_duration_ms,
            "pass_rate": (results.total_passed / results.total_tests * 100) if results.total_tests > 0 else 0
        },
        "suites": []
    }

    for suite in results.suites:
        suite_data = {
            "name": suite.name,
            "tests": suite.tests,
            "passed": suite.passed,
            "failed": suite.failed,
            "skipped": suite.skipped,
            "errors": suite.errors,
            "duration_ms": suite.duration_ms,
            "success": suite.failed == 0 and suite.errors == 0,
            "failures": suite.failures
        }
        report["suites"].append(suite_data)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"JSON report saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Run and aggregate test results from Jest and JUnit test suites"
    )
    parser.add_argument(
        "--jest-only",
        action="store_true",
        help="Run only Jest tests"
    )
    parser.add_argument(
        "--java-only",
        action="store_true",
        help="Run only Java/JUnit tests"
    )
    parser.add_argument(
        "--coverage",
        action="store_true",
        help="Run Jest with coverage"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="test-reports",
        help="Directory for output reports (default: test-reports)"
    )
    parser.add_argument(
        "--project-root",
        type=str,
        help="Project root directory (auto-detected if not specified)"
    )
    parser.add_argument(
        "--ci",
        action="store_true",
        help="Running in CI environment"
    )

    args = parser.parse_args()

    if args.project_root:
        project_root = Path(args.project_root)
    else:
        project_root = find_project_root()

    print(f"Project root: {project_root}")

    suites = []

    if not args.java_only:
        jest_result = run_jest_tests(project_root, coverage=args.coverage)
        suites.append(jest_result)

    if not args.jest_only:
        junit_result = run_gradle_tests(project_root)
        suites.append(junit_result)

    results = aggregate_results(suites)

    output_dir = project_root / args.output_dir
    text_report = generate_summary_report(results, output_dir / "summary.txt")
    generate_json_report(results, output_dir / "summary.json")

    print(text_report)

    if args.ci:
        github_output = os.environ.get("GITHUB_OUTPUT")
        if github_output:
            with open(github_output, "a") as f:
                f.write(f"total_tests={results.total_tests}\n")
                f.write(f"total_passed={results.total_passed}\n")
                f.write(f"total_failed={results.total_failed}\n")
                f.write(f"tests_passed={'true' if results.success else 'false'}\n")

        github_step_summary = os.environ.get("GITHUB_STEP_SUMMARY")
        if github_step_summary:
            with open(github_step_summary, "a") as f:
                f.write("## Test Results Summary\n\n")
                f.write(f"| Metric | Value |\n")
                f.write(f"|--------|-------|\n")
                f.write(f"| Total Tests | {results.total_tests} |\n")
                f.write(f"| Passed | {results.total_passed} |\n")
                f.write(f"| Failed | {results.total_failed} |\n")
                f.write(f"| Skipped | {results.total_skipped} |\n")
                if results.total_tests > 0:
                    pass_rate = (results.total_passed / results.total_tests) * 100
                    f.write(f"| Pass Rate | {pass_rate:.1f}% |\n")
                f.write("\n")

                if results.success:
                    f.write("### ✅ All tests passed!\n")
                else:
                    f.write("### ❌ Some tests failed\n")

    sys.exit(0 if results.success else 1)


if __name__ == "__main__":
    main()
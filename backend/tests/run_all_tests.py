import importlib
import os
import subprocess
import sys
from typing import Dict, List, Tuple

# List of test modules to run
TEST_MODULES = [
    "tests.test_auth",
    "tests.test_protocols",
    "tests.test_user_protocols",
    "tests.test_ai_endpoints",
    "tests.test_security",
]


def run_test_module(module_name: str) -> Tuple[bool, str]:
    """
    Run a test module as a subprocess and capture the output.

    Args:
        module_name: Name of the test module to run

    Returns:
        Tuple of (success, output)
    """
    print(f"\n{'='*80}")
    print(f"Running {module_name}...")
    print(f"{'='*80}\n")

    # Run the test module as a subprocess
    result = subprocess.run(["python", "-m", module_name], capture_output=True, text=True)

    # Print the output
    print(result.stdout)
    if result.stderr:
        print("ERRORS:")
        print(result.stderr)

    # Return success status and output
    return result.returncode == 0, result.stdout + result.stderr


def main():
    """Run all test modules and print a summary."""
    results = {}
    all_success = True

    for module_name in TEST_MODULES:
        success, output = run_test_module(module_name)
        results[module_name] = {"success": success, "output": output}

        if not success:
            all_success = False

    # Print summary
    print("\n\n")
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    for module_name, result in results.items():
        status = "PASSED" if result["success"] else "FAILED"
        print(f"{module_name}: {status}")

    # Return appropriate exit code
    return 0 if all_success else 1


if __name__ == "__main__":
    sys.exit(main())

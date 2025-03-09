import importlib
import os
import subprocess
import sys
from typing import List, Tuple

# List of test modules to run
TEST_MODULES = ["tests.test_auth", "tests.test_protocols", "tests.test_user_protocols", "tests.test_ai_endpoints"]


def run_test_module(module_name: str) -> Tuple[bool, str]:
    """Run a test module and return success status and output."""
    print(f"\n{'=' * 80}")
    print(f"Running {module_name}...")
    print(f"{'=' * 80}\n")

    try:
        # Run the test module as a subprocess to capture output
        result = subprocess.run([sys.executable, "-m", module_name], capture_output=True, text=True)

        # Print the output
        print(result.stdout)
        if result.stderr:
            print("ERRORS:")
            print(result.stderr)

        # Return success status and output
        return result.returncode == 0, result.stdout
    except Exception as e:
        print(f"Error running {module_name}: {e}")
        return False, str(e)


def main():
    """Run all tests and print a summary."""
    results = []

    for module_name in TEST_MODULES:
        success, output = run_test_module(module_name)
        results.append((module_name, success))

    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    all_passed = True
    for module_name, success in results:
        status = "PASSED" if success else "FAILED"
        print(f"{module_name}: {status}")
        if not success:
            all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed. See above for details.")
    print("=" * 80)

    # Return exit code
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

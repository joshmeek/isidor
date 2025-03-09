import importlib
import os
import subprocess
import sys
from typing import Dict, List, Tuple, Union

# List of test modules to run
TEST_MODULES = [
    "tests.test_auth",
    "tests.test_protocols",
    "tests.test_user_protocols",
    "tests.test_ai_endpoints",
    "tests.test_security",  # Add the new security test
]


def run_test_module(module_name: str) -> Tuple[bool, str]:
    """
    Run a test module as a subprocess and capture the output.

    Args:
        module_name: The name of the module to run

    Returns:
        Tuple of (success, output)
    """
    print(f"\n================================================================================")
    print(f"Running {module_name}...")
    print(f"================================================================================\n")

    # Run the test module as a subprocess
    process = subprocess.Popen([sys.executable, "-m", module_name], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

    # Capture the output
    output, _ = process.communicate()

    # Print the output
    print(output)

    # Return success status and output
    return process.returncode == 0, output


def main():
    """Run all test modules and print a summary."""
    results: Dict[str, bool] = {}

    # Run each test module
    for module_name in TEST_MODULES:
        success, _ = run_test_module(module_name)
        results[module_name] = success

    # Print summary
    print("\n================================================================================")
    print("TEST SUMMARY")
    print("================================================================================")

    all_passed = True
    for module_name, success in results.items():
        status = "PASSED" if success else "FAILED"
        print(f"{module_name}: {status}")
        if not success:
            all_passed = False

    print("\n================================================================================")
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed!")
    print("================================================================================\n")

    # Return exit code based on success
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

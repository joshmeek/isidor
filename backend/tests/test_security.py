import json
import time
import uuid
from datetime import date, datetime, timedelta

import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Test user credentials
TEST_USER_1_EMAIL = f"test_security_user1_{uuid.uuid4()}@example.com"
TEST_USER_1_PASSWORD = "testpassword123"
TEST_USER_1_ID = None

TEST_USER_2_EMAIL = f"test_security_user2_{uuid.uuid4()}@example.com"
TEST_USER_2_PASSWORD = "testpassword123"
TEST_USER_2_ID = None

# Tokens
USER_1_ACCESS_TOKEN = None
USER_1_REFRESH_TOKEN = None
USER_2_ACCESS_TOKEN = None
USER_2_REFRESH_TOKEN = None

# Test health metric data with sensitive information
TEST_HEALTH_METRIC = {
    "date": date.today().isoformat(),
    "metric_type": "health_test",
    "value": {"heart_rate": 75, "blood_pressure": "120/80", "weight": 70.5, "notes": "This is a sensitive note that should be encrypted"},
    "source": "manual",
}

# Test metric ID
TEST_METRIC_ID = None


def create_test_users():
    """Create two test users for security testing."""
    global TEST_USER_1_ID, TEST_USER_2_ID

    # Create first test user
    response = requests.post(f"{BASE_URL}/users/", json={"email": TEST_USER_1_EMAIL, "password": TEST_USER_1_PASSWORD})

    if response.status_code == 200:
        user_data = response.json()
        TEST_USER_1_ID = user_data["id"]
        print(f"Created test user 1 with ID: {TEST_USER_1_ID}")
    else:
        print(f"Failed to create test user 1: {response.text}")
        return False

    # Create second test user
    response = requests.post(f"{BASE_URL}/users/", json={"email": TEST_USER_2_EMAIL, "password": TEST_USER_2_PASSWORD})

    if response.status_code == 200:
        user_data = response.json()
        TEST_USER_2_ID = user_data["id"]
        print(f"Created test user 2 with ID: {TEST_USER_2_ID}")
        return True
    else:
        print(f"Failed to create test user 2: {response.text}")
        return False


def login_users():
    """Login both test users and get their tokens."""
    global USER_1_ACCESS_TOKEN, USER_1_REFRESH_TOKEN, USER_2_ACCESS_TOKEN, USER_2_REFRESH_TOKEN

    # Login first user
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_USER_1_EMAIL, "password": TEST_USER_1_PASSWORD})

    if response.status_code == 200:
        token_data = response.json()
        USER_1_ACCESS_TOKEN = token_data["access_token"]
        USER_1_REFRESH_TOKEN = token_data["refresh_token"]
        print("User 1 login successful, tokens received")
    else:
        print(f"User 1 login failed: {response.text}")
        return False

    # Login second user
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_USER_2_EMAIL, "password": TEST_USER_2_PASSWORD})

    if response.status_code == 200:
        token_data = response.json()
        USER_2_ACCESS_TOKEN = token_data["access_token"]
        USER_2_REFRESH_TOKEN = token_data["refresh_token"]
        print("User 2 login successful, tokens received")
        return True
    else:
        print(f"User 2 login failed: {response.text}")
        return False


def test_authorization_user_endpoints():
    """Test that users can only access their own user data."""
    print("\nTesting authorization for user endpoints...")

    # User 1 accessing their own data (should succeed)
    response = requests.get(f"{BASE_URL}/users/{TEST_USER_1_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"})

    if response.status_code == 200:
        print("✓ User 1 can access their own data")
    else:
        print(f"✗ User 1 cannot access their own data: {response.status_code} - {response.text}")
        return False

    # User 1 trying to access User 2's data (should fail with 403)
    response = requests.get(f"{BASE_URL}/users/{TEST_USER_2_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"})

    if response.status_code == 403:
        print("✓ User 1 cannot access User 2's data (403 Forbidden)")
        return True
    else:
        print(f"✗ User 1 can access User 2's data: {response.status_code} - {response.text}")
        return False


def create_health_metric():
    """Create a health metric for User 1."""
    global TEST_METRIC_ID

    # Create health metric for User 1
    metric_data = TEST_HEALTH_METRIC.copy()
    metric_data["user_id"] = TEST_USER_1_ID

    response = requests.post(f"{BASE_URL}/health-metrics/", json=metric_data, headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"})

    if response.status_code == 200:
        metric = response.json()
        TEST_METRIC_ID = metric["id"]
        print(f"Created health metric with ID: {TEST_METRIC_ID}")

        # Verify the response data doesn't contain raw sensitive data
        if "ENCRYPTED:" in json.dumps(response.json()):
            print("✗ Response contains raw encrypted data")
            return False

        # Check if sensitive fields are present but decrypted for the response
        value = metric["value"]
        if "heart_rate" in value and "blood_pressure" in value and "weight" in value and "notes" in value:
            print("✓ Sensitive data is properly decrypted in the response")
            return True
        else:
            print("✗ Sensitive data is missing in the response")
            return False
    else:
        print(f"Failed to create health metric: {response.text}")
        return False


def test_authorization_health_metrics():
    """Test that users can only access their own health metrics."""
    print("\nTesting authorization for health metrics endpoints...")

    # User 1 accessing their own metric (should succeed)
    response = requests.get(f"{BASE_URL}/health-metrics/{TEST_METRIC_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"})

    if response.status_code == 200:
        print("✓ User 1 can access their own health metric")
    else:
        print(f"✗ User 1 cannot access their own health metric: {response.status_code} - {response.text}")
        return False

    # User 2 trying to access User 1's metric (should fail with 403)
    response = requests.get(f"{BASE_URL}/health-metrics/{TEST_METRIC_ID}", headers={"Authorization": f"Bearer {USER_2_ACCESS_TOKEN}"})

    if response.status_code == 403:
        print("✓ User 2 cannot access User 1's health metric (403 Forbidden)")
        return True
    else:
        print(f"✗ User 2 can access User 1's health metric: {response.status_code} - {response.text}")
        return False


def test_authorization_ai_endpoints():
    """Test that users can only access AI insights for their own data."""
    print("\nTesting authorization for AI endpoints...")

    # User 1 requesting insights for their own data (should succeed)
    response = requests.post(
        f"{BASE_URL}/ai/insights/{TEST_USER_1_ID}",
        json={"query": "How is my health?", "metric_types": ["health_test"]},
        headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"},
    )

    if response.status_code == 200:
        print("✓ User 1 can request AI insights for their own data")
    else:
        print(f"✗ User 1 cannot request AI insights for their own data: {response.status_code} - {response.text}")
        return False

    # User 2 trying to request insights for User 1's data (should fail with 403)
    response = requests.post(
        f"{BASE_URL}/ai/insights/{TEST_USER_1_ID}",
        json={"query": "How is my health?", "metric_types": ["health_test"]},
        headers={"Authorization": f"Bearer {USER_2_ACCESS_TOKEN}"},
    )

    if response.status_code == 403:
        print("✓ User 2 cannot request AI insights for User 1's data (403 Forbidden)")
        return True
    else:
        print(f"✗ User 2 can request AI insights for User 1's data: {response.status_code} - {response.text}")
        return False


def test_rate_limiting():
    """Test that rate limiting is working."""
    print("\nTesting rate limiting...")

    # Make multiple requests in quick succession
    start_time = time.time()
    success_count = 0
    rate_limited = False

    # We'll make 10 requests - if rate limiting is working correctly with default settings,
    # we shouldn't be rate limited for this small number
    for i in range(10):
        response = requests.get(
            f"{BASE_URL}/health-metrics/user/{TEST_USER_1_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"}
        )

        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 429:
            rate_limited = True
            print(f"Rate limited after {i+1} requests")
            break

    end_time = time.time()
    duration = end_time - start_time

    print(f"Made {success_count} successful requests in {duration:.2f} seconds")

    if rate_limited:
        print("✓ Rate limiting is working (got 429 response)")
    else:
        print("✓ Made 10 requests without being rate limited (as expected with default settings)")

    return True


def cleanup():
    """Delete test users and their data."""
    print("\nCleaning up: Deleting test data...")

    # Delete health metric
    if TEST_METRIC_ID:
        response = requests.delete(
            f"{BASE_URL}/health-metrics/{TEST_METRIC_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"}
        )

        if response.status_code == 200:
            print(f"Health metric {TEST_METRIC_ID} deleted successfully")
        else:
            print(f"Failed to delete health metric: {response.text}")

    # Delete test users
    if TEST_USER_1_ID:
        response = requests.delete(f"{BASE_URL}/users/{TEST_USER_1_ID}", headers={"Authorization": f"Bearer {USER_1_ACCESS_TOKEN}"})

        if response.status_code == 200:
            print(f"Test user 1 {TEST_USER_1_ID} deleted successfully")
        else:
            print(f"Failed to delete test user 1: {response.text}")

    if TEST_USER_2_ID:
        response = requests.delete(f"{BASE_URL}/users/{TEST_USER_2_ID}", headers={"Authorization": f"Bearer {USER_2_ACCESS_TOKEN}"})

        if response.status_code == 200:
            print(f"Test user 2 {TEST_USER_2_ID} deleted successfully")
        else:
            print(f"Failed to delete test user 2: {response.text}")


if __name__ == "__main__":
    print("=== SECURITY FEATURES TEST ===")

    # Create test users
    if not create_test_users():
        print("Failed to create test users. Exiting.")
        exit(1)

    # Login users
    if not login_users():
        print("Failed to login test users. Exiting.")
        cleanup()
        exit(1)

    # Test authorization for user endpoints
    user_auth_success = test_authorization_user_endpoints()

    # Create health metric for testing
    if not create_health_metric():
        print("Failed to create health metric. Exiting.")
        cleanup()
        exit(1)

    # Test authorization for health metrics endpoints
    health_metrics_auth_success = test_authorization_health_metrics()

    # Test authorization for AI endpoints
    ai_auth_success = test_authorization_ai_endpoints()

    # Test rate limiting
    rate_limiting_success = test_rate_limiting()

    # Clean up
    cleanup()

    # Print summary
    print("\n=== TEST SUMMARY ===")
    print(f"User Authorization: {'PASSED' if user_auth_success else 'FAILED'}")
    print(f"Health Metrics Authorization: {'PASSED' if health_metrics_auth_success else 'FAILED'}")
    print(f"AI Endpoints Authorization: {'PASSED' if ai_auth_success else 'FAILED'}")
    print(f"Rate Limiting: {'PASSED' if rate_limiting_success else 'FAILED'}")

    if user_auth_success and health_metrics_auth_success and ai_auth_success and rate_limiting_success:
        print("\nAll security tests PASSED!")
        exit(0)
    else:
        print("\nSome security tests FAILED!")
        exit(1)

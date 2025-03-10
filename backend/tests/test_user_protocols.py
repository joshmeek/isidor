import json
import os
import uuid
from datetime import date, datetime, timedelta
from typing import Dict, Optional

import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

# Test user credentials
TEST_EMAIL = f"test_user_protocol_{uuid.uuid4()}@example.com"
TEST_PASSWORD = "testpassword123"
TEST_USER_ID = None

# Authentication tokens
ACCESS_TOKEN = None
REFRESH_TOKEN = None

# Test protocol data
TEST_PROTOCOL_ID = None
TEST_PROTOCOL = {
    "name": "Test Protocol",
    "description": "A test protocol for user protocol testing",
    "target_metrics": ["sleep", "activity"],
    "duration_type": "fixed",
    "duration_days": 14,
}

# Test user protocol data
TEST_USER_PROTOCOL_ID = None


def create_test_user():
    """Create a test user for user protocol tests."""
    global TEST_USER_ID, ACCESS_TOKEN

    print(f"Creating test user with email: {TEST_EMAIL}")

    # Create a test user
    response = requests.post(f"{BASE_URL}/users/", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})

    if response.status_code != 200:
        print(f"Failed to create user: {response.text}")
        return False

    user_data = response.json()
    TEST_USER_ID = user_data["id"]

    print(f"Created test user with ID: {TEST_USER_ID}")

    # Login to get access token
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_EMAIL, "password": TEST_PASSWORD})

    if response.status_code != 200:
        print(f"Failed to login: {response.text}")
        return False

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]

    return True


def create_test_protocol():
    """Create a test protocol for user protocol tests."""
    global TEST_PROTOCOL_ID, ACCESS_TOKEN

    print("Creating test protocol...")

    # Create a protocol
    response = requests.post(f"{BASE_URL}/protocols/", json=TEST_PROTOCOL, headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    if response.status_code != 200:
        print(f"Failed to create protocol: {response.text}")
        return False

    protocol_data = response.json()
    TEST_PROTOCOL_ID = protocol_data["id"]

    print(f"Created protocol with ID: {TEST_PROTOCOL_ID}")
    return True


def test_enroll_in_protocol():
    """Test enrolling a user in a protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN, TEST_PROTOCOL_ID

    print("Testing protocol enrollment...")

    # Enroll in protocol
    start_date = (date.today() - timedelta(days=2)).isoformat()

    response = requests.post(
        f"{BASE_URL}/user-protocols/enroll",
        json={"protocol_id": TEST_PROTOCOL_ID, "start_date": start_date},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Failed to enroll in protocol: {response.text}"

    user_protocol_data = response.json()
    TEST_USER_PROTOCOL_ID = user_protocol_data["id"]

    assert user_protocol_data["protocol_id"] == TEST_PROTOCOL_ID, "Protocol ID doesn't match"
    assert user_protocol_data["user_id"] == TEST_USER_ID, "User ID doesn't match"
    assert user_protocol_data["start_date"] == start_date, "Start date doesn't match"
    assert user_protocol_data["status"] == "active", "Status should be active"

    print(f"Enrolled in protocol with user protocol ID: {TEST_USER_PROTOCOL_ID}")
    return True


def test_get_user_protocols():
    """Test getting all user protocols."""
    global ACCESS_TOKEN

    print("Testing get user protocols...")

    # Get user protocols
    response = requests.get(f"{BASE_URL}/user-protocols/", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get user protocols: {response.text}"

    user_protocols = response.json()
    assert len(user_protocols) > 0, "No user protocols returned"

    # Check if our test protocol is in the list
    test_protocol = next((p for p in user_protocols if p["id"] == TEST_USER_PROTOCOL_ID), None)
    assert test_protocol is not None, f"User protocol with ID {TEST_USER_PROTOCOL_ID} not found"

    # Check if protocol details are included
    assert "protocol" in test_protocol, "Protocol details not included in response"
    assert test_protocol["protocol"]["id"] == TEST_PROTOCOL_ID, "Protocol ID doesn't match"

    print(f"Successfully retrieved {len(user_protocols)} user protocols")
    return True


def test_get_active_protocols():
    """Test getting active user protocols."""
    global ACCESS_TOKEN

    print("Testing get active user protocols...")

    # Get active user protocols
    response = requests.get(f"{BASE_URL}/user-protocols/active", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get active user protocols: {response.text}"

    active_protocols = response.json()
    assert len(active_protocols) > 0, "No active user protocols returned"

    # Check if our test protocol is in the list
    test_protocol = next((p for p in active_protocols if p["id"] == TEST_USER_PROTOCOL_ID), None)
    assert test_protocol is not None, f"User protocol with ID {TEST_USER_PROTOCOL_ID} not found in active protocols"

    print(f"Successfully retrieved {len(active_protocols)} active user protocols")
    return True


def test_get_user_protocol():
    """Test getting a specific user protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing get specific user protocol...")

    # Get user protocol
    response = requests.get(f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get user protocol: {response.text}"

    user_protocol = response.json()
    assert user_protocol["id"] == TEST_USER_PROTOCOL_ID, "User protocol ID doesn't match"
    assert user_protocol["protocol_id"] == TEST_PROTOCOL_ID, "Protocol ID doesn't match"
    assert user_protocol["user_id"] == TEST_USER_ID, "User ID doesn't match"

    print("Successfully retrieved user protocol")
    return True


def test_update_user_protocol_status():
    """Test updating the status of a user protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing update user protocol status...")

    # Update status to paused
    response = requests.put(
        f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}/status",
        json={"status": "paused"},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Failed to update user protocol status: {response.text}"

    user_protocol = response.json()
    assert user_protocol["status"] == "paused", "Status should be paused"

    print("Successfully updated user protocol status to paused")

    # Update status back to active
    response = requests.put(
        f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}/status",
        json={"status": "active"},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Failed to update user protocol status: {response.text}"

    user_protocol = response.json()
    assert user_protocol["status"] == "active", "Status should be active"

    print("Successfully updated user protocol status back to active")
    return True


def test_get_protocol_progress():
    """Test getting progress information for a user protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing get protocol progress...")

    # Get protocol progress
    response = requests.get(
        f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}/progress", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"}
    )

    assert response.status_code == 200, f"Failed to get protocol progress: {response.text}"

    progress = response.json()
    assert progress["user_protocol_id"] == TEST_USER_PROTOCOL_ID, "User protocol ID doesn't match"
    assert progress["protocol_id"] == TEST_PROTOCOL_ID, "Protocol ID doesn't match"
    assert "days_elapsed" in progress, "Days elapsed not included in progress"
    assert "completion_percentage" in progress, "Completion percentage not included in progress"

    print("Successfully retrieved protocol progress")
    return True


def test_complete_protocol():
    """Test completing a user protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing complete protocol...")

    # Complete the protocol
    response = requests.put(
        f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Failed to complete protocol: {response.text}"

    user_protocol = response.json()
    assert user_protocol["status"] == "completed", "Status should be completed"
    assert user_protocol["end_date"] is not None, "End date should be set"

    print("Successfully completed protocol")
    return True


def test_delete_user_protocol():
    """Test deleting a user protocol."""
    global TEST_USER_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing delete user protocol...")

    # Delete the user protocol
    response = requests.delete(f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to delete user protocol: {response.text}"

    # Verify deletion
    response = requests.get(f"{BASE_URL}/user-protocols/{TEST_USER_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 404, "User protocol should not exist after deletion"

    print("Successfully deleted user protocol")
    return True


def cleanup():
    """Clean up by deleting the test protocol and user."""
    global TEST_PROTOCOL_ID, TEST_USER_ID, ACCESS_TOKEN

    if TEST_PROTOCOL_ID and ACCESS_TOKEN:
        print(f"Cleaning up: Deleting test protocol {TEST_PROTOCOL_ID}...")

        # Delete the test protocol
        response = requests.delete(f"{BASE_URL}/protocols/{TEST_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

        if response.status_code == 200:
            print("Test protocol deleted successfully")
        else:
            print(f"Warning: Failed to delete test protocol: {response.text}")

    if TEST_USER_ID and ACCESS_TOKEN:
        print(f"Cleaning up: Deleting test user {TEST_USER_ID}...")

        # Delete the test user
        response = requests.delete(f"{BASE_URL}/users/{TEST_USER_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

        if response.status_code == 200:
            print("Test user deleted successfully")
        else:
            print(f"Warning: Failed to delete test user: {response.text}")


if __name__ == "__main__":
    try:
        # Setup
        if not create_test_user():
            print("Failed to create test user. Exiting.")
            exit(1)

        if not create_test_protocol():
            print("Failed to create test protocol. Exiting.")
            exit(1)

        # Run tests
        enroll_success = test_enroll_in_protocol()
        get_all_success = test_get_user_protocols() if enroll_success else False
        get_active_success = test_get_active_protocols() if enroll_success else False
        get_one_success = test_get_user_protocol() if enroll_success else False
        status_update_success = test_update_user_protocol_status() if enroll_success else False
        progress_success = test_get_protocol_progress() if enroll_success else False
        complete_success = test_complete_protocol() if enroll_success else False
        delete_success = test_delete_user_protocol() if enroll_success else False

        # Print summary
        print("\nTest Summary:")
        print(f"Enroll in Protocol: {'Success' if enroll_success else 'Failed'}")
        print(f"Get All User Protocols: {'Success' if get_all_success else 'Failed'}")
        print(f"Get Active Protocols: {'Success' if get_active_success else 'Failed'}")
        print(f"Get Specific User Protocol: {'Success' if get_one_success else 'Failed'}")
        print(f"Update Protocol Status: {'Success' if status_update_success else 'Failed'}")
        print(f"Get Protocol Progress: {'Success' if progress_success else 'Failed'}")
        print(f"Complete Protocol: {'Success' if complete_success else 'Failed'}")
        print(f"Delete User Protocol: {'Success' if delete_success else 'Failed'}")

        if all(
            [
                enroll_success,
                get_all_success,
                get_active_success,
                get_one_success,
                status_update_success,
                progress_success,
                complete_success,
                delete_success,
            ]
        ):
            print("\nAll user protocol tests passed!")
        else:
            print("\nSome user protocol tests failed.")

    finally:
        # Clean up
        cleanup()

import json
import os
import uuid
from datetime import date, datetime

import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Test user credentials
TEST_EMAIL = f"test_protocol_user_{uuid.uuid4()}@example.com"
TEST_PASSWORD = "testpassword123"
TEST_USER_ID = None

# Tokens
ACCESS_TOKEN = None

# Test protocol data
TEST_PROTOCOL_ID = None
TEST_PROTOCOL = {
    "name": "Test Protocol",
    "description": "A test protocol for API testing",
    "target_metrics": ["sleep", "activity"],
    "duration_type": "fixed",
    "duration_days": 14,
}

# Test protocol template
TEST_TEMPLATE_ID = "sleep_optimization"


def create_test_user():
    """Create a test user for protocol tests."""
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


def test_create_protocol():
    """Test creating a protocol."""
    global TEST_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing protocol creation...")

    # Create a protocol
    response = requests.post(f"{BASE_URL}/protocols/", json=TEST_PROTOCOL, headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to create protocol: {response.text}"

    protocol_data = response.json()
    TEST_PROTOCOL_ID = protocol_data["id"]

    assert protocol_data["name"] == TEST_PROTOCOL["name"], "Protocol name doesn't match"
    assert protocol_data["description"] == TEST_PROTOCOL["description"], "Protocol description doesn't match"

    print(f"Created protocol with ID: {TEST_PROTOCOL_ID}")
    return True


def test_get_protocol():
    """Test getting a protocol by ID."""
    global TEST_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing get protocol...")

    # Get the protocol
    response = requests.get(f"{BASE_URL}/protocols/{TEST_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get protocol: {response.text}"

    protocol_data = response.json()
    assert protocol_data["id"] == TEST_PROTOCOL_ID, "Protocol ID doesn't match"
    assert protocol_data["name"] == TEST_PROTOCOL["name"], "Protocol name doesn't match"

    print("Successfully retrieved protocol")
    return True


def test_update_protocol():
    """Test updating a protocol."""
    global TEST_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing protocol update...")

    # Update data
    update_data = {"name": f"{TEST_PROTOCOL['name']} - Updated", "description": f"{TEST_PROTOCOL['description']} - Updated"}

    # Update the protocol
    response = requests.put(
        f"{BASE_URL}/protocols/{TEST_PROTOCOL_ID}", json=update_data, headers={"Authorization": f"Bearer {ACCESS_TOKEN}"}
    )

    assert response.status_code == 200, f"Failed to update protocol: {response.text}"

    protocol_data = response.json()
    assert protocol_data["name"] == update_data["name"], "Updated protocol name doesn't match"
    assert protocol_data["description"] == update_data["description"], "Updated protocol description doesn't match"

    print("Successfully updated protocol")
    return True


def test_get_protocol_templates():
    """Test getting protocol templates."""
    global ACCESS_TOKEN

    print("Testing get protocol templates...")

    # Get protocol templates
    response = requests.get(f"{BASE_URL}/protocols/templates/list", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get protocol templates: {response.text}"

    templates = response.json()
    assert len(templates) > 0, "No protocol templates returned"

    # Check if sleep optimization template exists
    sleep_template = next((t for t in templates if t["template_id"] == TEST_TEMPLATE_ID), None)
    assert sleep_template is not None, f"Template with ID {TEST_TEMPLATE_ID} not found"

    print(f"Successfully retrieved {len(templates)} protocol templates")
    return True


def test_create_from_template():
    """Test creating a protocol from a template."""
    global ACCESS_TOKEN

    print("Testing create protocol from template...")

    # Create protocol from template
    template_data = {
        "template_id": TEST_TEMPLATE_ID,
        "name": "My Custom Sleep Protocol",
        "description": "A customized sleep optimization protocol",
    }

    response = requests.post(
        f"{BASE_URL}/protocols/templates/create", json=template_data, headers={"Authorization": f"Bearer {ACCESS_TOKEN}"}
    )

    assert response.status_code == 200, f"Failed to create protocol from template: {response.text}"

    protocol_data = response.json()
    assert protocol_data["name"] == template_data["name"], "Protocol name doesn't match"
    assert protocol_data["description"] == template_data["description"], "Protocol description doesn't match"
    assert "sleep" in protocol_data["target_metrics"], "Protocol should target sleep metrics"

    print(f"Successfully created protocol from template with ID: {protocol_data['id']}")
    return True


def test_delete_protocol():
    """Test deleting a protocol."""
    global TEST_PROTOCOL_ID, ACCESS_TOKEN

    print("Testing protocol deletion...")

    # Delete the protocol
    response = requests.delete(f"{BASE_URL}/protocols/{TEST_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to delete protocol: {response.text}"

    # Verify deletion
    response = requests.get(f"{BASE_URL}/protocols/{TEST_PROTOCOL_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 404, "Protocol should not exist after deletion"

    print("Successfully deleted protocol")
    return True


def cleanup():
    """Clean up by deleting the test user."""
    global TEST_USER_ID, ACCESS_TOKEN

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
        # Create test user
        if not create_test_user():
            print("Failed to create test user. Exiting.")
            exit(1)

        # Run tests
        create_success = test_create_protocol()
        get_success = test_get_protocol() if create_success else False
        update_success = test_update_protocol() if get_success else False
        templates_success = test_get_protocol_templates()
        template_create_success = test_create_from_template() if templates_success else False
        delete_success = test_delete_protocol() if create_success else False

        # Print summary
        print("\nTest Summary:")
        print(f"Create Protocol: {'Success' if create_success else 'Failed'}")
        print(f"Get Protocol: {'Success' if get_success else 'Failed'}")
        print(f"Update Protocol: {'Success' if update_success else 'Failed'}")
        print(f"Get Protocol Templates: {'Success' if templates_success else 'Failed'}")
        print(f"Create From Template: {'Success' if template_create_success else 'Failed'}")
        print(f"Delete Protocol: {'Success' if delete_success else 'Failed'}")

        if all([create_success, get_success, update_success, templates_success, template_create_success, delete_success]):
            print("\nAll protocol tests passed!")
        else:
            print("\nSome protocol tests failed.")

    finally:
        # Clean up
        cleanup()

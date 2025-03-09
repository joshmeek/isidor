import json
import os
import uuid
from datetime import datetime

import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Test user credentials
TEST_EMAIL = f"test_user_{uuid.uuid4()}@example.com"
TEST_PASSWORD = "testpassword123"
TEST_USER_ID = None

# Tokens
ACCESS_TOKEN = None
REFRESH_TOKEN = None


def test_create_user():
    """Test creating a user for authentication tests."""
    global TEST_USER_ID

    print(f"Creating test user with email: {TEST_EMAIL}")

    # Create a test user
    response = requests.post(f"{BASE_URL}/users/", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})

    assert response.status_code == 200, f"Failed to create user: {response.text}"

    user_data = response.json()
    TEST_USER_ID = user_data["id"]

    print(f"Created test user with ID: {TEST_USER_ID}")
    return True


def test_login():
    """Test user login and token generation."""
    global ACCESS_TOKEN, REFRESH_TOKEN

    print("Testing login...")

    # Login with test user
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_EMAIL, "password": TEST_PASSWORD})

    assert response.status_code == 200, f"Login failed: {response.text}"

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]
    REFRESH_TOKEN = token_data["refresh_token"]

    assert ACCESS_TOKEN is not None, "Access token not received"
    assert REFRESH_TOKEN is not None, "Refresh token not received"

    print("Login successful, tokens received")
    return True


def test_me_endpoint():
    """Test the /me endpoint with authentication."""
    global ACCESS_TOKEN

    print("Testing /me endpoint...")

    # Get current user info
    response = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

    assert response.status_code == 200, f"Failed to get user info: {response.text}"

    user_data = response.json()
    assert user_data["email"] == TEST_EMAIL, "Email in response doesn't match test user"

    print("Successfully retrieved user info")
    return True


def test_refresh_token():
    """Test refreshing the access token."""
    global ACCESS_TOKEN, REFRESH_TOKEN

    print("Testing token refresh...")

    # Refresh token
    response = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": REFRESH_TOKEN})

    assert response.status_code == 200, f"Token refresh failed: {response.text}"

    token_data = response.json()
    new_access_token = token_data["access_token"]
    new_refresh_token = token_data["refresh_token"]

    assert new_access_token is not None, "New access token not received"
    assert new_refresh_token is not None, "New refresh token not received"
    assert new_access_token != ACCESS_TOKEN, "New access token is the same as old one"

    # Update tokens
    ACCESS_TOKEN = new_access_token
    REFRESH_TOKEN = new_refresh_token

    print("Successfully refreshed tokens")
    return True


def test_change_password():
    """Test changing user password."""
    global ACCESS_TOKEN, TEST_PASSWORD

    print("Testing password change...")

    new_password = f"{TEST_PASSWORD}_new"

    # Change password
    response = requests.post(
        f"{BASE_URL}/auth/password-change",
        json={"current_password": TEST_PASSWORD, "new_password": new_password},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Password change failed: {response.text}"

    # Update password
    TEST_PASSWORD = new_password

    print("Successfully changed password")
    return True


def test_login_with_new_password():
    """Test login with the new password."""
    global ACCESS_TOKEN, REFRESH_TOKEN

    print("Testing login with new password...")

    # Login with new password
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_EMAIL, "password": TEST_PASSWORD})

    assert response.status_code == 200, f"Login with new password failed: {response.text}"

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]
    REFRESH_TOKEN = token_data["refresh_token"]

    print("Successfully logged in with new password")
    return True


def cleanup():
    """Clean up by deleting the test user."""
    global TEST_USER_ID, ACCESS_TOKEN

    if TEST_USER_ID:
        print(f"Cleaning up: Deleting test user {TEST_USER_ID}...")

        # Delete the test user
        response = requests.delete(f"{BASE_URL}/users/{TEST_USER_ID}", headers={"Authorization": f"Bearer {ACCESS_TOKEN}"})

        if response.status_code == 200:
            print("Test user deleted successfully")
        else:
            print(f"Warning: Failed to delete test user: {response.text}")


if __name__ == "__main__":
    try:
        # Run tests
        user_created = test_create_user()

        if user_created:
            login_success = test_login()
            me_endpoint_success = test_me_endpoint() if login_success else False
            refresh_success = test_refresh_token() if login_success else False
            password_change_success = test_change_password() if login_success else False
            new_login_success = test_login_with_new_password() if password_change_success else False

            # Print summary
            print("\nTest Summary:")
            print(f"Create User: {'Success' if user_created else 'Failed'}")
            print(f"Login: {'Success' if login_success else 'Failed'}")
            print(f"Me Endpoint: {'Success' if me_endpoint_success else 'Failed'}")
            print(f"Token Refresh: {'Success' if refresh_success else 'Failed'}")
            print(f"Password Change: {'Success' if password_change_success else 'Failed'}")
            print(f"Login with New Password: {'Success' if new_login_success else 'Failed'}")

            if all([user_created, login_success, me_endpoint_success, refresh_success, password_change_success, new_login_success]):
                print("\nAll authentication tests passed!")
            else:
                print("\nSome authentication tests failed.")

    finally:
        # Clean up
        cleanup()

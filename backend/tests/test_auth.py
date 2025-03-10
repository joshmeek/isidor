import json
import os
import uuid
from typing import Dict, Optional

import requests

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

# Test user credentials
TEST_EMAIL = f"test_user_{uuid.uuid4()}@example.com"
TEST_PASSWORD = "testpassword123"
TEST_USER_ID = None

# Authentication tokens
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

    # Login with the test user
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200, f"Login failed: {response.text}"

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]
    REFRESH_TOKEN = token_data["refresh_token"]

    assert ACCESS_TOKEN, "No access token returned"
    assert REFRESH_TOKEN, "No refresh token returned"

    print("Login successful, tokens received")
    return True


def test_me_endpoint():
    """Test the /me endpoint to get current user info."""
    global ACCESS_TOKEN

    print("Testing /me endpoint...")

    # Access the /me endpoint with the access token
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Failed to access /me endpoint: {response.text}"

    user_data = response.json()
    assert user_data["email"] == TEST_EMAIL, "Email in response doesn't match test user"
    assert user_data["id"] == TEST_USER_ID, "User ID in response doesn't match test user"

    print("Successfully accessed /me endpoint")
    return True


def test_refresh_token():
    """Test refreshing the access token using the refresh token."""
    global ACCESS_TOKEN, REFRESH_TOKEN

    print("Testing token refresh...")

    # Store the old access token for comparison
    old_access_token = ACCESS_TOKEN

    # Refresh the access token
    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": REFRESH_TOKEN},
    )

    assert response.status_code == 200, f"Token refresh failed: {response.text}"

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]
    REFRESH_TOKEN = token_data["refresh_token"]  # Refresh token might also be rotated

    assert ACCESS_TOKEN, "No access token returned"
    assert REFRESH_TOKEN, "No refresh token returned"
    assert ACCESS_TOKEN != old_access_token, "New access token is the same as the old one"

    print("Successfully refreshed access token")
    return True


def test_change_password():
    """Test changing the user's password."""
    global ACCESS_TOKEN, TEST_PASSWORD

    print("Testing password change...")

    new_password = f"{TEST_PASSWORD}_new"

    # Change the password
    response = requests.post(
        f"{BASE_URL}/auth/password-change",
        json={"current_password": TEST_PASSWORD, "new_password": new_password},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200, f"Password change failed: {response.text}"

    # Update the test password
    TEST_PASSWORD = new_password

    print("Successfully changed password")
    return True


def test_login_with_new_password():
    """Test login with the new password."""
    global ACCESS_TOKEN, REFRESH_TOKEN

    print("Testing login with new password...")

    # Login with the new password
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200, f"Login with new password failed: {response.text}"

    token_data = response.json()
    ACCESS_TOKEN = token_data["access_token"]
    REFRESH_TOKEN = token_data["refresh_token"]

    assert ACCESS_TOKEN, "No access token returned"
    assert REFRESH_TOKEN, "No refresh token returned"

    print("Successfully logged in with new password")
    return True


def cleanup():
    """Clean up by deleting the test user."""
    global TEST_USER_ID, ACCESS_TOKEN

    print("Cleaning up...")

    if TEST_USER_ID and ACCESS_TOKEN:
        # Delete the test user
        response = requests.delete(
            f"{BASE_URL}/users/{TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
        )

        assert response.status_code == 200, f"Failed to delete test user: {response.text}"
        print(f"Deleted test user with ID: {TEST_USER_ID}")
    else:
        print("No test user to delete or missing access token")


# Run the tests
if __name__ == "__main__":
    try:
        user_created = test_create_user()
        if user_created:
            test_login()
            test_me_endpoint()
            test_refresh_token()
            test_change_password()
            test_login_with_new_password()
    finally:
        cleanup()

import os
import json
import uuid
import requests
from datetime import date, timedelta

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Test user ID (this would normally be created through the auth endpoints)
TEST_USER_ID = str(uuid.uuid4())

# Sample health metrics data
SLEEP_METRICS = [
    {
        "date": (date.today() - timedelta(days=3)).isoformat(),
        "metric_type": "sleep",
        "value": {
            "duration_hours": 7.5,
            "deep_sleep_hours": 2.1,
            "rem_sleep_hours": 1.8,
            "light_sleep_hours": 3.6,
            "awake_hours": 0.5,
            "sleep_score": 85,
            "bedtime": "23:30",
            "wake_time": "07:00"
        },
        "source": "oura"
    },
    {
        "date": (date.today() - timedelta(days=2)).isoformat(),
        "metric_type": "sleep",
        "value": {
            "duration_hours": 6.8,
            "deep_sleep_hours": 1.9,
            "rem_sleep_hours": 1.5,
            "light_sleep_hours": 3.4,
            "awake_hours": 0.7,
            "sleep_score": 78,
            "bedtime": "00:15",
            "wake_time": "07:00"
        },
        "source": "oura"
    },
    {
        "date": (date.today() - timedelta(days=1)).isoformat(),
        "metric_type": "sleep",
        "value": {
            "duration_hours": 8.2,
            "deep_sleep_hours": 2.3,
            "rem_sleep_hours": 2.0,
            "light_sleep_hours": 3.9,
            "awake_hours": 0.3,
            "sleep_score": 92,
            "bedtime": "22:45",
            "wake_time": "07:00"
        },
        "source": "oura"
    }
]

ACTIVITY_METRICS = [
    {
        "date": (date.today() - timedelta(days=3)).isoformat(),
        "metric_type": "activity",
        "value": {
            "steps": 8500,
            "active_calories": 420,
            "total_calories": 2100,
            "active_minutes": 45,
            "activity_score": 82
        },
        "source": "healthkit"
    },
    {
        "date": (date.today() - timedelta(days=2)).isoformat(),
        "metric_type": "activity",
        "value": {
            "steps": 5200,
            "active_calories": 280,
            "total_calories": 1950,
            "active_minutes": 30,
            "activity_score": 68
        },
        "source": "healthkit"
    },
    {
        "date": (date.today() - timedelta(days=1)).isoformat(),
        "metric_type": "activity",
        "value": {
            "steps": 12000,
            "active_calories": 580,
            "total_calories": 2300,
            "active_minutes": 65,
            "activity_score": 95
        },
        "source": "healthkit"
    }
]

def create_test_user():
    """Create a test user for testing."""
    global TEST_USER_ID
    print(f"Creating test user with ID: {TEST_USER_ID}")
    
    # Create a user with a specific ID
    response = requests.post(
        f"{BASE_URL}/users",
        json={
            "email": f"test-{TEST_USER_ID}@example.com"
        }
    )
    
    if response.status_code == 200:
        user_data = response.json()
        TEST_USER_ID = user_data["id"]
        print(f"Created test user with ID: {TEST_USER_ID}")
        return True
    else:
        print(f"Failed to create test user: {response.text}")
        return False

def create_health_metrics():
    """Create sample health metrics for testing."""
    print("Creating sample health metrics...")
    
    # Create sleep metrics
    for metric in SLEEP_METRICS:
        response = requests.post(
            f"{BASE_URL}/health-metrics",
            json={
                **metric,
                "user_id": TEST_USER_ID
            }
        )
        if response.status_code == 200:
            print(f"Created sleep metric for {metric['date']}")
        else:
            print(f"Failed to create sleep metric: {response.text}")
    
    # Create activity metrics
    for metric in ACTIVITY_METRICS:
        response = requests.post(
            f"{BASE_URL}/health-metrics",
            json={
                **metric,
                "user_id": TEST_USER_ID
            }
        )
        if response.status_code == 200:
            print(f"Created activity metric for {metric['date']}")
        else:
            print(f"Failed to create activity metric: {response.text}")

def test_health_insight():
    """Test the health insight endpoint."""
    print("\nTesting health insight endpoint...")
    
    response = requests.post(
        f"{BASE_URL}/ai/insights/{TEST_USER_ID}",
        json={
            "query": "How has my sleep been over the past few days?",
            "metric_types": ["sleep"],
            "update_memory": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("Health Insight Response:")
        print(result["response"])
        print("\nMetadata:")
        print(json.dumps(result["metadata"], indent=2))
        return True
    else:
        print(f"Failed to get health insight: {response.text}")
        return False

def test_protocol_recommendation():
    """Test the protocol recommendation endpoint."""
    print("\nTesting protocol recommendation endpoint...")
    
    response = requests.post(
        f"{BASE_URL}/ai/protocols/{TEST_USER_ID}",
        json={
            "health_goal": "I want to improve my sleep quality and consistency",
            "current_metrics": ["sleep", "activity"]
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("Protocol Recommendation:")
        print(result["protocol_recommendation"])
        print("\nMetadata:")
        print(json.dumps(result["metadata"], indent=2))
        return True
    else:
        print(f"Failed to get protocol recommendation: {response.text}")
        return False

def test_trend_analysis():
    """Test the trend analysis endpoint."""
    print("\nTesting trend analysis endpoint...")
    
    response = requests.post(
        f"{BASE_URL}/ai/trends/{TEST_USER_ID}",
        json={
            "metric_type": "activity",
            "time_period": "last_week"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("Trend Analysis:")
        print(result["trend_analysis"])
        print("\nMetadata:")
        print(json.dumps(result["metadata"], indent=2))
        return True
    else:
        print(f"Failed to get trend analysis: {response.text}")
        return False

if __name__ == "__main__":
    # Create test user
    user_created = create_test_user()
    if not user_created:
        print("Failed to create test user. Exiting.")
        exit(1)
    
    # Create sample health metrics
    create_health_metrics()
    
    # Test AI endpoints
    insight_success = test_health_insight()
    protocol_success = test_protocol_recommendation()
    trend_success = test_trend_analysis()
    
    # Print summary
    print("\nTest Summary:")
    print(f"Health Insight: {'Success' if insight_success else 'Failed'}")
    print(f"Protocol Recommendation: {'Success' if protocol_success else 'Failed'}")
    print(f"Trend Analysis: {'Success' if trend_success else 'Failed'}")
    
    if insight_success and protocol_success and trend_success:
        print("\nAll tests passed! The Gemini AI integration is working correctly.")
    else:
        print("\nSome tests failed. Please check the logs for details.") 
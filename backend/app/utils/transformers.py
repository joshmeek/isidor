from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

# Mapping of source-specific field names to our standardized field names
SOURCE_FIELD_MAPPINGS = {
    "oura": {
        "sleep": {
            "duration": "duration_hours",
            "deep": "deep_sleep_hours",
            "rem": "rem_sleep_hours",
            "light": "light_sleep_hours",
            "awake": "awake_hours",
            "score": "sleep_score",
            "bedtime_start": "bedtime",
            "bedtime_end": "wake_time",
        },
        "activity": {
            "steps": "steps",
            "cal_active": "active_calories",
            "cal_total": "total_calories",
            "daily_movement": "active_minutes",
            "score": "activity_score",
        },
        "readiness": {"score": "readiness_score", "hrv_balance": "hrv_balance", "recovery_index": "recovery_index"},
    },
    "fitbit": {
        "sleep": {
            "minutesAsleep": "duration_hours",
            "deepSleepMinutes": "deep_sleep_hours",
            "remSleepMinutes": "rem_sleep_hours",
            "lightSleepMinutes": "light_sleep_hours",
            "awakeMinutes": "awake_hours",
            "efficiency": "sleep_score",
            "startTime": "bedtime",
            "endTime": "wake_time",
        },
        "activity": {
            "steps": "steps",
            "activeCalories": "active_calories",
            "caloriesBurned": "total_calories",
            "activeMinutes": "active_minutes",
            "floors": "floors_climbed",
            "distance": "distance_km",
        },
    },
    "apple_watch": {
        "sleep": {
            "sleepHours": "duration_hours",
            "deepSleepHours": "deep_sleep_hours",
            "remSleepHours": "rem_sleep_hours",
            "lightSleepHours": "light_sleep_hours",
            "awakeHours": "awake_hours",
            "sleepQuality": "sleep_score",
            "sleepStart": "bedtime",
            "sleepEnd": "wake_time",
        },
        "activity": {
            "steps": "steps",
            "activeEnergyBurned": "active_calories",
            "totalEnergyBurned": "total_calories",
            "exerciseMinutes": "active_minutes",
            "standHours": "stand_hours",
            "distance": "distance_km",
        },
        "heart_rate": {
            "avgHeartRate": "average_bpm",
            "restingHeartRate": "resting_bpm",
            "maxHeartRate": "max_bpm",
            "minHeartRate": "min_bpm",
            "heartRateVariability": "hrv_ms",
        },
    },
    "garmin": {
        "sleep": {
            "sleepTimeSeconds": "duration_hours",
            "deepSleepSeconds": "deep_sleep_hours",
            "remSleepSeconds": "rem_sleep_hours",
            "lightSleepSeconds": "light_sleep_hours",
            "awakeSleepSeconds": "awake_hours",
            "sleepQuality": "sleep_score",
            "sleepStartTimestampGMT": "bedtime",
            "sleepEndTimestampGMT": "wake_time",
        },
        "activity": {
            "steps": "steps",
            "activeKilocalories": "active_calories",
            "totalKilocalories": "total_calories",
            "activeTimeSeconds": "active_minutes",
            "floorsClimbed": "floors_climbed",
            "distanceInMeters": "distance_km",
        },
        "heart_rate": {
            "averageHeartRate": "average_bpm",
            "restingHeartRate": "resting_bpm",
            "maxHeartRate": "max_bpm",
            "minHeartRate": "min_bpm",
        },
    },
}


# Unit conversion functions
def minutes_to_hours(minutes: Union[int, float]) -> float:
    """Convert minutes to hours."""
    return round(float(minutes) / 60.0, 2)


def seconds_to_hours(seconds: Union[int, float]) -> float:
    """Convert seconds to hours."""
    return round(float(seconds) / 3600.0, 2)


def meters_to_km(meters: Union[int, float]) -> float:
    """Convert meters to kilometers."""
    return round(float(meters) / 1000.0, 2)


def miles_to_km(miles: Union[int, float]) -> float:
    """Convert miles to kilometers."""
    return round(float(miles) * 1.60934, 2)


# Time format conversion functions
def parse_timestamp(timestamp: Union[int, str]) -> str:
    """Convert timestamp to ISO format string."""
    if isinstance(timestamp, int):
        # Assuming milliseconds timestamp
        dt = datetime.fromtimestamp(timestamp / 1000.0)
        return dt.isoformat()
    return timestamp


def parse_time(time_str: str, source: str) -> str:
    """Parse time string based on source format."""
    formats = {
        "oura": "%Y-%m-%dT%H:%M:%S%z",
        "fitbit": "%Y-%m-%dT%H:%M:%S.%f",
        "apple_watch": "%Y-%m-%d %H:%M:%S",
        "garmin": "%Y-%m-%dT%H:%M:%S.%fZ",
    }

    try:
        if source in formats:
            dt = datetime.strptime(time_str, formats[source])
            return dt.isoformat()
        return time_str
    except ValueError:
        # If parsing fails, return the original string
        return time_str


# Transformation functions for specific metric types
def transform_sleep_data(data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Transform sleep data from a specific source to standardized format."""
    result = {}

    # Get field mapping for this source and metric type
    if source in SOURCE_FIELD_MAPPINGS and "sleep" in SOURCE_FIELD_MAPPINGS[source]:
        mapping = SOURCE_FIELD_MAPPINGS[source]["sleep"]

        for source_field, target_field in mapping.items():
            if source_field in data:
                value = data[source_field]

                # Apply transformations based on field and source
                if (
                    source_field in ["minutesAsleep", "deepSleepMinutes", "remSleepMinutes", "lightSleepMinutes", "awakeMinutes"]
                    and source == "fitbit"
                ):
                    value = minutes_to_hours(value)
                elif (
                    source_field in ["sleepTimeSeconds", "deepSleepSeconds", "remSleepSeconds", "lightSleepSeconds", "awakeSleepSeconds"]
                    and source == "garmin"
                ):
                    value = seconds_to_hours(value)
                elif source_field in ["sleepStartTimestampGMT", "sleepEndTimestampGMT"] and source == "garmin":
                    value = parse_timestamp(value)
                elif source_field in ["startTime", "endTime"] and source == "fitbit":
                    value = parse_time(value, source)
                elif source_field in ["bedtime_start", "bedtime_end"] and source == "oura":
                    value = parse_time(value, source)

                result[target_field] = value

    return result


def transform_activity_data(data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Transform activity data from a specific source to standardized format."""
    result = {}

    # Get field mapping for this source and metric type
    if source in SOURCE_FIELD_MAPPINGS and "activity" in SOURCE_FIELD_MAPPINGS[source]:
        mapping = SOURCE_FIELD_MAPPINGS[source]["activity"]

        for source_field, target_field in mapping.items():
            if source_field in data:
                value = data[source_field]

                # Apply transformations based on field and source
                if source_field == "activeTimeSeconds" and source == "garmin":
                    value = seconds_to_hours(value) * 60  # Convert to minutes
                elif source_field == "distanceInMeters" and source == "garmin":
                    value = meters_to_km(value)
                elif source_field == "distance" and source == "fitbit":
                    # Fitbit distance is in miles
                    value = miles_to_km(value)

                result[target_field] = value

    return result


def transform_heart_rate_data(data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Transform heart rate data from a specific source to standardized format."""
    result = {}

    # Get field mapping for this source and metric type
    if source in SOURCE_FIELD_MAPPINGS and "heart_rate" in SOURCE_FIELD_MAPPINGS[source]:
        mapping = SOURCE_FIELD_MAPPINGS[source]["heart_rate"]

        for source_field, target_field in mapping.items():
            if source_field in data:
                value = data[source_field]
                result[target_field] = value

    return result


def transform_health_data(data: Dict[str, Any], metric_type: str, source: str) -> Dict[str, Any]:
    """
    Transform health data from a specific source to our standardized format.

    Args:
        data: The source-specific health data
        metric_type: The type of health metric
        source: The data source

    Returns:
        Standardized health data
    """
    if metric_type == "sleep":
        return transform_sleep_data(data, source)
    elif metric_type == "activity":
        return transform_activity_data(data, source)
    elif metric_type == "heart_rate":
        return transform_heart_rate_data(data, source)

    # For other metric types, return the original data
    return data

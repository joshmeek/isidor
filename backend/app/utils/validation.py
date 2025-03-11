from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from app.schemas.health_metric import MetricType

# Define valid metric types and their required fields
VALID_METRIC_TYPES = {
    "sleep": {
        "required_fields": ["duration_hours"],
        "optional_fields": [
            "deep_sleep_hours",
            "rem_sleep_hours",
            "light_sleep_hours",
            "awake_hours",
            "sleep_score",
            "bedtime",
            "wake_time",
        ],
        "field_types": {
            "duration_hours": float,
            "deep_sleep_hours": float,
            "rem_sleep_hours": float,
            "light_sleep_hours": float,
            "awake_hours": float,
            "sleep_score": int,
            "bedtime": str,
            "wake_time": str,
        },
        "field_ranges": {
            "duration_hours": (0, 24),
            "deep_sleep_hours": (0, 10),
            "rem_sleep_hours": (0, 10),
            "light_sleep_hours": (0, 20),
            "awake_hours": (0, 10),
            "sleep_score": (0, 100),
        },
    },
    "activity": {
        "required_fields": ["steps"],
        "optional_fields": ["active_calories", "total_calories", "active_minutes", "activity_score", "distance_km", "floors_climbed"],
        "field_types": {
            "steps": int,
            "active_calories": int,
            "total_calories": int,
            "active_minutes": int,
            "activity_score": int,
            "distance_km": float,
            "floors_climbed": int,
        },
        "field_ranges": {
            "steps": (0, 100000),
            "active_calories": (0, 10000),
            "total_calories": (0, 20000),
            "active_minutes": (0, 1440),
            "activity_score": (0, 100),
            "distance_km": (0, 200),
            "floors_climbed": (0, 1000),
        },
    },
    "heart_rate": {
        "required_fields": ["average_bpm"],
        "optional_fields": ["resting_bpm", "max_bpm", "min_bpm", "hrv_ms"],
        "field_types": {"average_bpm": int, "resting_bpm": int, "max_bpm": int, "min_bpm": int, "hrv_ms": float},
        "field_ranges": {
            "average_bpm": (30, 220),
            "resting_bpm": (30, 120),
            "max_bpm": (60, 220),
            "min_bpm": (30, 100),
            "hrv_ms": (0, 200),
        },
    },
    "blood_pressure": {
        "required_fields": ["systolic", "diastolic"],
        "optional_fields": ["pulse"],
        "field_types": {"systolic": int, "diastolic": int, "pulse": int},
        "field_ranges": {"systolic": (70, 220), "diastolic": (40, 130), "pulse": (30, 220)},
    },
    "weight": {
        "required_fields": ["value"],
        "optional_fields": ["body_fat_percentage", "muscle_mass", "bmi", "lean_mass", "water_percentage", "bone_mass"],
        "field_types": {
            "value": float,
            "body_fat_percentage": float,
            "muscle_mass": float,
            "bmi": float,
            "lean_mass": float,
            "water_percentage": float,
            "bone_mass": float,
        },
        "field_ranges": {
            "value": (20, 500),
            "body_fat_percentage": (1, 60),
            "muscle_mass": (10, 200),
            "bmi": (10, 60),
            "lean_mass": (10, 200),
            "water_percentage": (1, 80),
            "bone_mass": (0.5, 10),
        },
    },
    "mood": {
        "required_fields": ["rating"],
        "optional_fields": ["notes", "energy_level", "stress_level"],
        "field_types": {"rating": int, "energy_level": int, "stress_level": int, "notes": str},
        "field_ranges": {"rating": (1, 10), "energy_level": (1, 10), "stress_level": (1, 10)},
    },
    "calories": {
        "required_fields": ["total"],
        "optional_fields": ["protein", "fat", "carbs", "meal_type", "meal_name", "notes"],
        "field_types": {"total": int, "protein": float, "fat": float, "carbs": float, "meal_type": str, "meal_name": str, "notes": str},
        "field_ranges": {"total": (0, 5000), "protein": (0, 500), "fat": (0, 500), "carbs": (0, 500)},
    },
    "event": {
        "required_fields": ["event_type"],
        "optional_fields": ["notes", "duration_minutes", "intensity"],
        "field_types": {"event_type": str, "notes": str, "duration_minutes": int, "intensity": int},
        "field_ranges": {"duration_minutes": (0, 1440), "intensity": (1, 10)},
    },
}

# Define valid data sources
VALID_SOURCES = ["manual", "healthkit", "oura", "fitbit", "garmin", "apple_watch", "whoop", "withings"]


def validate_metric_type(metric_type: str) -> Tuple[bool, Optional[str]]:
    """
    Validate if the metric type is supported.

    Args:
        metric_type: The metric type to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Try to convert the string to an enum value
        MetricType(metric_type)
        return True, None
    except ValueError:
        valid_types = ", ".join([t.value for t in MetricType])
        return False, f"Invalid metric type. Valid types are: {valid_types}"


def validate_source(source: str) -> Tuple[bool, Optional[str]]:
    """
    Validate if the data source is supported.

    Args:
        source: The data source to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if source not in VALID_SOURCES:
        valid_sources = ", ".join(VALID_SOURCES)
        return False, f"Invalid source. Valid sources are: {valid_sources}"
    return True, None


def validate_date(date_str: str) -> Tuple[bool, Optional[str], Optional[date]]:
    """
    Validate if the date is in the correct format (YYYY-MM-DD).

    Args:
        date_str: The date string to validate

    Returns:
        Tuple of (is_valid, error_message, parsed_date)
    """
    try:
        parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        return True, None, parsed_date
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD.", None


def validate_field_type(field: str, value: Any, expected_type: type) -> Tuple[bool, Optional[str], Any]:
    """
    Validate if the field value has the correct type.

    Args:
        field: The field name
        value: The field value
        expected_type: The expected type

    Returns:
        Tuple of (is_valid, error_message, sanitized_value)
    """
    # Handle special case for strings
    if expected_type == str:
        if not isinstance(value, str):
            try:
                value = str(value)
                return True, None, value
            except:
                return False, f"Field '{field}' must be a string.", None
        return True, None, value

    # Handle numeric types
    if expected_type in (int, float):
        try:
            if expected_type == int:
                sanitized_value = int(float(value))
            else:
                sanitized_value = float(value)
            return True, None, sanitized_value
        except (ValueError, TypeError):
            return False, f"Field '{field}' must be a {expected_type.__name__}.", None

    # Handle other types
    if not isinstance(value, expected_type):
        return False, f"Field '{field}' must be a {expected_type.__name__}.", None

    return True, None, value


def validate_field_range(
    field: str, value: Union[int, float], min_value: Union[int, float], max_value: Union[int, float]
) -> Tuple[bool, Optional[str]]:
    """
    Validate if the field value is within the specified range.

    Args:
        field: The field name
        value: The field value
        min_value: The minimum allowed value
        max_value: The maximum allowed value

    Returns:
        Tuple of (is_valid, error_message)
    """
    if value < min_value or value > max_value:
        return False, f"Field '{field}' must be between {min_value} and {max_value}."
    return True, None


def validate_health_metric(metric_type: str, value: Dict[str, Any], source: str) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validate and sanitize a health metric.

    Args:
        metric_type: The type of health metric
        value: The metric value
        source: The data source

    Returns:
        Tuple of (is_valid, error_messages, sanitized_value)
    """
    errors = []
    sanitized_value = {}

    # Validate metric type
    is_valid, error = validate_metric_type(metric_type)
    if not is_valid:
        errors.append(error)
        return False, errors, {}

    # Validate source
    is_valid, error = validate_source(source)
    if not is_valid:
        errors.append(error)
        return False, errors, {}

    # Get metric type definition
    metric_def = VALID_METRIC_TYPES[metric_type]

    # Check required fields
    for field in metric_def["required_fields"]:
        if field not in value:
            errors.append(f"Required field '{field}' is missing.")

    # Validate and sanitize fields
    for field, field_value in value.items():
        # Check if field is valid for this metric type
        if field not in metric_def["required_fields"] and field not in metric_def["optional_fields"]:
            errors.append(f"Field '{field}' is not valid for metric type '{metric_type}'.")
            continue

        # Validate field type
        expected_type = metric_def["field_types"].get(field)
        if expected_type:
            is_valid, error, sanitized_field_value = validate_field_type(field, field_value, expected_type)
            if not is_valid:
                errors.append(error)
                continue
            sanitized_value[field] = sanitized_field_value
        else:
            # If no type validation is defined, keep the original value
            sanitized_value[field] = field_value

        # Validate field range if applicable
        if isinstance(sanitized_value[field], (int, float)) and field in metric_def.get("field_ranges", {}):
            min_value, max_value = metric_def["field_ranges"][field]
            is_valid, error = validate_field_range(field, sanitized_value[field], min_value, max_value)
            if not is_valid:
                errors.append(error)

    # Return validation result
    if errors:
        return False, errors, {}
    return True, [], sanitized_value

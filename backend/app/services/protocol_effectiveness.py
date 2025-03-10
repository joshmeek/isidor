from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from app.models.user_protocol import UserProtocol
from app.services.health_metrics import get_health_metrics_by_user
from app.services.user_protocol import get_user_protocol
from sqlalchemy.orm import Session


def calculate_protocol_effectiveness(db: Session, user_protocol_id: UUID, evaluation_period_days: int = 7) -> Dict[str, Any]:
    """
    Calculate the effectiveness of a protocol based on changes in target metrics.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol to evaluate
        evaluation_period_days: Number of days to use for evaluation (default: 7)

    Returns:
        Dictionary with effectiveness metrics
    """
    # Get user protocol
    user_protocol = get_user_protocol(db, user_protocol_id)
    if not user_protocol:
        return {"error": "User protocol not found"}

    # Get protocol details
    protocol = user_protocol.protocol
    target_metrics = protocol.target_metrics

    # Get start and end dates for evaluation
    start_date = user_protocol.start_date
    today = date.today()

    # If protocol is completed, use its end date
    end_date = user_protocol.end_date if user_protocol.end_date else today

    # Calculate baseline period (before protocol start)
    baseline_start = start_date - timedelta(days=evaluation_period_days)
    baseline_end = start_date - timedelta(days=1)

    # Calculate recent period (last N days of protocol)
    recent_start = end_date - timedelta(days=evaluation_period_days)
    recent_end = end_date

    # Ensure recent_start is not before protocol start
    if recent_start < start_date:
        recent_start = start_date

    # Get metrics for baseline and recent periods
    baseline_metrics = {}
    recent_metrics = {}

    for metric_type in target_metrics:
        # Get baseline metrics
        baseline_data = get_health_metrics_by_user(
            db=db, user_id=user_protocol.user_id, metric_type=metric_type, start_date=baseline_start, end_date=baseline_end
        )

        # Get recent metrics
        recent_data = get_health_metrics_by_user(
            db=db, user_id=user_protocol.user_id, metric_type=metric_type, start_date=recent_start, end_date=recent_end
        )

        baseline_metrics[metric_type] = baseline_data
        recent_metrics[metric_type] = recent_data

    # Calculate effectiveness for each metric type
    effectiveness = {
        "user_protocol_id": user_protocol_id,
        "protocol_id": protocol.id,
        "protocol_name": protocol.name,
        "evaluation_period_days": evaluation_period_days,
        "baseline_period": {"start": baseline_start, "end": baseline_end},
        "recent_period": {"start": recent_start, "end": recent_end},
        "metrics": {},
    }

    for metric_type in target_metrics:
        metric_effectiveness = calculate_metric_effectiveness(
            metric_type=metric_type, baseline_data=baseline_metrics[metric_type], recent_data=recent_metrics[metric_type]
        )

        effectiveness["metrics"][metric_type] = metric_effectiveness

    # Calculate overall effectiveness score (0-100)
    effectiveness_scores = [
        score for metric in effectiveness["metrics"].values() for score in [metric.get("effectiveness_score")] if score is not None
    ]

    if effectiveness_scores:
        effectiveness["overall_score"] = sum(effectiveness_scores) / len(effectiveness_scores)
    else:
        effectiveness["overall_score"] = None

    return effectiveness


def calculate_metric_effectiveness(metric_type: str, baseline_data: List[Any], recent_data: List[Any]) -> Dict[str, Any]:
    """
    Calculate effectiveness for a specific metric type.

    Args:
        metric_type: Type of health metric
        baseline_data: List of baseline metrics
        recent_data: List of recent metrics

    Returns:
        Dictionary with effectiveness metrics for this metric type
    """
    result = {"baseline_count": len(baseline_data), "recent_count": len(recent_data), "change_detected": False, "effectiveness_score": None}

    # If not enough data, return early
    if len(baseline_data) == 0 or len(recent_data) == 0:
        return result

    # Calculate metrics based on metric type
    if metric_type == "sleep":
        return calculate_sleep_effectiveness(baseline_data, recent_data, result)
    elif metric_type == "activity":
        return calculate_activity_effectiveness(baseline_data, recent_data, result)
    elif metric_type == "heart_rate":
        return calculate_heart_rate_effectiveness(baseline_data, recent_data, result)
    elif metric_type == "weight":
        return calculate_weight_effectiveness(baseline_data, recent_data, result)
    elif metric_type == "mood":
        return calculate_mood_effectiveness(baseline_data, recent_data, result)

    return result


def calculate_sleep_effectiveness(baseline_data, recent_data, result):
    """Calculate sleep effectiveness metrics."""
    # Extract duration values
    baseline_durations = [m.value.get("duration_hours", 0) for m in baseline_data if "duration_hours" in m.value]
    recent_durations = [m.value.get("duration_hours", 0) for m in recent_data if "duration_hours" in m.value]

    # Extract sleep score values if available
    baseline_scores = [m.value.get("sleep_score", 0) for m in baseline_data if "sleep_score" in m.value]
    recent_scores = [m.value.get("sleep_score", 0) for m in recent_data if "sleep_score" in m.value]

    # Calculate average duration
    if baseline_durations and recent_durations:
        avg_baseline_duration = sum(baseline_durations) / len(baseline_durations)
        avg_recent_duration = sum(recent_durations) / len(recent_durations)

        duration_change = avg_recent_duration - avg_baseline_duration
        duration_change_pct = (duration_change / avg_baseline_duration) * 100 if avg_baseline_duration > 0 else 0

        result["duration"] = {
            "baseline_avg": avg_baseline_duration,
            "recent_avg": avg_recent_duration,
            "change": duration_change,
            "change_pct": duration_change_pct,
        }

        # Determine if change is positive (closer to ideal sleep duration of 7-9 hours)
        ideal_sleep_min = 7.0
        ideal_sleep_max = 9.0

        baseline_distance_from_ideal = (
            min(abs(avg_baseline_duration - ideal_sleep_min), abs(avg_baseline_duration - ideal_sleep_max))
            if avg_baseline_duration < ideal_sleep_min or avg_baseline_duration > ideal_sleep_max
            else 0
        )

        recent_distance_from_ideal = (
            min(abs(avg_recent_duration - ideal_sleep_min), abs(avg_recent_duration - ideal_sleep_max))
            if avg_recent_duration < ideal_sleep_min or avg_recent_duration > ideal_sleep_max
            else 0
        )

        improvement = baseline_distance_from_ideal - recent_distance_from_ideal
        result["duration"]["improvement"] = improvement

        # Calculate effectiveness score for duration (0-100)
        if baseline_distance_from_ideal > 0:
            duration_score = min(100, max(0, 50 + (improvement / baseline_distance_from_ideal) * 50))
        else:
            # If baseline was already ideal
            duration_score = 75 if recent_distance_from_ideal == 0 else max(0, 75 - recent_distance_from_ideal * 10)

        result["duration"]["score"] = duration_score
        result["change_detected"] = True

    # Calculate average sleep score
    if baseline_scores and recent_scores:
        avg_baseline_score = sum(baseline_scores) / len(baseline_scores)
        avg_recent_score = sum(recent_scores) / len(recent_scores)

        score_change = avg_recent_score - avg_baseline_score
        score_change_pct = (score_change / avg_baseline_score) * 100 if avg_baseline_score > 0 else 0

        result["sleep_score"] = {
            "baseline_avg": avg_baseline_score,
            "recent_avg": avg_recent_score,
            "change": score_change,
            "change_pct": score_change_pct,
        }

        # Calculate effectiveness score for sleep score (0-100)
        score_score = min(100, max(0, 50 + score_change_pct / 2))
        result["sleep_score"]["score"] = score_score
        result["change_detected"] = True

    # Calculate overall effectiveness score
    scores = []
    if "duration" in result and "score" in result["duration"]:
        scores.append(result["duration"]["score"])
    if "sleep_score" in result and "score" in result["sleep_score"]:
        scores.append(result["sleep_score"]["score"])

    if scores:
        result["effectiveness_score"] = sum(scores) / len(scores)

    return result


def calculate_activity_effectiveness(baseline_data, recent_data, result):
    """Calculate activity effectiveness metrics."""
    # Extract steps values
    baseline_steps = [m.value.get("steps", 0) for m in baseline_data if "steps" in m.value]
    recent_steps = [m.value.get("steps", 0) for m in recent_data if "steps" in m.value]

    # Calculate average steps
    if baseline_steps and recent_steps:
        avg_baseline_steps = sum(baseline_steps) / len(baseline_steps)
        avg_recent_steps = sum(recent_steps) / len(recent_steps)

        steps_change = avg_recent_steps - avg_baseline_steps
        steps_change_pct = (steps_change / avg_baseline_steps) * 100 if avg_baseline_steps > 0 else 0

        result["steps"] = {
            "baseline_avg": avg_baseline_steps,
            "recent_avg": avg_recent_steps,
            "change": steps_change,
            "change_pct": steps_change_pct,
        }

        # Determine if change is positive (closer to ideal steps of 10,000)
        ideal_steps = 10000

        baseline_distance_from_ideal = abs(avg_baseline_steps - ideal_steps)
        recent_distance_from_ideal = abs(avg_recent_steps - ideal_steps)

        improvement = baseline_distance_from_ideal - recent_distance_from_ideal
        result["steps"]["improvement"] = improvement

        # Calculate effectiveness score for steps (0-100)
        if baseline_distance_from_ideal > 0:
            steps_score = min(100, max(0, 50 + (improvement / baseline_distance_from_ideal) * 50))
        else:
            # If baseline was already ideal
            steps_score = 75 if recent_distance_from_ideal == 0 else max(0, 75 - (recent_distance_from_ideal / 1000) * 5)

        result["steps"]["score"] = steps_score
        result["change_detected"] = True
        result["effectiveness_score"] = steps_score

    return result


def calculate_heart_rate_effectiveness(baseline_data, recent_data, result):
    """Calculate heart rate effectiveness metrics."""
    # Extract resting heart rate values
    baseline_hr = [m.value.get("resting_bpm", 0) for m in baseline_data if "resting_bpm" in m.value]
    recent_hr = [m.value.get("resting_bpm", 0) for m in recent_data if "resting_bpm" in m.value]

    # Calculate average resting heart rate
    if baseline_hr and recent_hr:
        avg_baseline_hr = sum(baseline_hr) / len(baseline_hr)
        avg_recent_hr = sum(recent_hr) / len(recent_hr)

        hr_change = avg_recent_hr - avg_baseline_hr
        hr_change_pct = (hr_change / avg_baseline_hr) * 100 if avg_baseline_hr > 0 else 0

        result["resting_heart_rate"] = {
            "baseline_avg": avg_baseline_hr,
            "recent_avg": avg_recent_hr,
            "change": hr_change,
            "change_pct": hr_change_pct,
        }

        # Lower resting heart rate is generally better (within healthy limits)
        # Ideal range is 60-70 bpm
        ideal_hr_min = 60
        ideal_hr_max = 70

        baseline_distance_from_ideal = (
            min(abs(avg_baseline_hr - ideal_hr_min), abs(avg_baseline_hr - ideal_hr_max))
            if avg_baseline_hr < ideal_hr_min or avg_baseline_hr > ideal_hr_max
            else 0
        )

        recent_distance_from_ideal = (
            min(abs(avg_recent_hr - ideal_hr_min), abs(avg_recent_hr - ideal_hr_max))
            if avg_recent_hr < ideal_hr_min or avg_recent_hr > ideal_hr_max
            else 0
        )

        improvement = baseline_distance_from_ideal - recent_distance_from_ideal
        result["resting_heart_rate"]["improvement"] = improvement

        # Calculate effectiveness score for heart rate (0-100)
        if baseline_distance_from_ideal > 0:
            hr_score = min(100, max(0, 50 + (improvement / baseline_distance_from_ideal) * 50))
        else:
            # If baseline was already ideal
            hr_score = 75 if recent_distance_from_ideal == 0 else max(0, 75 - recent_distance_from_ideal)

        result["resting_heart_rate"]["score"] = hr_score
        result["change_detected"] = True
        result["effectiveness_score"] = hr_score

    return result


def calculate_weight_effectiveness(baseline_data, recent_data, result):
    """Calculate weight effectiveness metrics."""
    # Extract weight values
    baseline_weights = [m.value.get("value", 0) for m in baseline_data if "value" in m.value]
    recent_weights = [m.value.get("value", 0) for m in recent_data if "value" in m.value]

    # Calculate average weight
    if baseline_weights and recent_weights:
        avg_baseline_weight = sum(baseline_weights) / len(baseline_weights)
        avg_recent_weight = sum(recent_weights) / len(recent_weights)

        weight_change = avg_recent_weight - avg_baseline_weight
        weight_change_pct = (weight_change / avg_baseline_weight) * 100 if avg_baseline_weight > 0 else 0

        result["weight"] = {
            "baseline_avg": avg_baseline_weight,
            "recent_avg": avg_recent_weight,
            "change": weight_change,
            "change_pct": weight_change_pct,
        }

        # For weight, we need to know the target direction (lose, maintain, gain)
        # For now, assume maintain is the goal and any change is neutral
        # In a real app, this would be personalized based on user goals

        # Calculate effectiveness score for weight (0-100)
        # For now, smaller changes are better (assuming maintenance)
        weight_score = min(100, max(0, 100 - abs(weight_change_pct) * 5))

        result["weight"]["score"] = weight_score
        result["change_detected"] = True
        result["effectiveness_score"] = weight_score

    return result


def calculate_mood_effectiveness(baseline_data, recent_data, result):
    """Calculate mood effectiveness metrics."""
    # Extract mood rating values
    baseline_moods = [m.value.get("rating", 0) for m in baseline_data if "rating" in m.value]
    recent_moods = [m.value.get("rating", 0) for m in recent_data if "rating" in m.value]

    # Calculate average mood
    if baseline_moods and recent_moods:
        avg_baseline_mood = sum(baseline_moods) / len(baseline_moods)
        avg_recent_mood = sum(recent_moods) / len(recent_moods)

        mood_change = avg_recent_mood - avg_baseline_mood
        mood_change_pct = (mood_change / avg_baseline_mood) * 100 if avg_baseline_mood > 0 else 0

        result["mood"] = {
            "baseline_avg": avg_baseline_mood,
            "recent_avg": avg_recent_mood,
            "change": mood_change,
            "change_pct": mood_change_pct,
        }

        # For mood, higher is better (assuming 1-10 scale)
        # Calculate effectiveness score for mood (0-100)
        if mood_change > 0:
            # Improvement
            mood_score = min(100, 50 + mood_change_pct)
        else:
            # Decline
            mood_score = max(0, 50 + mood_change_pct)

        result["mood"]["score"] = mood_score
        result["change_detected"] = True
        result["effectiveness_score"] = mood_score

    return result


def generate_protocol_recommendations(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Generate recommendations for protocol adjustments based on effectiveness.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with recommendations
    """
    # Calculate protocol effectiveness
    effectiveness = calculate_protocol_effectiveness(db, user_protocol_id)

    # If there was an error or not enough data, return early
    if "error" in effectiveness or not effectiveness.get("metrics"):
        return {
            "user_protocol_id": user_protocol_id,
            "has_recommendations": False,
            "reason": "Not enough data to generate recommendations",
            "effectiveness": effectiveness,
        }

    # Get user protocol
    user_protocol = get_user_protocol(db, user_protocol_id)
    if not user_protocol:
        return {"error": "User protocol not found"}

    # Get protocol details
    protocol = user_protocol.protocol
    target_metrics = protocol.target_metrics

    # Generate recommendations based on effectiveness
    recommendations = {
        "user_protocol_id": user_protocol_id,
        "protocol_id": protocol.id,
        "protocol_name": protocol.name,
        "has_recommendations": False,
        "overall_effectiveness_score": effectiveness.get("overall_score"),
        "recommendations": [],
    }

    # Generate metric-specific recommendations
    for metric_type, metric_data in effectiveness.get("metrics", {}).items():
        if not metric_data.get("change_detected", False):
            continue

        metric_recommendations = generate_metric_recommendations(metric_type, metric_data)
        if metric_recommendations:
            recommendations["recommendations"].extend(metric_recommendations)
            recommendations["has_recommendations"] = True

    # Add general recommendations based on overall effectiveness
    overall_score = effectiveness.get("overall_score")
    if overall_score is not None:
        if overall_score < 30:
            recommendations["recommendations"].append(
                {
                    "type": "general",
                    "priority": "high",
                    "recommendation": "Consider modifying or changing the protocol as it appears to be ineffective.",
                    "explanation": "The current protocol is showing minimal positive impact on your health metrics.",
                }
            )
        elif overall_score < 50:
            recommendations["recommendations"].append(
                {
                    "type": "general",
                    "priority": "medium",
                    "recommendation": "Some adjustments to the protocol may be beneficial.",
                    "explanation": "The protocol is showing some positive effects but could be optimized further.",
                }
            )
        elif overall_score >= 80:
            recommendations["recommendations"].append(
                {
                    "type": "general",
                    "priority": "low",
                    "recommendation": "Continue with the current protocol as it appears to be effective.",
                    "explanation": "The protocol is showing strong positive effects on your health metrics.",
                }
            )

    return recommendations


def generate_metric_recommendations(metric_type: str, metric_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate recommendations for a specific metric type.

    Args:
        metric_type: Type of health metric
        metric_data: Effectiveness data for this metric

    Returns:
        List of recommendation dictionaries
    """
    recommendations = []

    if metric_type == "sleep":
        if "duration" in metric_data:
            duration_data = metric_data["duration"]
            recent_avg = duration_data.get("recent_avg", 0)

            if recent_avg < 7:
                recommendations.append(
                    {
                        "type": "sleep",
                        "priority": "high" if recent_avg < 6 else "medium",
                        "recommendation": "Increase sleep duration",
                        "explanation": f"Your average sleep duration ({recent_avg:.1f} hours) is below the recommended 7-9 hours.",
                        "actions": [
                            "Set a consistent bedtime and wake-up time",
                            "Reduce screen time 1 hour before bed",
                            "Create a relaxing bedtime routine",
                        ],
                    }
                )
            elif recent_avg > 9:
                recommendations.append(
                    {
                        "type": "sleep",
                        "priority": "medium",
                        "recommendation": "Optimize sleep duration",
                        "explanation": f"Your average sleep duration ({recent_avg:.1f} hours) is above the recommended 7-9 hours, which may indicate other issues.",
                        "actions": [
                            "Ensure consistent wake-up times",
                            "Increase daytime physical activity",
                            "Consider consulting a healthcare provider if excessive sleepiness persists",
                        ],
                    }
                )

    elif metric_type == "activity":
        if "steps" in metric_data:
            steps_data = metric_data["steps"]
            recent_avg = steps_data.get("recent_avg", 0)

            if recent_avg < 7500:
                recommendations.append(
                    {
                        "type": "activity",
                        "priority": "high" if recent_avg < 5000 else "medium",
                        "recommendation": "Increase daily activity",
                        "explanation": f"Your average daily steps ({int(recent_avg)}) are below the recommended 10,000 steps.",
                        "actions": [
                            "Take short walking breaks throughout the day",
                            "Use stairs instead of elevators when possible",
                            "Schedule dedicated walking time each day",
                        ],
                    }
                )

    elif metric_type == "heart_rate":
        if "resting_heart_rate" in metric_data:
            hr_data = metric_data["resting_heart_rate"]
            recent_avg = hr_data.get("recent_avg", 0)

            if recent_avg > 80:
                recommendations.append(
                    {
                        "type": "heart_rate",
                        "priority": "medium",
                        "recommendation": "Work on lowering resting heart rate",
                        "explanation": f"Your average resting heart rate ({int(recent_avg)} bpm) is higher than optimal.",
                        "actions": [
                            "Increase cardiovascular exercise",
                            "Practice relaxation techniques like deep breathing",
                            "Ensure adequate hydration",
                            "Consider reducing caffeine intake",
                        ],
                    }
                )

    return recommendations


async def analyze_protocol_effectiveness_with_ai(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Analyze protocol effectiveness using AI.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with AI analysis of protocol effectiveness
    """
    from app.services.ai import analyze_protocol_effectiveness

    # Get user protocol
    user_protocol = get_user_protocol(db, user_protocol_id)
    if not user_protocol:
        return {"error": "User protocol not found"}

    # Calculate protocol effectiveness using rule-based approach
    effectiveness_data = calculate_protocol_effectiveness(db, user_protocol_id)

    # If there was an error or not enough data, return early
    if "error" in effectiveness_data or not effectiveness_data.get("metrics"):
        return {
            "user_protocol_id": user_protocol_id,
            "has_analysis": False,
            "reason": "Not enough data to analyze effectiveness",
            "effectiveness_data": effectiveness_data,
        }

    # Use AI to analyze the effectiveness
    ai_analysis = await analyze_protocol_effectiveness(
        db=db,
        user_id=user_protocol.user_id,
        protocol_id=user_protocol.protocol_id,
        user_protocol_id=user_protocol_id,
        effectiveness_data=effectiveness_data,
    )

    # Combine the rule-based effectiveness data with the AI analysis
    result = {
        "user_protocol_id": user_protocol_id,
        "protocol_id": user_protocol.protocol_id,
        "protocol_name": effectiveness_data.get("protocol_name"),
        "has_analysis": True,
        "effectiveness_data": effectiveness_data,
        "ai_analysis": ai_analysis.get("effectiveness_analysis"),
        "metadata": ai_analysis.get("metadata", {}),
    }

    return result


async def generate_protocol_adjustments_with_ai(db: Session, user_protocol_id: UUID) -> Dict[str, Any]:
    """
    Generate protocol adjustment recommendations using AI.

    Args:
        db: Database session
        user_protocol_id: ID of the user protocol

    Returns:
        Dictionary with AI-generated protocol adjustments
    """
    from app.services.ai import generate_protocol_adjustments

    # Get user protocol
    user_protocol = get_user_protocol(db, user_protocol_id)
    if not user_protocol:
        return {"error": "User protocol not found"}

    # Calculate protocol effectiveness
    effectiveness_data = calculate_protocol_effectiveness(db, user_protocol_id)

    # Generate rule-based recommendations
    recommendations_data = generate_protocol_recommendations(db, user_protocol_id)

    # If there was an error or not enough data, return early
    if not recommendations_data.get("has_recommendations", False):
        return {
            "user_protocol_id": user_protocol_id,
            "has_adjustments": False,
            "reason": recommendations_data.get("reason", "Not enough data to generate adjustments"),
            "recommendations_data": recommendations_data,
        }

    # Use AI to generate protocol adjustments
    ai_adjustments = await generate_protocol_adjustments(
        db=db,
        user_id=user_protocol.user_id,
        protocol_id=user_protocol.protocol_id,
        user_protocol_id=user_protocol_id,
        effectiveness_data=effectiveness_data,
        recommendations_data=recommendations_data,
    )

    # Combine the rule-based recommendations with the AI adjustments
    result = {
        "user_protocol_id": user_protocol_id,
        "protocol_id": user_protocol.protocol_id,
        "protocol_name": recommendations_data.get("protocol_name"),
        "has_adjustments": True,
        "effectiveness_data": effectiveness_data,
        "recommendations_data": recommendations_data,
        "ai_adjustments": ai_adjustments.get("protocol_adjustments"),
        "metadata": ai_adjustments.get("metadata", {}),
    }

    return result

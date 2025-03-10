from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.protocol import Protocol
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate
from sqlalchemy.orm import Session


def get_protocol(db: Session, protocol_id: UUID) -> Optional[Protocol]:
    """Get a protocol by ID."""
    return db.query(Protocol).filter(Protocol.id == protocol_id).first()


def get_protocols(db: Session, skip: int = 0, limit: int = 100, target_metric: Optional[str] = None) -> List[Protocol]:
    """Get all protocols with optional filtering by target metric."""
    query = db.query(Protocol)

    if target_metric:
        # Filter protocols that target the specified metric
        query = query.filter(Protocol.target_metrics.any(target_metric))

    return query.offset(skip).limit(limit).all()


def create_protocol(db: Session, protocol_in: ProtocolCreate) -> Protocol:
    """Create a new protocol."""
    db_obj = Protocol(
        name=protocol_in.name,
        description=protocol_in.description,
        target_metrics=protocol_in.target_metrics,
        duration_type=protocol_in.duration_type,
        duration_days=protocol_in.duration_days,
    )

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_protocol(db: Session, db_obj: Protocol, protocol_in: ProtocolUpdate) -> Protocol:
    """Update a protocol."""
    update_data = protocol_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_protocol(db: Session, protocol_id: UUID) -> None:
    """Delete a protocol."""
    db_obj = db.query(Protocol).get(protocol_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()


def get_protocol_templates(db: Session) -> List[Dict[str, Any]]:
    """Get predefined protocol templates."""
    # Define protocol templates
    templates = [
        {
            "name": "Sleep Optimization Protocol",
            "description": "A protocol designed to improve sleep quality and consistency.",
            "target_metrics": ["sleep"],
            "duration_type": "fixed",
            "duration_days": 28,
            "template_id": "sleep_optimization",
        },
        {
            "name": "Activity Building Protocol",
            "description": "A protocol designed to gradually increase activity levels while maintaining recovery.",
            "target_metrics": ["activity", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 30,
            "template_id": "activity_building",
        },
        {
            "name": "Recovery Protocol",
            "description": "A protocol designed to optimize recovery after intense activity periods.",
            "target_metrics": ["sleep", "activity", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 14,
            "template_id": "recovery",
        },
        {
            "name": "Heart Rate Variability Improvement Protocol",
            "description": "A protocol designed to improve heart rate variability through targeted interventions.",
            "target_metrics": ["heart_rate", "sleep", "activity"],
            "duration_type": "fixed",
            "duration_days": 21,
            "template_id": "hrv_improvement",
        },
        {
            "name": "Stress Reduction Protocol",
            "description": "A protocol designed to reduce stress levels and improve overall well-being.",
            "target_metrics": ["heart_rate", "sleep", "mood"],
            "duration_type": "fixed",
            "duration_days": 28,
            "template_id": "stress_reduction",
        },
        {
            "name": "Mood Enhancement Protocol",
            "description": "A protocol designed to improve mood and emotional well-being.",
            "target_metrics": ["mood", "sleep", "activity"],
            "duration_type": "fixed",
            "duration_days": 30,
            "template_id": "mood_enhancement",
        },
        {
            "name": "Blood Pressure Management Protocol",
            "description": "A protocol designed to help manage and optimize blood pressure levels.",
            "target_metrics": ["blood_pressure", "heart_rate", "activity"],
            "duration_type": "fixed",
            "duration_days": 42,
            "template_id": "blood_pressure_management",
        },
        {
            "name": "Weight Management Protocol",
            "description": "A protocol designed to support healthy weight management goals.",
            "target_metrics": ["weight", "activity", "sleep"],
            "duration_type": "fixed",
            "duration_days": 60,
            "template_id": "weight_management",
        },
        {
            "name": "Circadian Rhythm Optimization Protocol",
            "description": "A protocol designed to align and optimize your circadian rhythm for better health.",
            "target_metrics": ["sleep", "activity", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 21,
            "template_id": "circadian_optimization",
        },
        {
            "name": "Energy Enhancement Protocol",
            "description": "A protocol designed to improve energy levels throughout the day.",
            "target_metrics": ["activity", "sleep", "mood"],
            "duration_type": "fixed",
            "duration_days": 28,
            "template_id": "energy_enhancement",
        },
    ]

    return templates


def create_protocol_from_template(db: Session, template_id: str, customizations: Optional[Dict[str, Any]] = None) -> Optional[Protocol]:
    """Create a protocol from a template with optional customizations."""
    templates = get_protocol_templates(db)

    # Find the template with the matching ID
    template = next((t for t in templates if t["template_id"] == template_id), None)
    if not template:
        return None

    # Create a copy of the template data
    protocol_data = {k: v for k, v in template.items() if k != "template_id"}

    # Apply customizations if provided, but only for non-None values
    if customizations:
        for key, value in customizations.items():
            if key in protocol_data and value is not None:
                protocol_data[key] = value

    # Create protocol from template
    protocol_in = ProtocolCreate(**protocol_data)

    return create_protocol(db, protocol_in)


def get_protocol_template_details(template_id: str) -> Dict[str, Any]:
    """
    Get detailed information about a protocol template.

    Args:
        template_id: ID of the template

    Returns:
        Dictionary with detailed protocol information
    """
    # Define detailed protocol information
    protocol_details = {
        "sleep_optimization": {
            "overview": "The Sleep Optimization Protocol is designed to improve sleep quality, duration, and consistency over a 4-week period.",
            "goals": ["Increase deep sleep duration", "Improve sleep consistency", "Reduce sleep latency", "Enhance overall sleep quality"],
            "metrics_tracked": [
                {"name": "Sleep Duration", "description": "Total time spent asleep each night", "target": "7-9 hours"},
                {"name": "Deep Sleep", "description": "Time spent in deep sleep stages", "target": "Increase by 10-15%"},
                {"name": "Sleep Consistency", "description": "Variation in sleep and wake times", "target": "< 30 min variation"},
                {"name": "Sleep Latency", "description": "Time to fall asleep", "target": "< 15 minutes"},
            ],
            "phases": [
                {
                    "name": "Assessment Phase",
                    "duration": "7 days",
                    "description": "Establish baseline sleep patterns and identify areas for improvement.",
                },
                {
                    "name": "Intervention Phase",
                    "duration": "14 days",
                    "description": "Implement targeted sleep hygiene practices and environmental optimizations.",
                },
                {"name": "Maintenance Phase", "duration": "7 days", "description": "Solidify new sleep habits and assess improvements."},
            ],
            "success_criteria": [
                "Increase in deep sleep percentage",
                "More consistent sleep and wake times",
                "Reduced sleep latency",
                "Improved subjective sleep quality",
            ],
        },
        "activity_building": {
            "overview": "The Activity Building Protocol is designed to gradually increase physical activity levels while ensuring proper recovery.",
            "goals": [
                "Increase daily step count",
                "Improve cardiovascular fitness",
                "Enhance activity consistency",
                "Balance activity with recovery",
            ],
            "metrics_tracked": [
                {"name": "Daily Steps", "description": "Total steps taken each day", "target": "Progressive increase"},
                {"name": "Active Minutes", "description": "Time spent in moderate to vigorous activity", "target": "150+ minutes/week"},
                {"name": "Resting Heart Rate", "description": "Heart rate at complete rest", "target": "Decrease over time"},
                {"name": "Recovery Score", "description": "Measure of physiological recovery", "target": "Maintain healthy levels"},
            ],
            "phases": [
                {"name": "Baseline Phase", "duration": "7 days", "description": "Establish current activity patterns and fitness level."},
                {
                    "name": "Progressive Loading Phase",
                    "duration": "14 days",
                    "description": "Gradually increase activity volume and intensity.",
                },
                {"name": "Integration Phase", "duration": "9 days", "description": "Solidify new activity patterns into daily routine."},
            ],
            "success_criteria": [
                "Sustainable increase in daily step count",
                "Improved cardiovascular metrics",
                "Consistent activity patterns",
                "Balanced activity and recovery",
            ],
        },
        "recovery": {
            "overview": "The Recovery Protocol is designed to optimize physiological recovery after periods of high stress or intense activity.",
            "goals": [
                "Improve sleep quality",
                "Reduce resting heart rate",
                "Increase heart rate variability",
                "Enhance subjective recovery",
            ],
            "metrics_tracked": [
                {"name": "Sleep Quality", "description": "Overall sleep score", "target": "80+ out of 100"},
                {"name": "Resting Heart Rate", "description": "Heart rate at complete rest", "target": "Return to baseline or lower"},
                {
                    "name": "Heart Rate Variability",
                    "description": "Variation in time between heartbeats",
                    "target": "Increase from baseline",
                },
                {"name": "Subjective Recovery", "description": "Self-reported recovery feeling", "target": "Consistent improvement"},
            ],
            "phases": [
                {"name": "Deload Phase", "duration": "5 days", "description": "Significant reduction in activity intensity and volume."},
                {"name": "Active Recovery Phase", "duration": "5 days", "description": "Introduction of light, restorative activities."},
                {"name": "Reintegration Phase", "duration": "4 days", "description": "Gradual return to normal activity levels."},
            ],
            "success_criteria": [
                "Improved sleep metrics",
                "Decreased resting heart rate",
                "Increased heart rate variability",
                "Enhanced subjective recovery scores",
            ],
        },
        "hrv_improvement": {
            "overview": "The Heart Rate Variability Improvement Protocol aims to enhance autonomic nervous system function through targeted interventions.",
            "goals": [
                "Increase overall HRV",
                "Improve stress resilience",
                "Enhance recovery capacity",
                "Balance sympathetic and parasympathetic activity",
            ],
            "metrics_tracked": [
                {"name": "HRV (RMSSD)", "description": "Root Mean Square of Successive Differences", "target": "Progressive increase"},
                {"name": "Resting Heart Rate", "description": "Heart rate at complete rest", "target": "Decrease over time"},
                {"name": "Sleep Quality", "description": "Overall sleep score", "target": "80+ out of 100"},
                {"name": "Stress Score", "description": "Measure of physiological stress", "target": "Decrease over time"},
            ],
            "phases": [
                {
                    "name": "Assessment Phase",
                    "duration": "5 days",
                    "description": "Establish baseline HRV patterns and identify factors affecting it.",
                },
                {"name": "Intervention Phase", "duration": "12 days", "description": "Implement targeted practices to improve HRV."},
                {"name": "Integration Phase", "duration": "4 days", "description": "Solidify habits that positively impact HRV."},
            ],
            "success_criteria": [
                "Increased average HRV",
                "Improved HRV trends during sleep",
                "Enhanced stress resilience",
                "Better recovery metrics",
            ],
        },
        "stress_reduction": {
            "overview": "The Stress Reduction Protocol is designed to lower physiological and psychological stress levels through targeted interventions.",
            "goals": [
                "Reduce physiological stress markers",
                "Improve stress resilience",
                "Enhance sleep quality",
                "Improve mood and emotional well-being",
            ],
            "metrics_tracked": [
                {"name": "Resting Heart Rate", "description": "Heart rate at complete rest", "target": "Decrease over time"},
                {
                    "name": "Heart Rate Variability",
                    "description": "Variation in time between heartbeats",
                    "target": "Increase from baseline",
                },
                {"name": "Sleep Quality", "description": "Overall sleep score", "target": "80+ out of 100"},
                {"name": "Mood Score", "description": "Self-reported mood rating", "target": "Consistent improvement"},
            ],
            "phases": [
                {
                    "name": "Awareness Phase",
                    "duration": "7 days",
                    "description": "Identify stress triggers and establish baseline stress patterns.",
                },
                {
                    "name": "Intervention Phase",
                    "duration": "14 days",
                    "description": "Implement stress reduction techniques and lifestyle modifications.",
                },
                {
                    "name": "Integration Phase",
                    "duration": "7 days",
                    "description": "Solidify stress management practices into daily routine.",
                },
            ],
            "success_criteria": [
                "Decreased resting heart rate",
                "Increased heart rate variability",
                "Improved sleep quality",
                "Enhanced mood scores",
            ],
        },
    }

    # Return details for the requested template
    return protocol_details.get(template_id, {"overview": "Detailed information not available for this protocol template."})


def get_protocol_effectiveness_metrics(protocol_id: UUID, db: Session) -> Dict[str, Any]:
    """
    Get effectiveness metrics for a protocol.

    Args:
        protocol_id: Protocol ID
        db: Database session

    Returns:
        Dictionary with effectiveness metrics
    """
    # Get the protocol
    protocol = get_protocol(db, protocol_id)
    if not protocol:
        return {"error": "Protocol not found"}

    # Define metrics based on protocol target metrics
    effectiveness_metrics = {
        "sleep": [
            {"name": "Sleep Duration", "description": "Average sleep duration", "weight": 0.3},
            {"name": "Deep Sleep", "description": "Average deep sleep duration", "weight": 0.3},
            {"name": "Sleep Consistency", "description": "Consistency of sleep and wake times", "weight": 0.2},
            {"name": "Sleep Quality", "description": "Subjective sleep quality rating", "weight": 0.2},
        ],
        "activity": [
            {"name": "Daily Steps", "description": "Average daily step count", "weight": 0.3},
            {"name": "Active Minutes", "description": "Average daily active minutes", "weight": 0.3},
            {"name": "Activity Consistency", "description": "Consistency of daily activity", "weight": 0.2},
            {"name": "Activity Intensity", "description": "Average activity intensity", "weight": 0.2},
        ],
        "heart_rate": [
            {"name": "Resting Heart Rate", "description": "Average resting heart rate", "weight": 0.3},
            {"name": "Heart Rate Variability", "description": "Average heart rate variability", "weight": 0.4},
            {"name": "Heart Rate Recovery", "description": "Heart rate recovery after activity", "weight": 0.3},
        ],
        "mood": [
            {"name": "Average Mood", "description": "Average mood rating", "weight": 0.4},
            {"name": "Mood Stability", "description": "Consistency of mood ratings", "weight": 0.3},
            {"name": "Energy Level", "description": "Average energy level rating", "weight": 0.3},
        ],
        "weight": [
            {"name": "Weight Trend", "description": "Direction and magnitude of weight change", "weight": 0.5},
            {"name": "Weight Consistency", "description": "Consistency of weight measurements", "weight": 0.2},
            {"name": "Body Composition", "description": "Changes in body composition metrics", "weight": 0.3},
        ],
        "blood_pressure": [
            {"name": "Systolic Pressure", "description": "Average systolic blood pressure", "weight": 0.4},
            {"name": "Diastolic Pressure", "description": "Average diastolic blood pressure", "weight": 0.4},
            {"name": "Blood Pressure Stability", "description": "Consistency of blood pressure readings", "weight": 0.2},
        ],
    }

    # Filter metrics based on protocol target metrics
    protocol_metrics = {}
    for metric_type in protocol.target_metrics:
        if metric_type in effectiveness_metrics:
            protocol_metrics[metric_type] = effectiveness_metrics[metric_type]

    return {
        "protocol_id": protocol_id,
        "protocol_name": protocol.name,
        "target_metrics": protocol.target_metrics,
        "effectiveness_metrics": protocol_metrics,
    }

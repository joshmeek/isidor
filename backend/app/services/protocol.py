from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.protocol import Protocol
from app.schemas.protocol import ProtocolCreate, ProtocolUpdate
from sqlalchemy.orm import Session


def get_protocol(db: Session, protocol_id: UUID) -> Optional[Protocol]:
    """Get a protocol by ID."""
    return db.query(Protocol).filter(Protocol.id == protocol_id).first()


def get_protocols(db: Session, skip: int = 0, limit: int = 100, target_metric: Optional[str] = None, status: Optional[str] = None) -> List[Protocol]:
    """
    Get all protocols with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        target_metric: Filter by target metric
        status: Filter by status
        
    Returns:
        List of Protocol objects
    """
    query = db.query(Protocol)

    if target_metric:
        # Filter protocols that target the specified metric
        query = query.filter(Protocol.target_metrics.any(target_metric))

    if status:
        # Filter protocols by status
        query = query.filter(Protocol.status == status)

    # Apply pagination
    query = query.order_by(Protocol.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    return query.all()


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
    """
    Get a list of available protocol templates.
    
    These are predefined protocols that users can enroll in.
    """
    templates = [
        {
            "id": "intermittent-fasting-16-8",
            "name": "Intermittent Fasting (16:8)",
            "description": "Fast for 16 hours each day, eating only during an 8-hour window. This protocol helps with weight management, metabolic health, and may improve insulin sensitivity.",
            "target_metrics": ["weight", "calories", "heart_rate"],
            "duration_type": "ongoing",
            "duration_days": None,
            "customizable_fields": ["start_date"],
            "category": "nutrition"
        },
        {
            "id": "sleep-optimization",
            "name": "Sleep Optimization Protocol",
            "description": "Improve sleep quality through consistent sleep schedule, evening routine, and sleep environment optimization. Track sleep metrics to measure improvements.",
            "target_metrics": ["sleep"],
            "duration_type": "fixed",
            "duration_days": 30,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "sleep"
        },
        {
            "id": "daily-10k-steps",
            "name": "Daily 10,000 Steps Challenge",
            "description": "Commit to walking 10,000 steps every day to improve cardiovascular health, manage weight, and boost energy levels.",
            "target_metrics": ["activity"],
            "duration_type": "fixed",
            "duration_days": 30,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "fitness"
        },
        {
            "id": "meditation-practice",
            "name": "Daily Meditation Practice",
            "description": "Establish a daily meditation practice to reduce stress, improve focus, and enhance overall well-being. Track mood and heart rate to observe benefits.",
            "target_metrics": ["mood", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 21,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "mental-health"
        },
        {
            "id": "low-carb-diet",
            "name": "Low-Carb Nutrition Plan",
            "description": "Follow a low-carbohydrate diet to manage weight, blood sugar levels, and improve metabolic health. Track calories, weight, and energy levels.",
            "target_metrics": ["calories", "weight", "event"],
            "duration_type": "fixed",
            "duration_days": 30,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "nutrition"
        },
        {
            "id": "hydration-challenge",
            "name": "Optimal Hydration Challenge",
            "description": "Drink adequate water daily to improve energy, skin health, and overall well-being. Track water intake and observe effects on other health metrics.",
            "target_metrics": ["event", "mood"],
            "duration_type": "fixed",
            "duration_days": 14,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "nutrition"
        },
        {
            "id": "strength-training",
            "name": "Progressive Strength Training",
            "description": "Follow a progressive strength training program to build muscle, increase metabolism, and improve overall fitness.",
            "target_metrics": ["activity", "weight"],
            "duration_type": "fixed",
            "duration_days": 60,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "fitness"
        },
        {
            "id": "stress-reduction",
            "name": "Stress Reduction Protocol",
            "description": "Implement daily stress reduction techniques to improve mental health, sleep quality, and reduce physiological stress markers.",
            "target_metrics": ["mood", "sleep", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 28,
            "customizable_fields": ["start_date", "duration_days"],
            "category": "mental-health"
        }
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
    Get detailed information about a specific protocol template.

    Args:
        template_id: The ID of the template to retrieve

    Returns:
        Dict containing detailed template information
    """
    # Define detailed template information
    template_details = {
        "intermittent-fasting-16-8": {
            "name": "Intermittent Fasting (16:8)",
            "description": "Fast for 16 hours each day, eating only during an 8-hour window. This protocol helps with weight management, metabolic health, and may improve insulin sensitivity.",
            "target_metrics": ["weight", "calories", "heart_rate"],
            "duration_type": "ongoing",
            "duration_days": None,
            "steps": [
                "Choose an 8-hour eating window that works for your schedule (e.g., 12pm-8pm)",
                "Consume all daily calories within this window",
                "During fasting hours, drink water, black coffee, or unsweetened tea",
                "Track your weight regularly to monitor progress",
                "Log your meals and caloric intake during eating windows",
                "Monitor how you feel throughout the day"
            ],
            "recommendations": [
                "Start gradually if new to fasting - try 12 hours first, then increase",
                "Stay well-hydrated during fasting periods",
                "Focus on nutrient-dense foods during eating windows",
                "Consider taking electrolytes during longer fasts",
                "Consult a healthcare provider before starting if you have any medical conditions"
            ],
            "expected_outcomes": [
                "Potential weight loss",
                "Improved insulin sensitivity",
                "Reduced inflammation markers",
                "Increased energy levels after adaptation period",
                "Potential improvements in heart rate variability"
            ],
            "category": "nutrition"
        },
        "sleep-optimization": {
            "name": "Sleep Optimization Protocol",
            "description": "Improve sleep quality through consistent sleep schedule, evening routine, and sleep environment optimization. Track sleep metrics to measure improvements.",
            "target_metrics": ["sleep"],
            "duration_type": "fixed",
            "duration_days": 30,
            "steps": [
                "Establish a consistent sleep and wake time (even on weekends)",
                "Create a relaxing bedtime routine (30-60 minutes before sleep)",
                "Optimize your sleep environment (dark, cool, quiet)",
                "Avoid screens 1 hour before bedtime",
                "Track sleep duration and quality daily",
                "Limit caffeine after noon and alcohol before bed"
            ],
            "recommendations": [
                "Use blackout curtains or a sleep mask for darkness",
                "Consider white noise for sound masking if needed",
                "Keep bedroom temperature between 60-67°F (15-19°C)",
                "Try relaxation techniques like deep breathing before sleep",
                "If you can't sleep after 20 minutes, get up and do something relaxing until tired"
            ],
            "expected_outcomes": [
                "Reduced time to fall asleep",
                "Fewer nighttime awakenings",
                "Increased deep and REM sleep",
                "Improved daytime energy and alertness",
                "Better overall sleep quality scores"
            ],
            "category": "sleep"
        },
        "daily-10k-steps": {
            "name": "Daily 10,000 Steps Challenge",
            "description": "Commit to walking 10,000 steps every day to improve cardiovascular health, manage weight, and boost energy levels.",
            "target_metrics": ["activity"],
            "duration_type": "fixed",
            "duration_days": 30,
            "steps": [
                "Track your baseline step count for 3 days",
                "Gradually increase daily steps by 1,000 each week until reaching 10,000",
                "Schedule dedicated walking times throughout the day",
                "Take the stairs instead of elevators when possible",
                "Park farther away from entrances",
                "Consider walking meetings or phone calls"
            ],
            "recommendations": [
                "Invest in comfortable, supportive walking shoes",
                "Break up steps throughout the day rather than all at once",
                "Use a reliable step tracker (phone or wearable device)",
                "Find walking buddies for accountability",
                "Have indoor alternatives for bad weather days"
            ],
            "expected_outcomes": [
                "Improved cardiovascular fitness",
                "Potential weight management benefits",
                "Increased energy levels",
                "Better mood and reduced stress",
                "Improved sleep quality"
            ],
            "category": "fitness"
        },
        "meditation-practice": {
            "name": "Daily Meditation Practice",
            "description": "Establish a daily meditation practice to reduce stress, improve focus, and enhance overall well-being. Track mood and heart rate to observe benefits.",
            "target_metrics": ["mood", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 21,
            "steps": [
                "Start with 5 minutes of meditation daily, gradually increasing to 20 minutes",
                "Choose a consistent time each day for practice",
                "Find a quiet space with minimal distractions",
                "Track mood before and after meditation sessions",
                "Monitor resting heart rate trends over time",
                "Try different meditation techniques to find what works best"
            ],
            "recommendations": [
                "Use guided meditation apps for beginners",
                "Focus on breath as an anchor when mind wanders",
                "Be patient and non-judgmental with yourself",
                "Consider body scan, loving-kindness, or mindfulness techniques",
                "Consistency matters more than duration"
            ],
            "expected_outcomes": [
                "Reduced stress levels",
                "Lower resting heart rate",
                "Improved heart rate variability",
                "Better emotional regulation",
                "Enhanced focus and attention",
                "Improved sleep quality"
            ],
            "category": "mental-health"
        },
        "low-carb-diet": {
            "name": "Low-Carb Nutrition Plan",
            "description": "Follow a low-carbohydrate diet to manage weight, blood sugar levels, and improve metabolic health. Track calories, weight, and energy levels.",
            "target_metrics": ["calories", "weight", "event"],
            "duration_type": "fixed",
            "duration_days": 30,
            "steps": [
                "Reduce daily carbohydrate intake to 50-100g per day",
                "Increase protein and healthy fat consumption",
                "Eliminate refined sugars and processed carbohydrates",
                "Track all food intake and macronutrient ratios",
                "Monitor weight changes 2-3 times per week",
                "Log energy levels and hunger patterns daily"
            ],
            "recommendations": [
                "Focus on whole foods: meat, fish, eggs, vegetables, nuts, and seeds",
                "Stay well-hydrated as low-carb diets can increase water loss",
                "Consider electrolyte supplementation",
                "Prepare meals at home to control ingredients",
                "Read food labels carefully for hidden carbs"
            ],
            "expected_outcomes": [
                "Potential weight loss",
                "Reduced hunger and cravings",
                "More stable energy levels throughout the day",
                "Improved blood sugar control",
                "Potential improvements in cholesterol profiles"
            ],
            "category": "nutrition"
        },
        "hydration-challenge": {
            "name": "Optimal Hydration Challenge",
            "description": "Drink adequate water daily to improve energy, skin health, and overall well-being. Track water intake and observe effects on other health metrics.",
            "target_metrics": ["event", "mood"],
            "duration_type": "fixed",
            "duration_days": 14,
            "steps": [
                "Calculate your target daily water intake (typically 0.5-1 oz per pound of body weight)",
                "Track water consumption throughout the day",
                "Set up regular reminders to drink water",
                "Monitor changes in energy, skin appearance, and digestion",
                "Reduce intake of dehydrating beverages (alcohol, caffeine)",
                "Check urine color as a hydration indicator (pale yellow is optimal)"
            ],
            "recommendations": [
                "Carry a reusable water bottle with volume markings",
                "Drink a glass of water first thing in the morning",
                "Set up water intake reminders on your phone",
                "Infuse water with fruit or herbs for flavor if needed",
                "Increase intake during exercise or hot weather"
            ],
            "expected_outcomes": [
                "Improved energy levels",
                "Better skin appearance and elasticity",
                "Enhanced cognitive function",
                "Improved digestion and regularity",
                "Reduced headaches",
                "Better exercise performance"
            ],
            "category": "nutrition"
        },
        "strength-training": {
            "name": "Progressive Strength Training",
            "description": "Follow a progressive strength training program to build muscle, increase metabolism, and improve overall fitness.",
            "target_metrics": ["activity", "weight"],
            "duration_type": "fixed",
            "duration_days": 60,
            "steps": [
                "Perform strength training 3-4 times per week",
                "Focus on major muscle groups with compound exercises",
                "Start with lighter weights and proper form",
                "Gradually increase weight or resistance over time",
                "Allow 48 hours of recovery between training the same muscle group",
                "Track workouts, weights used, and progress"
            ],
            "recommendations": [
                "Begin each session with a proper warm-up",
                "Focus on form over weight, especially when starting",
                "Include a mix of pushing, pulling, and lower body exercises",
                "Ensure adequate protein intake (1.6-2.2g per kg of body weight)",
                "Get sufficient sleep for recovery",
                "Consider working with a trainer initially for proper form"
            ],
            "expected_outcomes": [
                "Increased muscle strength and endurance",
                "Improved body composition",
                "Enhanced metabolic rate",
                "Better posture and reduced risk of injury",
                "Improved bone density",
                "Enhanced overall functional fitness"
            ],
            "category": "fitness"
        },
        "stress-reduction": {
            "name": "Stress Reduction Protocol",
            "description": "Implement daily stress reduction techniques to improve mental health, sleep quality, and reduce physiological stress markers.",
            "target_metrics": ["mood", "sleep", "heart_rate"],
            "duration_type": "fixed",
            "duration_days": 28,
            "steps": [
                "Practice deep breathing exercises for 5 minutes, 3 times daily",
                "Implement a daily 15-minute mindfulness practice",
                "Reduce screen time, especially before bed",
                "Spend at least 20 minutes outdoors daily",
                "Journal about stressors and gratitude each evening",
                "Track mood, sleep quality, and heart rate daily"
            ],
            "recommendations": [
                "Try different relaxation techniques to find what works best",
                "Create clear boundaries between work and personal time",
                "Limit news and social media consumption",
                "Consider apps for guided relaxation and mindfulness",
                "Prioritize social connections and support systems"
            ],
            "expected_outcomes": [
                "Reduced perceived stress levels",
                "Lower resting heart rate",
                "Improved heart rate variability",
                "Better sleep quality and duration",
                "Enhanced mood stability",
                "Improved ability to manage stressful situations"
            ],
            "category": "mental-health"
        }
    }
    
    # Return the template details if found, otherwise return None
    return template_details.get(template_id)


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

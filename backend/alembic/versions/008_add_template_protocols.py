"""Add template protocols to database

Revision ID: 008_add_template_protocols
Revises: 007_add_timestamps_to_protocols
Create Date: 2025-03-12 10:30:00.000000

"""

import uuid
from datetime import datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "008_add_template_protocols"
down_revision = "007_add_timestamps_to_protocols"
branch_labels = None
depends_on = None

# Template protocols to add to the database
TEMPLATE_PROTOCOLS = [
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  # Fixed UUID for Sleep Optimization
        "name": "Sleep Optimization Protocol",
        "description": "Improve sleep quality through consistent sleep schedule, evening routine, and sleep environment optimization. Track sleep metrics to measure improvements.",
        "target_metrics": ["sleep"],
        "template_id": "sleep-optimization",
        "steps": [
            "Establish a consistent sleep and wake time (even on weekends)",
            "Create a relaxing bedtime routine (30-60 minutes before sleep)",
            "Optimize your sleep environment (dark, cool, quiet)",
            "Avoid screens 1 hour before bedtime",
            "Track sleep duration and quality daily",
            "Limit caffeine after noon and alcohol before bed",
        ],
        "recommendations": [
            "Use blackout curtains or a sleep mask for darkness",
            "Consider white noise for sound masking if needed",
            "Keep bedroom temperature between 60-67°F (15-19°C)",
            "Try relaxation techniques like deep breathing before sleep",
            "If you can't sleep after 20 minutes, get up and do something relaxing until tired",
        ],
        "expected_outcomes": [
            "Reduced time to fall asleep",
            "Fewer nighttime awakenings",
            "Increased deep and REM sleep",
            "Improved daytime energy and alertness",
            "Better overall sleep quality scores",
        ],
        "category": "sleep",
        "duration_type": "fixed",
        "duration_days": 30,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",  # Fixed UUID for Daily Activity Challenge
        "name": "Daily 10,000 Steps Challenge",
        "description": "Commit to walking 10,000 steps every day to improve cardiovascular health, manage weight, and boost energy levels.",
        "target_metrics": ["activity"],
        "template_id": "daily-10k-steps",
        "steps": [
            "Track your baseline step count for 3 days",
            "Gradually increase daily steps by 1,000 each week until reaching 10,000",
            "Schedule dedicated walking times throughout the day",
            "Take the stairs instead of elevators when possible",
            "Park farther away from entrances",
            "Consider walking meetings or phone calls",
        ],
        "recommendations": [
            "Invest in comfortable, supportive walking shoes",
            "Break up steps throughout the day rather than all at once",
            "Use a reliable step tracker (phone or wearable device)",
            "Find walking buddies for accountability",
            "Have indoor alternatives for bad weather days",
        ],
        "expected_outcomes": [
            "Improved cardiovascular fitness",
            "Potential weight management benefits",
            "Increased energy levels",
            "Better mood and reduced stress",
            "Improved sleep quality",
        ],
        "category": "fitness",
        "duration_type": "fixed",
        "duration_days": 21,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d481",  # Fixed UUID for Intermittent Fasting
        "name": "Intermittent Fasting (16:8)",
        "description": "Fast for 16 hours each day, eating only during an 8-hour window. This protocol helps with weight management, metabolic health, and may improve insulin sensitivity.",
        "target_metrics": ["weight", "calories", "heart_rate"],
        "template_id": "intermittent-fasting-16-8",
        "steps": [
            "Choose an 8-hour eating window that works for your schedule (e.g., 12pm-8pm)",
            "Consume all daily calories within this window",
            "During fasting hours, drink water, black coffee, or unsweetened tea",
            "Track your weight regularly to monitor progress",
            "Log your meals and caloric intake during eating windows",
            "Monitor how you feel throughout the day",
        ],
        "recommendations": [
            "Start gradually if new to fasting - try 12 hours first, then increase",
            "Stay well-hydrated during fasting periods",
            "Focus on nutrient-dense foods during eating windows",
            "Consider taking electrolytes during longer fasts",
            "Consult a healthcare provider before starting if you have any medical conditions",
        ],
        "expected_outcomes": [
            "Potential weight loss",
            "Improved insulin sensitivity",
            "Reduced inflammation markers",
            "Increased energy levels after adaptation period",
            "Potential improvements in heart rate variability",
        ],
        "category": "nutrition",
        "duration_type": "ongoing",
        "duration_days": 30,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d482",  # Fixed UUID for Meditation Practice
        "name": "Daily Meditation Practice",
        "description": "Establish a daily meditation practice to reduce stress, improve focus, and enhance overall well-being. Track mood and heart rate to observe benefits.",
        "target_metrics": ["mood", "heart_rate"],
        "template_id": "meditation-practice",
        "steps": [
            "Start with 5 minutes of meditation daily, gradually increasing to 20 minutes",
            "Choose a consistent time each day for practice",
            "Find a quiet space with minimal distractions",
            "Track mood before and after meditation sessions",
            "Monitor resting heart rate trends over time",
            "Try different meditation techniques to find what works best",
        ],
        "recommendations": [
            "Use guided meditation apps for beginners",
            "Focus on breath as an anchor when mind wanders",
            "Be patient and non-judgmental with yourself",
            "Consider body scan, loving-kindness, or mindfulness techniques",
            "Consistency matters more than duration",
        ],
        "expected_outcomes": [
            "Reduced stress levels",
            "Lower resting heart rate",
            "Improved heart rate variability",
            "Better emotional regulation",
            "Enhanced focus and attention",
            "Improved sleep quality",
        ],
        "category": "mental-health",
        "duration_type": "fixed",
        "duration_days": 21,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d483",  # Fixed UUID for Low-Carb Diet
        "name": "Low-Carb Nutrition Plan",
        "description": "Follow a low-carbohydrate diet to manage weight, blood sugar levels, and improve metabolic health. Track calories, weight, and energy levels.",
        "target_metrics": ["calories", "weight", "event"],
        "template_id": "low-carb-diet",
        "steps": [
            "Reduce daily carbohydrate intake to 50-100g per day",
            "Increase protein and healthy fat consumption",
            "Eliminate refined sugars and processed carbohydrates",
            "Track all food intake and macronutrient ratios",
            "Monitor weight changes 2-3 times per week",
            "Log energy levels and hunger patterns daily",
        ],
        "recommendations": [
            "Focus on whole foods: meat, fish, eggs, vegetables, nuts, and seeds",
            "Stay well-hydrated as low-carb diets can increase water loss",
            "Consider electrolyte supplementation",
            "Prepare meals at home to control ingredients",
            "Read food labels carefully for hidden carbs",
        ],
        "expected_outcomes": [
            "Potential weight loss",
            "Reduced hunger and cravings",
            "More stable energy levels throughout the day",
            "Improved blood sugar control",
            "Potential improvements in cholesterol profiles",
        ],
        "category": "nutrition",
        "duration_type": "fixed",
        "duration_days": 30,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d484",  # Fixed UUID for Hydration Challenge
        "name": "Optimal Hydration Challenge",
        "description": "Drink adequate water daily to improve energy, skin health, and overall well-being. Track water intake and observe effects on other health metrics.",
        "target_metrics": ["event", "mood"],
        "template_id": "hydration-challenge",
        "steps": [
            "Calculate your target daily water intake (typically 0.5-1 oz per pound of body weight)",
            "Track water consumption throughout the day",
            "Set up regular reminders to drink water",
            "Monitor changes in energy, skin appearance, and digestion",
            "Reduce intake of dehydrating beverages (alcohol, caffeine)",
            "Check urine color as a hydration indicator (pale yellow is optimal)",
        ],
        "recommendations": [
            "Carry a reusable water bottle with volume markings",
            "Drink a glass of water first thing in the morning",
            "Set up water intake reminders on your phone",
            "Infuse water with fruit or herbs for flavor if needed",
            "Increase intake during exercise or hot weather",
        ],
        "expected_outcomes": [
            "Improved energy levels",
            "Better skin appearance and elasticity",
            "Enhanced cognitive function",
            "Improved digestion and regularity",
            "Reduced headaches",
            "Better exercise performance",
        ],
        "category": "nutrition",
        "duration_type": "fixed",
        "duration_days": 14,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d485",  # Fixed UUID for Strength Training
        "name": "Progressive Strength Training",
        "description": "Follow a progressive strength training program to build muscle, increase metabolism, and improve overall fitness.",
        "target_metrics": ["activity", "weight"],
        "template_id": "strength-training",
        "steps": [
            "Perform strength training 3-4 times per week",
            "Focus on major muscle groups with compound exercises",
            "Start with lighter weights and proper form",
            "Gradually increase weight or resistance over time",
            "Allow 48 hours of recovery between training the same muscle group",
            "Track workouts, weights used, and progress",
        ],
        "recommendations": [
            "Begin each session with a proper warm-up",
            "Focus on form over weight, especially when starting",
            "Include a mix of pushing, pulling, and lower body exercises",
            "Ensure adequate protein intake (1.6-2.2g per kg of body weight)",
            "Get sufficient sleep for recovery",
            "Consider working with a trainer initially for proper form",
        ],
        "expected_outcomes": [
            "Increased muscle strength and endurance",
            "Improved body composition",
            "Enhanced metabolic rate",
            "Better posture and reduced risk of injury",
            "Improved bone density",
            "Enhanced overall functional fitness",
        ],
        "category": "fitness",
        "duration_type": "fixed",
        "duration_days": 60,
        "status": "active",
    },
    {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d486",  # Fixed UUID for Stress Reduction
        "name": "Stress Reduction Protocol",
        "description": "Implement daily stress reduction techniques to improve mental health, sleep quality, and reduce physiological stress markers.",
        "target_metrics": ["mood", "sleep", "heart_rate"],
        "template_id": "stress-reduction",
        "steps": [
            "Practice deep breathing exercises for 5 minutes, 3 times daily",
            "Implement a daily 15-minute mindfulness practice",
            "Reduce screen time, especially before bed",
            "Spend at least 20 minutes outdoors daily",
            "Journal about stressors and gratitude each evening",
            "Track mood, sleep quality, and heart rate daily",
        ],
        "recommendations": [
            "Try different relaxation techniques to find what works best",
            "Create clear boundaries between work and personal time",
            "Limit news and social media consumption",
            "Consider apps for guided relaxation and mindfulness",
            "Prioritize social connections and support systems",
        ],
        "expected_outcomes": [
            "Reduced perceived stress levels",
            "Lower resting heart rate",
            "Improved heart rate variability",
            "Better sleep quality and duration",
            "Enhanced mood stability",
            "Improved ability to manage stressful situations",
        ],
        "category": "mental-health",
        "duration_type": "fixed",
        "duration_days": 28,
        "status": "active",
    },
]


def upgrade():
    # Get the protocols table
    protocols = sa.table(
        "protocols",
        sa.column("id", postgresql.UUID),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("target_metrics", postgresql.ARRAY(sa.String)),
        sa.column("duration_type", sa.String),
        sa.column("duration_days", sa.Integer),
    )

    # Insert template protocols
    current_time = datetime.now()
    for protocol in TEMPLATE_PROTOCOLS:
        op.execute(
            protocols.insert().values(
                id=protocol["id"],
                name=protocol["name"],
                description=protocol["description"],
                target_metrics=protocol["target_metrics"],
                duration_type=protocol["duration_type"],
                duration_days=protocol["duration_days"],
            )
        )


def downgrade():
    # Delete the template protocols
    for protocol in TEMPLATE_PROTOCOLS:
        op.execute(f"DELETE FROM protocols WHERE id = '{protocol['id']}'")

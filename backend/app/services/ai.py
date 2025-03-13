import os
from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

import google.generativeai as genai
from app.models.protocol import Protocol
from app.models.user_protocol import UserProtocol
from app.services.ai_cache import create_cached_response, generate_query_hash, get_cached_response
from app.services.ai_memory import create_or_update_ai_memory, get_ai_memory
from app.utils.rag import format_context_for_prompt, retrieve_context_for_user
from fastapi import HTTPException
from sqlalchemy.orm import Session


# Define TimeFrame enum
class TimeFrame(str, Enum):
    LAST_DAY = "last_day"
    LAST_WEEK = "last_week"
    LAST_MONTH = "last_month"
    LAST_3_MONTHS = "last_3_months"
    LAST_6_MONTHS = "last_6_months"
    LAST_YEAR = "last_year"


# Configure the Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# System prompt template
SYSTEM_PROMPT = """
You are Isidor, an AI health assistant designed to provide personalized health insights and protocol recommendations.

Your core principles:
1. Present objective, research-backed insights without being prescriptive
2. Respect user autonomy - provide information, not commands
3. Focus on patterns and correlations in health data
4. Be concise and direct - provide brief, focused responses
5. Prioritize actionable insights over general information

IMPORTANT: Keep your responses brief and to the point. Focus on the most relevant insights based on the available data.
Avoid lengthy explanations, background information, or general health advice unless specifically requested.
Limit your response to 3-5 sentences whenever possible.
"""


async def generate_health_insight(
    db: Session,
    user_id: UUID,
    query: str,
    metric_types: Optional[List[str]] = None,
    update_memory: bool = True,
    time_frame: TimeFrame = TimeFrame.LAST_DAY,
    use_cache: bool = False,
) -> Dict[str, Any]:
    """
    Generate health insights using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        query: User's query about their health
        metric_types: Optional list of metric types to filter by
        update_memory: Whether to update the AI memory with this interaction
        time_frame: Time frame for the analysis (e.g., TimeFrame.LAST_DAY, TimeFrame.LAST_WEEK)
        use_cache: Whether to use cached responses

    Returns:
        Dictionary containing the health insight
    """
    # Get current datetime
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Check cache first if enabled
    if use_cache:
        query_hash = generate_query_hash(query, metric_types, time_frame=time_frame)
        cached_response = get_cached_response(
            db=db, user_id=user_id, endpoint="health_insight", time_frame=time_frame, query_hash=query_hash
        )

        if cached_response:
            print(f"Using cached response for user {user_id}, time_frame {time_frame}")
            return cached_response.response_data

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(db=db, user_id=user_id, query=query, metric_types=metric_types, time_frame=time_frame)

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Check if we have any health data
    has_health_data = bool(context.get("health_metrics"))
    has_active_protocols = bool(context.get("active_protocols"))

    if not has_health_data:
        # No health data available
        insight_prompt = f"""
{SYSTEM_PROMPT}

Current Date and Time: {current_datetime}

The user has requested health insights for the {time_frame.value.replace('_', ' ')}, but there is no health data available.

{memory_context}

Provide a brief, 2-3 sentence response acknowledging the lack of data and suggesting what types of health data would be most valuable to track. Be direct and concise.
"""
    else:
        # Create the insight prompt with available health data
        if has_active_protocols:
            # User has active protocols, focus insights on those
            insight_prompt = f"""
{SYSTEM_PROMPT}

Current Date and Time: {current_datetime}

{context_text}

{memory_context}

Based on the health data from the {time_frame.value.replace('_', ' ')} and active protocols provided, generate a concise health insight. Limit your response to 3-5 sentences that highlight the most significant patterns or trends related to the user's active protocols.

Focus on:
1. How the user's health metrics relate to their protocol goals
2. Any progress or challenges observed in the target metrics
3. Specific metrics that stand out (either positively or negatively)
4. Clear correlations between different metrics that are relevant to their protocols

Be objective, direct, and focused on actionable insights related to their protocols.
"""
        else:
            # No active protocols, provide general insights
            insight_prompt = f"""
{SYSTEM_PROMPT}

Current Date and Time: {current_datetime}

{context_text}

{memory_context}

Based on the health data from the {time_frame.value.replace('_', ' ')}, generate a concise health insight. Limit your response to 3-5 sentences that highlight the most significant patterns or trends. Focus only on objective observations from the data without making assumptions.

If specific metrics stand out (either positively or negatively), briefly mention them. If there are clear correlations between different metrics, note them concisely.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        insight_prompt,
        generation_config={
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 300,  # Reduced to encourage brevity
        },
    )

    # Extract the response text
    insight = response.text

    # Update AI memory with this interaction
    memory_summary = f"""
User requested: Health insights for {time_frame.value.replace('_', ' ')} for {', '.join(metric_types) if metric_types else 'all metrics'}
Key insight provided: {insight}...
"""
    if update_memory:
        create_or_update_ai_memory(db, user_id, memory_summary)

    # Prepare response data
    response_data = {
        "response": insight,
        "metadata": {
            "model": model_name,
            "metric_types": metric_types,
            "has_memory": ai_memory is not None,
            "has_active_protocols": has_active_protocols,
            "protocol_count": len(context.get("active_protocols", [])),
            "time_frame": time_frame.value,
            "cached": False,
            "request_datetime": current_datetime,
        },
        "has_data": has_health_data,
    }

    # Cache the response if enabled
    if use_cache:
        query_hash = generate_query_hash(query, metric_types, time_frame=time_frame)
        create_cached_response(
            db=db,
            user_id=user_id,
            endpoint="health_insight",
            time_frame=time_frame,
            query_hash=query_hash,
            response_data=response_data,
            metric_types=metric_types,
            ttl_hours=24,  # Cache for 24 hours
        )

    # Return the insight
    return response_data


async def generate_protocol_recommendation(
    db: Session, 
    user_id: UUID, 
    health_goal: str, 
    current_metrics: Optional[List[str]] = None,
    time_frame: TimeFrame = TimeFrame.LAST_WEEK
) -> Dict[str, Any]:
    """
    Generate a protocol recommendation using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        health_goal: User's health goal
        current_metrics: List of metric types to consider (if None, all available metrics will be considered)
        time_frame: Time frame for analyzing recent health data (default: last week)

    Returns:
        Dictionary containing the protocol recommendation
    """
    # Get current datetime
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # If current_metrics is None or empty, we'll consider all metrics
    # The RAG system will retrieve all available metrics for the user
    metrics_for_query = current_metrics if current_metrics else None
    
    # Retrieve relevant context using RAG with the specified time frame
    context = retrieve_context_for_user(
        db=db, 
        user_id=user_id, 
        query=health_goal, 
        metric_types=metrics_for_query,
        time_frame=time_frame.value
    )

    # Get the actual metrics that were found in the data
    available_metrics = []
    has_health_data = False
    
    # Extract all metric types that have data
    if context.get("health_metrics"):
        for metric_type, data in context["health_metrics"].items():
            if data:  # If there's data for this metric type
                has_health_data = True
                available_metrics.append(metric_type)
    
    # If current_metrics was provided, filter available_metrics to only include those
    if current_metrics:
        available_metrics = [m for m in available_metrics if m in current_metrics]
        
    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Check if user has active protocols
    has_active_protocols = bool(context.get("active_protocols"))
    active_protocols_text = ""

    if has_active_protocols:
        active_protocols_text = "Active Protocols:\n"
        for protocol in context["active_protocols"]:
            active_protocols_text += f"- {protocol['name']}: {protocol['description']}\n"
            active_protocols_text += f"  Target Metrics: {', '.join(protocol['target_metrics'])}\n"
            active_protocols_text += f"  Status: {protocol['status']}\n"

    # Create the protocol recommendation prompt
    protocol_prompt = f"""
{SYSTEM_PROMPT}

Current Date and Time: {current_datetime}

{context_text}

{memory_context}

User's Health Goal: {health_goal}
Available Metrics: {', '.join(available_metrics) if available_metrics else "None"}
Time Frame Analyzed: {time_frame.value.replace('_', ' ')}

{active_protocols_text}

"""

    if not has_health_data:
        protocol_prompt += """
The user doesn't have relevant health data yet. In 2-3 sentences, suggest a basic protocol and what data they should start collecting to achieve their goal. Be specific about which metrics would be most valuable to track.
"""
    elif has_active_protocols:
        protocol_prompt += """
Provide a concise protocol recommendation to help the user achieve their goal, taking into account their existing active protocols. Limit your response to 5-7 sentences that outline:

1. A clear objective that complements or extends their current protocols
2. Key metrics to track (prioritize those that are already being collected)
3. A suggested timeframe
4. How to measure progress
5. How this recommendation relates to their existing protocols (whether it enhances them or addresses gaps)

Be direct, specific, and focus on actionable recommendations that build upon their current health journey.
"""
    else:
        protocol_prompt += """
Provide a concise protocol recommendation to help the user achieve their goal based on their recent health data. Limit your response to 5-7 sentences that outline:

1. A clear objective
2. Key metrics to track (prioritize those that are already being collected)
3. A suggested timeframe
4. How to measure progress
5. Any specific patterns in their recent data that informed this recommendation

Be direct and specific, focusing on actionable recommendations based on their actual health data.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        protocol_prompt,
        generation_config={
            "temperature": 0.3,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 400,  # Reduced from 1500 to encourage brevity
        },
    )

    # Extract the response text
    protocol_recommendation = response.text

    # Update AI memory with this interaction
    memory_summary = f"""
User requested: Protocol recommendation for health goal: {health_goal}
Metrics available: {', '.join(available_metrics) if available_metrics else "None"}
Data available: {"Yes" if has_health_data else "No"}
Active protocols: {"Yes, " + str(len(context.get("active_protocols", []))) if has_active_protocols else "No"}
Key recommendation provided: {protocol_recommendation}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Return the protocol recommendation
    return {
        "protocol_recommendation": protocol_recommendation,
        "has_data": has_health_data,
        "has_active_protocols": has_active_protocols,
        "metadata": {
            "model": model_name,
            "health_goal": health_goal,
            "metrics_available": available_metrics,
            "time_frame": time_frame.value,
            "active_protocol_count": len(context.get("active_protocols", [])),
            "has_memory": ai_memory is not None,
            "request_datetime": current_datetime,
        },
    }


async def analyze_health_trends(
    db: Session, user_id: UUID, metric_type: str, time_period: TimeFrame = TimeFrame.LAST_MONTH, use_cache: bool = False
) -> Dict[str, Any]:
    """
    Analyze health trends for a specific metric using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        metric_type: Type of health metric to analyze
        time_period: Time period for analysis (e.g., TimeFrame.LAST_MONTH)
        use_cache: Whether to use cached responses

    Returns:
        Dictionary containing the trend analysis
    """
    # Get current datetime
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Check cache first if enabled
    if use_cache:
        query_hash = generate_query_hash(f"Analyze my {metric_type} trends", metric_types=[metric_type], time_period=time_period.value)
        cached_response = get_cached_response(
            db=db, user_id=user_id, endpoint="trend_analysis", time_frame=time_period.value, query_hash=query_hash
        )

        if cached_response:
            print(f"Using cached trend analysis for user {user_id}, metric {metric_type}, time_period {time_period.value}")
            return cached_response.response_data

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db,
        user_id=user_id,
        query=f"Analyze my {metric_type} trends for the {time_period.value}",
        metric_types=[metric_type],
        time_frame=time_period.value,
    )

    # Check if we have any health metrics data for the requested type
    has_health_data = bool(context["health_metrics"].get(metric_type, []))

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Create the trend analysis prompt
    trend_prompt = f"""
{SYSTEM_PROMPT}

Current Date and Time: {current_datetime}

{context_text}

{memory_context}

{"Provide a brief analysis of the trends in the user's " + metric_type + " data over the " + time_period.value.replace('_', ' ') + ". Limit your response to 3-5 sentences that highlight the most significant patterns or changes. Focus only on what's directly observable in the data." if has_health_data else "The user doesn't have any " + metric_type + " data for the " + time_period.value.replace('_', ' ') + ". In 1-2 sentences, acknowledge this and suggest what types of " + metric_type + " data would be helpful to collect."}
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        trend_prompt,
        generation_config={
            "temperature": 0.1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 300,  # Reduced from 1200 to encourage brevity
        },
    )

    # Extract the response text
    trend_analysis = response.text

    # Update AI memory with this interaction
    memory_summary = f"""
User requested: Analysis of {metric_type} trends for {time_period.value.replace('_', ' ')}
Data available: {"Yes" if has_health_data else "No"}
Key analysis provided: {trend_analysis}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Prepare response data
    response_data = {
        "trend_analysis": trend_analysis,
        "has_data": has_health_data,
        "metadata": {
            "model": model_name,
            "metric_type": metric_type,
            "time_period": time_period.value,
            "has_memory": ai_memory is not None,
            "cached": False,
            "request_datetime": current_datetime,
        },
    }

    # Cache the response if enabled
    if use_cache:
        query_hash = generate_query_hash(f"Analyze my {metric_type} trends", metric_types=[metric_type], time_period=time_period.value)
        create_cached_response(
            db=db,
            user_id=user_id,
            endpoint="trend_analysis",
            time_frame=time_period.value,
            query_hash=query_hash,
            response_data=response_data,
            metric_types=[metric_type],
            ttl_hours=24,  # Cache for 24 hours
        )

    # Return the trend analysis
    return response_data


# async def analyze_protocol_effectiveness(
#     db: Session, user_id: UUID, protocol_id: UUID, user_protocol_id: UUID, effectiveness_data: Dict[str, Any]
# ) -> Dict[str, Any]:
#     """
#     Analyze the effectiveness of a protocol using Gemini AI.

#     Args:
#         db: Database session
#         user_id: User ID
#         protocol_id: Protocol ID
#         user_protocol_id: User Protocol ID
#         effectiveness_data: Protocol effectiveness data

#     Returns:
#         Dictionary containing the analysis
#     """
#     # Get current datetime
#     current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
#     # Get protocol details
#     protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
#     if not protocol:
#         raise HTTPException(status_code=404, detail="Protocol not found")

#     # Get user protocol details
#     user_protocol = db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()
#     if not user_protocol:
#         raise HTTPException(status_code=404, detail="User protocol not found")

#     # Retrieve relevant context using RAG
#     context = retrieve_context_for_user(
#         db=db, user_id=user_id, query=f"Analyze the effectiveness of my {protocol.name} protocol", metric_types=protocol.target_metrics
#     )

#     # Format context for prompt
#     context_text = format_context_for_prompt(context)

#     # Get existing AI memory if available
#     ai_memory = get_ai_memory(db, user_id)
#     memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

#     # Format effectiveness data
#     effectiveness_text = "Protocol Effectiveness Data:\n"
#     for metric_type, data in effectiveness_data.items():
#         if metric_type != "overall":
#             effectiveness_text += f"- {metric_type.title()}:\n"
#             for key, value in data.items():
#                 if isinstance(value, (int, float)):
#                     effectiveness_text += f"  - {key}: {value:.2f}\n"
#                 else:
#                     effectiveness_text += f"  - {key}: {value}\n"

#     # Add overall effectiveness
#     if "overall" in effectiveness_data:
#         effectiveness_text += "- Overall:\n"
#         for key, value in effectiveness_data["overall"].items():
#             if isinstance(value, (int, float)):
#                 effectiveness_text += f"  - {key}: {value:.2f}\n"
#             else:
#                 effectiveness_text += f"  - {key}: {value}\n"

#     # Create the analysis prompt
#     analysis_prompt = f"""
# {SYSTEM_PROMPT}

# Current Date and Time: {current_datetime}

# {context_text}

# {memory_context}

# Protocol: {protocol.name}
# Description: {protocol.description}
# Target Metrics: {', '.join(protocol.target_metrics)}
# Duration Type: {protocol.duration_type}
# Duration Days: {protocol.duration_days if protocol.duration_days else 'Ongoing'}
# Start Date: {user_protocol.start_date}
# Status: {user_protocol.status}

# {effectiveness_text}

# Provide a concise analysis of this protocol's effectiveness. Limit your response to 3-5 sentences that highlight the most significant results and areas for improvement. Focus only on what's directly observable in the data.
# """

#     # Generate response from Gemini
#     model = genai.GenerativeModel(model_name)
#     response = await model.generate_content_async(
#         analysis_prompt,
#         generation_config={
#             "temperature": 0.2,
#             "top_p": 0.95,
#             "top_k": 40,
#             "max_output_tokens": 300,  # Reduced to encourage brevity
#         },
#     )

#     # Extract the response text
#     analysis = response.text

#     # Update AI memory with this interaction
#     memory_summary = f"""
# User requested: Analysis of {protocol.name} protocol effectiveness
# Protocol status: {user_protocol.status}
# Key analysis provided: {analysis}...
# """
#     create_or_update_ai_memory(db, user_id, memory_summary)

#     # Return the analysis
#     return {
#         "analysis": analysis,
#         "metadata": {
#             "model": model_name,
#             "protocol_name": protocol.name,
#             "protocol_id": str(protocol_id),
#             "user_protocol_id": str(user_protocol_id),
#             "has_memory": ai_memory is not None,
#             "request_datetime": current_datetime,
#         },
#     }


# async def generate_protocol_adjustments(
#     db: Session,
#     user_id: UUID,
#     protocol_id: UUID,
#     user_protocol_id: UUID,
#     effectiveness_data: Dict[str, Any],
#     recommendations_data: Dict[str, Any],
# ) -> Dict[str, Any]:
#     """
#     Generate protocol adjustments using Gemini AI.

#     Args:
#         db: Database session
#         user_id: User ID
#         protocol_id: Protocol ID
#         user_protocol_id: User Protocol ID
#         effectiveness_data: Protocol effectiveness data
#         recommendations_data: Protocol recommendations data

#     Returns:
#         Dictionary containing the protocol adjustments
#     """
#     # Get current datetime
#     current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
#     # Get protocol details
#     protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
#     if not protocol:
#         raise HTTPException(status_code=404, detail="Protocol not found")

#     # Get user protocol details
#     user_protocol = db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()
#     if not user_protocol:
#         raise HTTPException(status_code=404, detail="User protocol not found")

#     # Retrieve relevant context using RAG
#     context = retrieve_context_for_user(
#         db=db, user_id=user_id, query=f"Suggest adjustments for my {protocol.name} protocol", metric_types=protocol.target_metrics
#     )

#     # Format context for prompt
#     context_text = format_context_for_prompt(context)

#     # Get existing AI memory if available
#     ai_memory = get_ai_memory(db, user_id)
#     memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

#     # Format effectiveness data
#     effectiveness_text = "Protocol Effectiveness Data:\n"
#     for metric_type, data in effectiveness_data.items():
#         if metric_type != "overall":
#             effectiveness_text += f"- {metric_type.title()}:\n"
#             for key, value in data.items():
#                 if isinstance(value, (int, float)):
#                     effectiveness_text += f"  - {key}: {value:.2f}\n"
#                 else:
#                     effectiveness_text += f"  - {key}: {value}\n"

#     # Format recommendations data
#     recommendations_text = "Current Recommendations:\n"
#     for metric_type, recommendations in recommendations_data.items():
#         recommendations_text += f"- {metric_type.title()}:\n"
#         for recommendation in recommendations:
#             recommendations_text += f"  - {recommendation}\n"

#     # Create the adjustments prompt
#     adjustments_prompt = f"""
# {SYSTEM_PROMPT}

# Current Date and Time: {current_datetime}

# {context_text}

# {memory_context}

# Protocol: {protocol.name}
# Description: {protocol.description}
# Target Metrics: {', '.join(protocol.target_metrics)}
# Duration Type: {protocol.duration_type}
# Duration Days: {protocol.duration_days if protocol.duration_days else 'Ongoing'}
# Start Date: {user_protocol.start_date}
# Status: {user_protocol.status}

# {effectiveness_text}

# {recommendations_text}

# Provide 2-3 specific, actionable adjustments to improve this protocol based on the effectiveness data. Be direct and concise, focusing only on the most impactful changes. Each suggestion should be 1-2 sentences.
# """

#     # Generate response from Gemini
#     model = genai.GenerativeModel(model_name)
#     response = await model.generate_content_async(
#         adjustments_prompt,
#         generation_config={
#             "temperature": 0.3,
#             "top_p": 0.95,
#             "top_k": 40,
#             "max_output_tokens": 300,  # Reduced to encourage brevity
#         },
#     )

#     # Extract the response text
#     adjustments = response.text

#     # Update AI memory with this interaction
#     memory_summary = f"""
# User requested: Adjustments for {protocol.name} protocol
# Protocol status: {user_protocol.status}
# Key adjustments provided: {adjustments}...
# """
#     create_or_update_ai_memory(db, user_id, memory_summary)

#     # Return the adjustments
#     return {
#         "adjustments": adjustments,
#         "metadata": {
#             "model": model_name,
#             "protocol_name": protocol.name,
#             "protocol_id": str(protocol_id),
#             "user_protocol_id": str(user_protocol_id),
#             "has_memory": ai_memory is not None,
#             "request_datetime": current_datetime,
#         },
#     }

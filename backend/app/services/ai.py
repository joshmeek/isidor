import os
from typing import Any, Dict, List, Optional
from uuid import UUID

import google.generativeai as genai
from app.services.ai_memory import create_or_update_ai_memory, get_ai_memory
from app.services.ai_cache import generate_query_hash, get_cached_response, create_cached_response
from app.utils.rag import format_context_for_prompt, retrieve_context_for_user
from sqlalchemy.orm import Session

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
    time_frame: str = "last_day",
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Generate health insights using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        query: User's query about their health
        metric_types: Optional list of metric types to filter by
        update_memory: Whether to update the AI memory with this interaction
        time_frame: Time frame for the analysis (e.g., "last_day", "last_week")
        use_cache: Whether to use cached responses

    Returns:
        Dictionary containing the health insight
    """
    # Check cache first if enabled
    if use_cache:
        query_hash = generate_query_hash(query, metric_types, time_frame=time_frame)
        cached_response = get_cached_response(
            db=db,
            user_id=user_id,
            endpoint="health_insight",
            time_frame=time_frame,
            query_hash=query_hash
        )
        
        if cached_response:
            print(f"Using cached response for user {user_id}, time_frame {time_frame}")
            return cached_response.response_data

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db, 
        user_id=user_id, 
        query=query, 
        metric_types=metric_types,
        time_frame=time_frame
    )

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

The user has requested health insights for the {time_frame.replace('_', ' ')}, but there is no health data available.

{memory_context}

Provide a brief, 2-3 sentence response acknowledging the lack of data and suggesting what types of health data would be most valuable to track. Be direct and concise.
"""
    else:
        # Create the insight prompt with available health data
        if has_active_protocols:
            # User has active protocols, focus insights on those
            insight_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

{memory_context}

Based on the health data from the {time_frame.replace('_', ' ')} and active protocols provided, generate a concise health insight. Limit your response to 3-5 sentences that highlight the most significant patterns or trends related to the user's active protocols.

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

{context_text}

{memory_context}

Based on the health data from the {time_frame.replace('_', ' ')}, generate a concise health insight. Limit your response to 3-5 sentences that highlight the most significant patterns or trends. Focus only on objective observations from the data without making assumptions.

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
User requested: Health insights for {time_frame.replace('_', ' ')} for {', '.join(metric_types) if metric_types else 'all metrics'}
Key insight provided: {insight[:200]}...
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
            "time_frame": time_frame,
            "cached": False
        },
        "has_data": has_health_data
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
            ttl_hours=24  # Cache for 24 hours
        )

    # Return the insight
    return response_data


async def generate_protocol_recommendation(db: Session, user_id: UUID, health_goal: str, current_metrics: List[str]) -> Dict[str, Any]:
    """
    Generate a protocol recommendation using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        health_goal: User's health goal
        current_metrics: List of current metrics available

    Returns:
        Dictionary containing the protocol recommendation
    """
    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(db=db, user_id=user_id, query=health_goal, metric_types=current_metrics)

    # Check if we have any health metrics data for the requested types
    has_health_data = False
    available_metrics = []
    for metric_type in current_metrics:
        if context["health_metrics"].get(metric_type, []):
            has_health_data = True
            available_metrics.append(metric_type)

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Create the protocol recommendation prompt
    protocol_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

{memory_context}

User's Health Goal: {health_goal}
Available Metrics: {', '.join(current_metrics)}
Metrics with Data: {', '.join(available_metrics) if available_metrics else "None"}

{"Provide a concise protocol recommendation to help the user achieve their goal. Limit your response to 5-7 sentences that outline: (1) A clear objective, (2) Key metrics to track, (3) A suggested timeframe, and (4) How to measure progress. Be direct and specific." if has_health_data else "The user doesn't have relevant health data yet. In 2-3 sentences, suggest a basic protocol and what data they should start collecting to achieve their goal."}
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
Metrics requested: {', '.join(current_metrics)}
Data available: {"Yes, for " + ', '.join(available_metrics) if available_metrics else "No"}
Key recommendation provided: {protocol_recommendation[:200]}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Return the protocol recommendation
    return {
        "protocol_recommendation": protocol_recommendation,
        "has_data": has_health_data,
        "metadata": {
            "model": model_name,
            "health_goal": health_goal,
            "metrics_requested": current_metrics,
            "metrics_available": available_metrics,
            "has_memory": ai_memory is not None,
        },
    }


async def analyze_health_trends(
    db: Session, 
    user_id: UUID, 
    metric_type: str, 
    time_period: str = "last_month",
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Analyze health trends for a specific metric using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        metric_type: Type of health metric to analyze
        time_period: Time period for analysis
        use_cache: Whether to use cached responses

    Returns:
        Dictionary containing the trend analysis
    """
    # Check cache first if enabled
    if use_cache:
        query_hash = generate_query_hash(f"Analyze my {metric_type} trends", metric_types=[metric_type], time_period=time_period)
        cached_response = get_cached_response(
            db=db,
            user_id=user_id,
            endpoint="trend_analysis",
            time_frame=time_period,
            query_hash=query_hash
        )
        
        if cached_response:
            print(f"Using cached trend analysis for user {user_id}, metric {metric_type}, time_period {time_period}")
            return cached_response.response_data

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db, 
        user_id=user_id, 
        query=f"Analyze my {metric_type} trends for the {time_period}", 
        metric_types=[metric_type],
        time_frame=time_period
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

{context_text}

{memory_context}

{"Provide a brief analysis of the trends in the user's " + metric_type + " data over the " + time_period.replace('_', ' ') + ". Limit your response to 3-5 sentences that highlight the most significant patterns or changes. Focus only on what's directly observable in the data." if has_health_data else "The user doesn't have any " + metric_type + " data for the " + time_period.replace('_', ' ') + ". In 1-2 sentences, acknowledge this and suggest what types of " + metric_type + " data would be helpful to collect."}
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
User requested: Analysis of {metric_type} trends for {time_period.replace('_', ' ')}
Data available: {"Yes" if has_health_data else "No"}
Key analysis provided: {trend_analysis[:200]}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Prepare response data
    response_data = {
        "trend_analysis": trend_analysis,
        "has_data": has_health_data,
        "metadata": {
            "model": model_name, 
            "metric_type": metric_type, 
            "time_period": time_period, 
            "has_memory": ai_memory is not None,
            "cached": False
        },
    }
    
    # Cache the response if enabled
    if use_cache:
        query_hash = generate_query_hash(f"Analyze my {metric_type} trends", metric_types=[metric_type], time_period=time_period)
        create_cached_response(
            db=db,
            user_id=user_id,
            endpoint="trend_analysis",
            time_frame=time_period,
            query_hash=query_hash,
            response_data=response_data,
            metric_types=[metric_type],
            ttl_hours=24  # Cache for 24 hours
        )

    # Return the trend analysis
    return response_data


async def analyze_protocol_effectiveness(
    db: Session, user_id: UUID, protocol_id: UUID, user_protocol_id: UUID, effectiveness_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyze the effectiveness of a protocol using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        protocol_id: Protocol ID
        user_protocol_id: User Protocol ID
        effectiveness_data: Protocol effectiveness data

    Returns:
        Dictionary containing the analysis
    """
    # Get protocol details
    protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    # Get user protocol details
    user_protocol = db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db, user_id=user_id, query=f"Analyze the effectiveness of my {protocol.name} protocol", metric_types=protocol.target_metrics
    )

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Format effectiveness data
    effectiveness_text = "Protocol Effectiveness Data:\n"
    for metric_type, data in effectiveness_data.items():
        if metric_type != "overall":
            effectiveness_text += f"- {metric_type.title()}:\n"
            for key, value in data.items():
                if isinstance(value, (int, float)):
                    effectiveness_text += f"  - {key}: {value:.2f}\n"
                else:
                    effectiveness_text += f"  - {key}: {value}\n"

    # Add overall effectiveness
    if "overall" in effectiveness_data:
        effectiveness_text += "- Overall:\n"
        for key, value in effectiveness_data["overall"].items():
            if isinstance(value, (int, float)):
                effectiveness_text += f"  - {key}: {value:.2f}\n"
            else:
                effectiveness_text += f"  - {key}: {value}\n"

    # Create the analysis prompt
    analysis_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

{memory_context}

Protocol: {protocol.name}
Description: {protocol.description}
Target Metrics: {', '.join(protocol.target_metrics)}
Duration Type: {protocol.duration_type}
Duration Days: {protocol.duration_days if protocol.duration_days else 'Ongoing'}
Start Date: {user_protocol.start_date}
Status: {user_protocol.status}

{effectiveness_text}

Provide a concise analysis of this protocol's effectiveness. Limit your response to 3-5 sentences that highlight the most significant results and areas for improvement. Focus only on what's directly observable in the data.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        analysis_prompt,
        generation_config={
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 300,  # Reduced to encourage brevity
        },
    )

    # Extract the response text
    analysis = response.text

    # Update AI memory with this interaction
    memory_summary = f"""
User requested: Analysis of {protocol.name} protocol effectiveness
Protocol status: {user_protocol.status}
Key analysis provided: {analysis[:200]}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Return the analysis
    return {
        "analysis": analysis,
        "metadata": {
            "model": model_name,
            "protocol_name": protocol.name,
            "protocol_id": str(protocol_id),
            "user_protocol_id": str(user_protocol_id),
            "has_memory": ai_memory is not None,
        },
    }


async def generate_protocol_adjustments(
    db: Session,
    user_id: UUID,
    protocol_id: UUID,
    user_protocol_id: UUID,
    effectiveness_data: Dict[str, Any],
    recommendations_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate protocol adjustments using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        protocol_id: Protocol ID
        user_protocol_id: User Protocol ID
        effectiveness_data: Protocol effectiveness data
        recommendations_data: Protocol recommendations data

    Returns:
        Dictionary containing the protocol adjustments
    """
    # Get protocol details
    protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    # Get user protocol details
    user_protocol = db.query(UserProtocol).filter(UserProtocol.id == user_protocol_id).first()
    if not user_protocol:
        raise HTTPException(status_code=404, detail="User protocol not found")

    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db, user_id=user_id, query=f"Suggest adjustments for my {protocol.name} protocol", metric_types=protocol.target_metrics
    )

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Format effectiveness data
    effectiveness_text = "Protocol Effectiveness Data:\n"
    for metric_type, data in effectiveness_data.items():
        if metric_type != "overall":
            effectiveness_text += f"- {metric_type.title()}:\n"
            for key, value in data.items():
                if isinstance(value, (int, float)):
                    effectiveness_text += f"  - {key}: {value:.2f}\n"
                else:
                    effectiveness_text += f"  - {key}: {value}\n"

    # Format recommendations data
    recommendations_text = "Current Recommendations:\n"
    for metric_type, recommendations in recommendations_data.items():
        recommendations_text += f"- {metric_type.title()}:\n"
        for recommendation in recommendations:
            recommendations_text += f"  - {recommendation}\n"

    # Create the adjustments prompt
    adjustments_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

{memory_context}

Protocol: {protocol.name}
Description: {protocol.description}
Target Metrics: {', '.join(protocol.target_metrics)}
Duration Type: {protocol.duration_type}
Duration Days: {protocol.duration_days if protocol.duration_days else 'Ongoing'}
Start Date: {user_protocol.start_date}
Status: {user_protocol.status}

{effectiveness_text}

{recommendations_text}

Provide 2-3 specific, actionable adjustments to improve this protocol based on the effectiveness data. Be direct and concise, focusing only on the most impactful changes. Each suggestion should be 1-2 sentences.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        adjustments_prompt,
        generation_config={
            "temperature": 0.3,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 300,  # Reduced to encourage brevity
        },
    )

    # Extract the response text
    adjustments = response.text

    # Update AI memory with this interaction
    memory_summary = f"""
User requested: Adjustments for {protocol.name} protocol
Protocol status: {user_protocol.status}
Key adjustments provided: {adjustments[:200]}...
"""
    create_or_update_ai_memory(db, user_id, memory_summary)

    # Return the adjustments
    return {
        "adjustments": adjustments,
        "metadata": {
            "model": model_name,
            "protocol_name": protocol.name,
            "protocol_id": str(protocol_id),
            "user_protocol_id": str(user_protocol_id),
            "has_memory": ai_memory is not None,
        },
    }

import os
from typing import Any, Dict, List, Optional
from uuid import UUID

import google.generativeai as genai
from app.services.ai_memory import create_or_update_ai_memory, get_ai_memory
from app.utils.rag import format_context_for_prompt, retrieve_context_for_user
from sqlalchemy.orm import Session

# Configure the Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

# System prompt template
SYSTEM_PROMPT = """
You are Isidor, an AI health assistant designed to provide personalized health insights and protocol recommendations.

Your core principles:
1. Present objective, research-backed insights without being prescriptive
2. Respect user autonomy - provide information, not commands
3. Focus on patterns and correlations in health data
4. Maintain a supportive, non-judgmental tone
5. Prioritize privacy and data security

When analyzing health data:
- Look for patterns and correlations between metrics
- Identify potential areas for optimization
- Reference relevant scientific research
- Present insights as observations, not directives
- Acknowledge limitations in the data

Remember: You are not providing medical advice. You are helping users understand their own health data patterns.
"""


async def generate_health_insight(
    db: Session, user_id: UUID, query: str, metric_types: Optional[List[str]] = None, update_memory: bool = True
) -> Dict[str, Any]:
    """
    Generate a health insight using Gemini AI with RAG.

    Args:
        db: Database session
        user_id: User ID
        query: User query
        metric_types: Optional list of metric types to include in context
        update_memory: Whether to update AI memory with the response

    Returns:
        Dictionary containing the response and metadata
    """
    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(db=db, user_id=user_id, query=query, metric_types=metric_types)

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Get existing AI memory if available
    ai_memory = get_ai_memory(db, user_id)
    memory_context = f"Previous Context: {ai_memory.summary}" if ai_memory else ""

    # Create the full prompt
    user_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

User Query: {query}

{memory_context}

Please provide an objective, research-backed insight based on the available health data.
Focus on patterns, correlations, and potential optimizations without being prescriptive.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        user_prompt,
        generation_config={
            "temperature": 0.2,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1024,
        },
    )

    # Extract the response text
    response_text = response.text

    # Update AI memory if requested
    if update_memory:
        # Create a summary of the interaction for memory
        memory_summary = f"""
User asked: {query}
Key health metrics analyzed: {', '.join(context['health_metrics'].keys()) if context['health_metrics'] else 'None'}
Key insight provided: {response_text[:200]}...
"""
        # Update or create AI memory
        create_or_update_ai_memory(db, user_id, memory_summary)

    # Return the response and metadata
    return {
        "response": response_text,
        "metadata": {
            "model": model_name,
            "metrics_analyzed": list(context["health_metrics"].keys()) if context["health_metrics"] else [],
            "memory_updated": update_memory,
        },
    }


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

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Create the protocol recommendation prompt
    protocol_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

User's Health Goal: {health_goal}
Available Metrics: {', '.join(current_metrics)}

Please recommend a health protocol that would help the user achieve their goal.
The protocol should include:
1. A clear objective aligned with the user's goal
2. Key metrics to track
3. A suggested duration
4. Expected outcomes
5. How progress will be measured

Remember to be objective and research-backed without being prescriptive.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        protocol_prompt,
        generation_config={
            "temperature": 0.3,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1500,
        },
    )

    # Extract the response text
    protocol_recommendation = response.text

    # Return the protocol recommendation
    return {
        "protocol_recommendation": protocol_recommendation,
        "metadata": {"model": model_name, "health_goal": health_goal, "metrics_considered": current_metrics},
    }


async def analyze_health_trends(db: Session, user_id: UUID, metric_type: str, time_period: str = "last_month") -> Dict[str, Any]:
    """
    Analyze health trends for a specific metric using Gemini AI.

    Args:
        db: Database session
        user_id: User ID
        metric_type: Type of health metric to analyze
        time_period: Time period for analysis

    Returns:
        Dictionary containing the trend analysis
    """
    # Retrieve relevant context using RAG
    context = retrieve_context_for_user(
        db=db, user_id=user_id, query=f"Analyze my {metric_type} trends for the {time_period}", metric_types=[metric_type]
    )

    # Format context for prompt
    context_text = format_context_for_prompt(context)

    # Create the trend analysis prompt
    trend_prompt = f"""
{SYSTEM_PROMPT}

{context_text}

Please analyze the trends in the user's {metric_type} data over the {time_period}.
Focus on:
1. Overall patterns and changes
2. Potential correlations with other factors
3. Areas for potential optimization
4. Comparison to research-backed optimal ranges
5. Objective insights without prescriptive advice

Provide a comprehensive analysis based on the available data.
"""

    # Generate response from Gemini
    model = genai.GenerativeModel(model_name)
    response = await model.generate_content_async(
        trend_prompt,
        generation_config={
            "temperature": 0.1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1200,
        },
    )

    # Extract the response text
    trend_analysis = response.text

    # Return the trend analysis
    return {"trend_analysis": trend_analysis, "metadata": {"model": model_name, "metric_type": metric_type, "time_period": time_period}}

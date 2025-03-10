import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.ai_memory import AICachedResponse
from sqlalchemy import and_
from sqlalchemy.orm import Session


def generate_query_hash(query: str, metric_types: Optional[List[str]] = None, **kwargs) -> str:
    """
    Generate a hash for a query and its parameters to use as a cache key.
    
    Args:
        query: The query string
        metric_types: Optional list of metric types
        **kwargs: Additional parameters to include in the hash
        
    Returns:
        A hash string representing the query and its parameters
    """
    # Create a dictionary of all parameters
    params = {
        "query": query,
        "metric_types": sorted(metric_types) if metric_types else None,
        **kwargs
    }
    
    # Convert to a stable JSON string
    params_json = json.dumps(params, sort_keys=True)
    
    # Generate hash
    return hashlib.md5(params_json.encode()).hexdigest()


def get_cached_response(
    db: Session, 
    user_id: UUID, 
    endpoint: str, 
    time_frame: str,
    query_hash: str
) -> Optional[AICachedResponse]:
    """
    Get a cached response if it exists and is not expired.
    
    Args:
        db: Database session
        user_id: User ID
        endpoint: The endpoint name (e.g., "health_insight")
        time_frame: The time frame (e.g., "last_day", "last_week")
        query_hash: Hash of the query and parameters
        
    Returns:
        The cached response if found and not expired, None otherwise
    """
    now = datetime.utcnow()
    
    return db.query(AICachedResponse).filter(
        and_(
            AICachedResponse.user_id == user_id,
            AICachedResponse.endpoint == endpoint,
            AICachedResponse.time_frame == time_frame,
            AICachedResponse.query_hash == query_hash,
            AICachedResponse.expires_at > now
        )
    ).first()


def create_cached_response(
    db: Session,
    user_id: UUID,
    endpoint: str,
    time_frame: str,
    query_hash: str,
    response_data: Dict[str, Any],
    metric_types: Optional[List[str]] = None,
    ttl_hours: int = 24
) -> AICachedResponse:
    """
    Create a new cached response.
    
    Args:
        db: Database session
        user_id: User ID
        endpoint: The endpoint name (e.g., "health_insight")
        time_frame: The time frame (e.g., "last_day", "last_week")
        query_hash: Hash of the query and parameters
        response_data: The response data to cache
        metric_types: Optional list of metric types included in the request
        ttl_hours: Time-to-live in hours (default: 24 hours)
        
    Returns:
        The created cached response
    """
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=ttl_hours)
    
    # Create new cache entry
    cached_response = AICachedResponse(
        user_id=user_id,
        endpoint=endpoint,
        time_frame=time_frame,
        query_hash=query_hash,
        response_data=response_data,
        expires_at=expires_at,
        metric_types=metric_types
    )
    
    db.add(cached_response)
    db.commit()
    db.refresh(cached_response)
    
    return cached_response


def invalidate_cached_responses(
    db: Session,
    user_id: UUID,
    endpoint: Optional[str] = None,
    time_frame: Optional[str] = None
) -> int:
    """
    Invalidate cached responses for a user.
    
    Args:
        db: Database session
        user_id: User ID
        endpoint: Optional endpoint to filter by
        time_frame: Optional time frame to filter by
        
    Returns:
        Number of invalidated cache entries
    """
    query = db.query(AICachedResponse).filter(AICachedResponse.user_id == user_id)
    
    if endpoint:
        query = query.filter(AICachedResponse.endpoint == endpoint)
    
    if time_frame:
        query = query.filter(AICachedResponse.time_frame == time_frame)
    
    # Set expiration to now to invalidate
    now = datetime.utcnow()
    count = query.update({"expires_at": now})
    
    db.commit()
    return count 
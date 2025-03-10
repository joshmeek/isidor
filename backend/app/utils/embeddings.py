import json
import os
from typing import Any, Dict, List, Optional, Union

import numpy as np
from app.core.config import settings
from sentence_transformers import SentenceTransformer

# Initialize the embedding model
model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
embedding_dimension = int(os.getenv("EMBEDDING_DIMENSION", "384"))
model = SentenceTransformer(model_name)


def generate_embedding(text: str) -> List[float]:
    """Generate an embedding vector for a given text."""
    embedding = model.encode(text)
    return embedding.tolist()


def generate_health_metric_embedding(metric_type: str, value: Dict[str, Any], source: str) -> List[float]:
    """Generate an embedding for a health metric by combining its metadata and values."""
    # Create a textual representation of the health metric
    text_parts = [f"Metric type: {metric_type}", f"Source: {source}"]

    # Add key-value pairs from the value dictionary
    for key, val in value.items():
        if isinstance(val, (dict, list)):
            # For nested structures, convert to string
            val_str = json.dumps(val)
        else:
            val_str = str(val)
        text_parts.append(f"{key}: {val_str}")

    # Join all parts into a single text
    text = " ".join(text_parts)

    # Generate and return the embedding
    return generate_embedding(text)


def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """Calculate cosine similarity between two embeddings."""
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)

    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    return dot_product / (norm1 * norm2)


def format_vector_for_postgres(embedding: List[float]) -> str:
    """
    Format a vector for PostgreSQL pgvector insertion.

    Args:
        embedding: List of float values representing the embedding

    Returns:
        String formatted for PostgreSQL vector type
    """
    # Return the embedding as a list of floats, not as a string
    # This will be properly cast to a vector by SQLAlchemy
    return embedding


def normalize_vector(embedding: List[float]) -> List[float]:
    """
    Normalize a vector to unit length for improved similarity search.

    Args:
        embedding: List of float values representing the embedding

    Returns:
        Normalized embedding vector
    """
    vec = np.array(embedding)
    norm = np.linalg.norm(vec)
    if norm > 0:
        normalized = vec / norm
        return normalized.tolist()
    return embedding


def euclidean_distance(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Calculate Euclidean distance between two embeddings.

    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector

    Returns:
        Euclidean distance (lower means more similar)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return np.linalg.norm(vec1 - vec2)


def dot_product(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Calculate dot product between two embeddings.

    Args:
        embedding1: First embedding vector
        embedding2: Second embedding vector

    Returns:
        Dot product (higher means more similar)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return np.dot(vec1, vec2)

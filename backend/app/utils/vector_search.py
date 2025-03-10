from typing import Any, Dict, List, Optional, Tuple, Union
from uuid import UUID

from app.utils.embeddings import format_vector_for_postgres, normalize_vector
from sqlalchemy import Column, Float, String, Table, and_, func, select, text
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select


def create_vector_index(db: Session, table_name: str, column_name: str, index_type: str = "hnsw") -> None:
    """
    Create a vector index on a table column.

    Args:
        db: Database session
        table_name: Name of the table
        column_name: Name of the vector column
        index_type: Type of index (hnsw or ivfflat)
    """
    if index_type == "hnsw":
        # HNSW index is better for high recall and is faster
        index_name = f"idx_{table_name}_{column_name}_hnsw"
        sql = f"""
        CREATE INDEX IF NOT EXISTS {index_name} 
        ON {table_name} 
        USING hnsw ({column_name} vector_l2_ops)
        WITH (m = 16, ef_construction = 64);
        """
    else:
        # IVFFlat index is better for larger datasets
        index_name = f"idx_{table_name}_{column_name}_ivfflat"
        sql = f"""
        CREATE INDEX IF NOT EXISTS {index_name} 
        ON {table_name} 
        USING ivfflat ({column_name} vector_l2_ops)
        WITH (lists = 100);
        """

    db.execute(text(sql))
    db.commit()


def vector_similarity_search(
    db: Session,
    table_name: str,
    column_name: str,
    query_vector: List[float],
    filter_conditions: Optional[Dict[str, Any]] = None,
    limit: int = 10,
    distance_type: str = "cosine",
    max_distance: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Perform a vector similarity search on a table.

    Args:
        db: Database session
        table_name: Name of the table
        column_name: Name of the vector column
        query_vector: Query vector
        filter_conditions: Additional filter conditions
        limit: Maximum number of results
        distance_type: Type of distance (cosine, l2, or inner)
        max_distance: Maximum distance threshold

    Returns:
        List of matching records with similarity scores
    """
    # Normalize the query vector for cosine similarity
    if distance_type == "cosine":
        query_vector = normalize_vector(query_vector)

    # Format the vector for PostgreSQL
    vector_str = format_vector_for_postgres(query_vector)

    # Choose the appropriate distance operator
    if distance_type == "cosine":
        # Cosine distance (1 - cosine similarity)
        distance_op = "<->"
    elif distance_type == "l2":
        # Euclidean distance
        distance_op = "<->"
    else:
        # Inner product (negative dot product, so smaller is better)
        distance_op = "<#>"

    # Build the SQL query
    sql = f"""
    SELECT *, ({column_name} {distance_op} '{vector_str}'::vector) AS distance
    FROM {table_name}
    """

    # Add filter conditions if provided
    if filter_conditions:
        where_clauses = []
        for column, value in filter_conditions.items():
            if isinstance(value, str):
                where_clauses.append(f"{column} = '{value}'")
            elif isinstance(value, UUID):
                where_clauses.append(f"{column} = '{value}'")
            elif isinstance(value, (int, float)):
                where_clauses.append(f"{column} = {value}")
            elif value is None:
                where_clauses.append(f"{column} IS NULL")

        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)

    # Add distance threshold if provided
    if max_distance is not None:
        if "WHERE" in sql:
            sql += f" AND ({column_name} {distance_op} '{vector_str}'::vector) < {max_distance}"
        else:
            sql += f" WHERE ({column_name} {distance_op} '{vector_str}'::vector) < {max_distance}"

    # Add order by and limit
    sql += f"""
    ORDER BY distance
    LIMIT {limit}
    """

    # Execute the query
    result = db.execute(text(sql))

    # Convert to list of dictionaries
    return [dict(row._mapping) for row in result]


def batch_vector_insert(db: Session, table_name: str, records: List[Dict[str, Any]], vector_column: str, normalize: bool = True) -> None:
    """
    Insert multiple records with vector embeddings in batch.

    Args:
        db: Database session
        table_name: Name of the table
        records: List of records to insert
        vector_column: Name of the vector column
        normalize: Whether to normalize vectors before insertion
    """
    if not records:
        return

    # Prepare the records
    for record in records:
        if vector_column in record and normalize:
            record[vector_column] = normalize_vector(record[vector_column])

    # Get the column names from the first record
    columns = list(records[0].keys())

    # Build the INSERT statement
    columns_str = ", ".join(columns)
    placeholders = ", ".join([f":{col}" for col in columns])

    sql = f"""
    INSERT INTO {table_name} ({columns_str})
    VALUES ({placeholders})
    """

    # Execute the batch insert
    db.execute(text(sql), records)
    db.commit()


def update_vector_embeddings(
    db: Session, table_name: str, id_column: str, vector_column: str, records: List[Dict[str, Any]], normalize: bool = True
) -> None:
    """
    Update vector embeddings for existing records.

    Args:
        db: Database session
        table_name: Name of the table
        id_column: Name of the ID column
        vector_column: Name of the vector column
        records: List of records with IDs and new embeddings
        normalize: Whether to normalize vectors before update
    """
    if not records:
        return

    for record in records:
        record_id = record.get(id_column)
        embedding = record.get(vector_column)

        if record_id is None or embedding is None:
            continue

        if normalize:
            embedding = normalize_vector(embedding)

        vector_str = format_vector_for_postgres(embedding)

        sql = f"""
        UPDATE {table_name}
        SET {vector_column} = '{vector_str}'::vector
        WHERE {id_column} = :record_id
        """

        db.execute(text(sql), {"record_id": record_id})

    db.commit()


def vector_aggregate_query(
    db: Session, table_name: str, vector_column: str, group_by_column: str, filter_conditions: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Perform an aggregation query on vector data.

    Args:
        db: Database session
        table_name: Name of the table
        vector_column: Name of the vector column
        group_by_column: Column to group by
        filter_conditions: Additional filter conditions

    Returns:
        List of aggregated vectors by group
    """
    # Build the SQL query
    sql = f"""
    SELECT 
        {group_by_column},
        AVG({vector_column}::float[]) AS avg_vector,
        COUNT(*) AS count
    FROM {table_name}
    """

    # Add filter conditions if provided
    if filter_conditions:
        where_clauses = []
        for column, value in filter_conditions.items():
            if isinstance(value, str):
                where_clauses.append(f"{column} = '{value}'")
            elif isinstance(value, UUID):
                where_clauses.append(f"{column} = '{value}'")
            elif isinstance(value, (int, float)):
                where_clauses.append(f"{column} = {value}")
            elif value is None:
                where_clauses.append(f"{column} IS NULL")

        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)

    # Add group by
    sql += f"""
    GROUP BY {group_by_column}
    """

    # Execute the query
    result = db.execute(text(sql))

    # Convert to list of dictionaries
    return [dict(row._mapping) for row in result]

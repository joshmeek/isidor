"""Add vector indexes

Revision ID: 003_add_vector_indexes
Revises: 002_add_pgcrypto
Create Date: 2025-03-10 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_vector_indexes"
down_revision: Union[str, None] = "002_add_pgcrypto"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create HNSW index on health_metrics.embedding
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_health_metrics_embedding_hnsw 
    ON health_metrics 
    USING hnsw (embedding vector_l2_ops)
    WITH (m = 16, ef_construction = 64);
    """
    )

    # Create HNSW index on ai_memory.embedding
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding_hnsw 
    ON ai_memory 
    USING hnsw (embedding vector_l2_ops)
    WITH (m = 16, ef_construction = 64);
    """
    )

    # Add a B-tree index on health_metrics.metric_type for faster filtering
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_type
    ON health_metrics
    USING btree (metric_type);
    """
    )

    # Add a B-tree index on health_metrics.date for faster date range queries
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_health_metrics_date
    ON health_metrics
    USING btree (date);
    """
    )

    # Add a B-tree index on health_metrics.user_id for faster user filtering
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id
    ON health_metrics
    USING btree (user_id);
    """
    )

    # Add a B-tree index on ai_memory.user_id for faster user filtering
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id
    ON ai_memory
    USING btree (user_id);
    """
    )

    # Add a B-tree index on ai_memory.last_updated for faster recency queries
    op.execute(
        """
    CREATE INDEX IF NOT EXISTS idx_ai_memory_last_updated
    ON ai_memory
    USING btree (last_updated);
    """
    )


def downgrade() -> None:
    # Drop the indexes
    op.execute("DROP INDEX IF EXISTS idx_health_metrics_embedding_hnsw;")
    op.execute("DROP INDEX IF EXISTS idx_ai_memory_embedding_hnsw;")
    op.execute("DROP INDEX IF EXISTS idx_health_metrics_metric_type;")
    op.execute("DROP INDEX IF EXISTS idx_health_metrics_date;")
    op.execute("DROP INDEX IF EXISTS idx_health_metrics_user_id;")
    op.execute("DROP INDEX IF EXISTS idx_ai_memory_user_id;")
    op.execute("DROP INDEX IF EXISTS idx_ai_memory_last_updated;")

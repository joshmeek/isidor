"""Add AI cached responses table

Revision ID: 004
Revises: 003_add_vector_indexes
Create Date: 2024-03-10 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003_add_vector_indexes'
branch_labels = None
depends_on = None


def upgrade():
    # Create ai_cached_responses table
    op.create_table(
        'ai_cached_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('time_frame', sa.String(), nullable=False),
        sa.Column('query_hash', sa.String(), nullable=False),
        sa.Column('response_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('metric_types', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id, endpoint, time_frame, and query_hash for faster lookups
    op.create_index(
        'ix_ai_cached_responses_lookup', 
        'ai_cached_responses', 
        ['user_id', 'endpoint', 'time_frame', 'query_hash']
    )
    
    # Create index on expires_at for faster cleanup of expired entries
    op.create_index(
        'ix_ai_cached_responses_expires_at', 
        'ai_cached_responses', 
        ['expires_at']
    )


def downgrade():
    # Drop indexes
    op.drop_index('ix_ai_cached_responses_expires_at', table_name='ai_cached_responses')
    op.drop_index('ix_ai_cached_responses_lookup', table_name='ai_cached_responses')
    
    # Drop table
    op.drop_table('ai_cached_responses') 
"""Fix AI memory table by adding version_num column

Revision ID: 005
Revises: 004
Create Date: 2024-03-10 20:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Add version_num column to ai_memory table with default value of 1
    op.add_column('ai_memory', sa.Column('version_num', sa.Integer(), server_default='1', nullable=False))
    
    # Create index on version_num for faster ordering
    op.create_index('ix_ai_memory_version_num', 'ai_memory', ['version_num'])


def downgrade():
    # Drop index
    op.drop_index('ix_ai_memory_version_num', table_name='ai_memory')
    
    # Drop column
    op.drop_column('ai_memory', 'version_num') 
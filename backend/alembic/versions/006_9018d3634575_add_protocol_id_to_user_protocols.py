"""add_protocol_id_to_user_protocols

Revision ID: 9018d3634575
Revises: 006_add_protocol_models
Create Date: 2025-03-11 15:08:04.263084

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '9018d3634575'
down_revision = '006_add_protocol_models'
branch_labels = None
depends_on = None


def upgrade():
    # Add protocol_id column to user_protocols table
    op.add_column('user_protocols', sa.Column('protocol_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_user_protocols_protocol_id', 
        'user_protocols', 'protocols', 
        ['protocol_id'], ['id']
    )


def downgrade():
    # Drop foreign key constraint
    op.drop_constraint('fk_user_protocols_protocol_id', 'user_protocols', type_='foreignkey')
    
    # Drop protocol_id column
    op.drop_column('user_protocols', 'protocol_id') 
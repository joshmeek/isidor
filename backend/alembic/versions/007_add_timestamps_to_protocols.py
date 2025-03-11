"""Add timestamps to protocols table

Revision ID: 007_add_timestamps_to_protocols
Revises: 9018d3634575
Create Date: 2025-03-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_add_timestamps_to_protocols'
down_revision = '9018d3634575'
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at and updated_at columns to protocols table
    op.add_column('protocols', sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    op.add_column('protocols', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    
    # Add trigger to automatically update updated_at column
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """)
    
    op.execute("""
    CREATE TRIGGER update_protocols_updated_at
    BEFORE UPDATE ON protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade():
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS update_protocols_updated_at ON protocols;")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop columns
    op.drop_column('protocols', 'updated_at')
    op.drop_column('protocols', 'created_at') 
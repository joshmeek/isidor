"""Add protocol models

Revision ID: 006_add_protocol_models
Revises: 005
Create Date: 2023-03-11 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect, text
import uuid

# revision identifiers, used by Alembic.
revision = '006_add_protocol_models'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    # Create protocol_check_ins table
    op.create_table(
        'protocol_check_ins',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('protocol_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metrics', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(), nullable=False, server_default='completed'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create indexes for protocol_check_ins
    op.create_index(op.f('ix_protocol_check_ins_protocol_id'), 'protocol_check_ins', ['protocol_id'], unique=False)
    op.create_index(op.f('ix_protocol_check_ins_date'), 'protocol_check_ins', ['date'], unique=False)
    
    # Handle user_protocols table transformation
    if 'user_protocols' in tables:
        # Backup existing data
        conn.execute(text("CREATE TABLE user_protocols_backup AS SELECT * FROM user_protocols"))
        
        # Drop existing foreign keys and indexes
        op.drop_constraint('user_protocols_protocol_id_fkey', 'user_protocols', type_='foreignkey')
        op.drop_constraint('user_protocols_user_id_fkey', 'user_protocols', type_='foreignkey')
        op.drop_index('ix_user_protocols_protocol_id', table_name='user_protocols')
        op.drop_index('ix_user_protocols_user_id', table_name='user_protocols')
        
        # Keep the id and user_id as UUID type for compatibility
        # Add new columns
        op.add_column('user_protocols', sa.Column('name', sa.String(), nullable=True))
        op.add_column('user_protocols', sa.Column('description', sa.Text(), nullable=True))
        op.add_column('user_protocols', sa.Column('template_id', sa.String(), nullable=True))
        op.add_column('user_protocols', sa.Column('target_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=True))
        op.add_column('user_protocols', sa.Column('custom_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True))
        op.add_column('user_protocols', sa.Column('steps', postgresql.JSON(astext_type=sa.Text()), nullable=True))
        op.add_column('user_protocols', sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=True))
        op.add_column('user_protocols', sa.Column('expected_outcomes', postgresql.JSON(astext_type=sa.Text()), nullable=True))
        op.add_column('user_protocols', sa.Column('category', sa.String(), nullable=True))
        op.add_column('user_protocols', sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
        op.add_column('user_protocols', sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()))
        
        # Change start_date and end_date from Date to DateTime
        op.execute(text("ALTER TABLE user_protocols ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::timestamp"))
        op.execute(text("ALTER TABLE user_protocols ALTER COLUMN end_date TYPE TIMESTAMP USING end_date::timestamp"))
        
        # Drop protocol_id column (we'll handle this relationship differently)
        op.drop_column('user_protocols', 'protocol_id')
        
        # Update existing rows with default values
        op.execute(text("UPDATE user_protocols SET name = 'Migrated Protocol', target_metrics = '[]', custom_fields = '{}', steps = '[]', recommendations = '[]', expected_outcomes = '[]'"))
        
        # Set NOT NULL constraints after data migration
        op.alter_column('user_protocols', 'name', nullable=False)
        op.alter_column('user_protocols', 'target_metrics', nullable=False, server_default=sa.text("'[]'"))
        op.alter_column('user_protocols', 'custom_fields', nullable=False, server_default=sa.text("'{}'"))
        op.alter_column('user_protocols', 'steps', nullable=False, server_default=sa.text("'[]'"))
        op.alter_column('user_protocols', 'recommendations', nullable=False, server_default=sa.text("'[]'"))
        op.alter_column('user_protocols', 'expected_outcomes', nullable=False, server_default=sa.text("'[]'"))
        
        # Create new indexes
        op.create_index(op.f('ix_user_protocols_user_id'), 'user_protocols', ['user_id'], unique=False)
        op.create_index(op.f('ix_user_protocols_status'), 'user_protocols', ['status'], unique=False)
        op.create_index(op.f('ix_user_protocols_template_id'), 'user_protocols', ['template_id'], unique=False)
        
        # Add foreign key constraint for user_id (keeping the UUID type)
        op.create_foreign_key('user_protocols_user_id_fkey', 'user_protocols', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        
        # Add foreign key constraint for protocol_check_ins
        op.create_foreign_key('protocol_check_ins_protocol_id_fkey', 'protocol_check_ins', 'user_protocols', ['protocol_id'], ['id'], ondelete='CASCADE')
    else:
        # If user_protocols doesn't exist, create it from scratch
        op.create_table(
            'user_protocols',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('start_date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('end_date', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(), nullable=False, server_default='active'),
            sa.Column('template_id', sa.String(), nullable=True),
            sa.Column('target_metrics', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
            sa.Column('custom_fields', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
            sa.Column('steps', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
            sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
            sa.Column('expected_outcomes', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
            sa.Column('category', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        
        # Create indexes
        op.create_index(op.f('ix_user_protocols_user_id'), 'user_protocols', ['user_id'], unique=False)
        op.create_index(op.f('ix_user_protocols_status'), 'user_protocols', ['status'], unique=False)
        op.create_index(op.f('ix_user_protocols_template_id'), 'user_protocols', ['template_id'], unique=False)
        
        # Add foreign key constraint for protocol_check_ins
        op.create_foreign_key('protocol_check_ins_protocol_id_fkey', 'protocol_check_ins', 'user_protocols', ['protocol_id'], ['id'], ondelete='CASCADE')


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    # Drop protocol_check_ins table
    if 'protocol_check_ins' in tables:
        op.drop_constraint('protocol_check_ins_protocol_id_fkey', 'protocol_check_ins', type_='foreignkey')
        op.drop_index(op.f('ix_protocol_check_ins_date'), table_name='protocol_check_ins')
        op.drop_index(op.f('ix_protocol_check_ins_protocol_id'), table_name='protocol_check_ins')
        op.drop_table('protocol_check_ins')
    
    # Check if we have a backup table to restore from
    if 'user_protocols_backup' in tables:
        # Drop the current user_protocols table
        op.drop_constraint('user_protocols_user_id_fkey', 'user_protocols', type_='foreignkey')
        op.drop_index(op.f('ix_user_protocols_template_id'), table_name='user_protocols')
        op.drop_index(op.f('ix_user_protocols_status'), table_name='user_protocols')
        op.drop_index(op.f('ix_user_protocols_user_id'), table_name='user_protocols')
        op.drop_table('user_protocols')
        
        # Restore from backup
        op.execute(text("CREATE TABLE user_protocols AS SELECT * FROM user_protocols_backup"))
        
        # Recreate indexes and constraints
        op.create_index('ix_user_protocols_user_id', 'user_protocols', ['user_id'], unique=False)
        op.create_index('ix_user_protocols_protocol_id', 'user_protocols', ['protocol_id'], unique=False)
        op.create_foreign_key('user_protocols_user_id_fkey', 'user_protocols', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        op.create_foreign_key('user_protocols_protocol_id_fkey', 'user_protocols', 'protocols', ['protocol_id'], ['id'], ondelete='CASCADE')
        
        # Drop the backup table
        op.drop_table('user_protocols_backup')
    elif 'user_protocols' in tables:
        # If we don't have a backup but have the new table, just drop the new columns
        columns = [c['name'] for c in inspector.get_columns('user_protocols')]
        
        # Drop the foreign key constraint
        op.drop_constraint('user_protocols_user_id_fkey', 'user_protocols', type_='foreignkey')
        
        # Drop indexes
        op.drop_index(op.f('ix_user_protocols_template_id'), table_name='user_protocols')
        op.drop_index(op.f('ix_user_protocols_status'), table_name='user_protocols')
        op.drop_index(op.f('ix_user_protocols_user_id'), table_name='user_protocols')
        
        # Drop the new columns
        if 'name' in columns:
            op.drop_column('user_protocols', 'name')
        if 'description' in columns:
            op.drop_column('user_protocols', 'description')
        if 'template_id' in columns:
            op.drop_column('user_protocols', 'template_id')
        if 'target_metrics' in columns:
            op.drop_column('user_protocols', 'target_metrics')
        if 'custom_fields' in columns:
            op.drop_column('user_protocols', 'custom_fields')
        if 'steps' in columns:
            op.drop_column('user_protocols', 'steps')
        if 'recommendations' in columns:
            op.drop_column('user_protocols', 'recommendations')
        if 'expected_outcomes' in columns:
            op.drop_column('user_protocols', 'expected_outcomes')
        if 'category' in columns:
            op.drop_column('user_protocols', 'category')
        if 'created_at' in columns:
            op.drop_column('user_protocols', 'created_at')
        if 'updated_at' in columns:
            op.drop_column('user_protocols', 'updated_at')
        
        # Add back protocol_id column
        op.add_column('user_protocols', sa.Column('protocol_id', postgresql.UUID(as_uuid=True), nullable=False))
        
        # Change start_date and end_date back to Date
        op.execute(text("ALTER TABLE user_protocols ALTER COLUMN start_date TYPE DATE USING start_date::date"))
        op.execute(text("ALTER TABLE user_protocols ALTER COLUMN end_date TYPE DATE USING end_date::date"))
        
        # Recreate indexes and constraints
        op.create_index('ix_user_protocols_user_id', 'user_protocols', ['user_id'], unique=False)
        op.create_index('ix_user_protocols_protocol_id', 'user_protocols', ['protocol_id'], unique=False)
        op.create_foreign_key('user_protocols_user_id_fkey', 'user_protocols', 'users', ['user_id'], ['id'], ondelete='CASCADE')
        op.create_foreign_key('user_protocols_protocol_id_fkey', 'user_protocols', 'protocols', ['protocol_id'], ['id'], ondelete='CASCADE') 
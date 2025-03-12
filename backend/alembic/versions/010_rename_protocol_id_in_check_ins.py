"""Rename protocol_id to user_protocol_id in protocol_check_ins

Revision ID: 010_rename_protocol_id_in_check_ins
Revises: 009_drop_protocol_id_from_user_protocols
Create Date: 2023-03-12 15:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "010_rename_protocol_id"
down_revision = "009_drop_protocol_id"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "protocol_check_ins" in tables:
        # Check if protocol_id column exists
        columns = [c["name"] for c in inspector.get_columns("protocol_check_ins")]

        if "protocol_id" in columns and "user_protocol_id" not in columns:
            # Get foreign key constraints
            fks = inspector.get_foreign_keys("protocol_check_ins")
            for fk in fks:
                if "protocol_id" in fk["constrained_columns"]:
                    # Drop the foreign key constraint
                    op.drop_constraint(fk["name"], "protocol_check_ins", type_="foreignkey")

            # Get indexes
            indexes = inspector.get_indexes("protocol_check_ins")
            for idx in indexes:
                if len(idx["column_names"]) == 1 and idx["column_names"][0] == "protocol_id":
                    op.drop_index(idx["name"], table_name="protocol_check_ins")

            # Rename the column
            op.alter_column("protocol_check_ins", "protocol_id", new_column_name="user_protocol_id")

            # Create new index
            op.create_index(op.f("ix_protocol_check_ins_user_protocol_id"), "protocol_check_ins", ["user_protocol_id"], unique=False)

            # Add new foreign key constraint
            op.create_foreign_key(
                "protocol_check_ins_user_protocol_id_fkey",
                "protocol_check_ins",
                "user_protocols",
                ["user_protocol_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "protocol_check_ins" in tables:
        # Check if user_protocol_id column exists
        columns = [c["name"] for c in inspector.get_columns("protocol_check_ins")]

        if "user_protocol_id" in columns and "protocol_id" not in columns:
            # Get foreign key constraints
            fks = inspector.get_foreign_keys("protocol_check_ins")
            for fk in fks:
                if "user_protocol_id" in fk["constrained_columns"]:
                    # Drop the foreign key constraint
                    op.drop_constraint(fk["name"], "protocol_check_ins", type_="foreignkey")

            # Get indexes
            indexes = inspector.get_indexes("protocol_check_ins")
            for idx in indexes:
                if len(idx["column_names"]) == 1 and idx["column_names"][0] == "user_protocol_id":
                    op.drop_index(idx["name"], table_name="protocol_check_ins")

            # Rename the column
            op.alter_column("protocol_check_ins", "user_protocol_id", new_column_name="protocol_id")

            # Create new index
            op.create_index(op.f("ix_protocol_check_ins_protocol_id"), "protocol_check_ins", ["protocol_id"], unique=False)

            # Add new foreign key constraint
            op.create_foreign_key(
                "protocol_check_ins_protocol_id_fkey", "protocol_check_ins", "user_protocols", ["protocol_id"], ["id"], ondelete="CASCADE"
            )

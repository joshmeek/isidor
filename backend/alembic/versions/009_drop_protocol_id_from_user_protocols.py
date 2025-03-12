"""Drop protocol_id from user_protocols

Revision ID: 009_drop_protocol_id_from_user_protocols
Revises: 008_add_template_protocols
Create Date: 2023-03-12 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "009_drop_protocol_id"
down_revision = "008_add_template_protocols"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "user_protocols" in tables:
        # Check if protocol_id column exists
        columns = [c["name"] for c in inspector.get_columns("user_protocols")]

        if "protocol_id" in columns:
            # Check for foreign key constraint
            fks = inspector.get_foreign_keys("user_protocols")
            for fk in fks:
                if "protocol_id" in fk["constrained_columns"]:
                    # Drop the foreign key constraint
                    op.drop_constraint(fk["name"], "user_protocols", type_="foreignkey")

            # Drop the protocol_id column
            op.drop_column("user_protocols", "protocol_id")

            # Drop the index if it exists
            indexes = inspector.get_indexes("user_protocols")
            for idx in indexes:
                if len(idx["column_names"]) == 1 and idx["column_names"][0] == "protocol_id":
                    op.drop_index(idx["name"], table_name="user_protocols")


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if "user_protocols" in tables:
        # Add back protocol_id column
        op.add_column("user_protocols", sa.Column("protocol_id", postgresql.UUID(as_uuid=True), nullable=True))

        # Create index for protocol_id
        op.create_index(op.f("ix_user_protocols_protocol_id"), "user_protocols", ["protocol_id"], unique=False)

        # Add foreign key constraint if protocols table exists
        if "protocols" in tables:
            op.create_foreign_key(
                "user_protocols_protocol_id_fkey", "user_protocols", "protocols", ["protocol_id"], ["id"], ondelete="CASCADE"
            )

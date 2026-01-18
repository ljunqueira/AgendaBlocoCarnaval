"""create core tables

Revision ID: 20240921_0001
Revises: 
Create Date: 2024-09-21 00:01:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20240921_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "neighborhoods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_table(
        "service_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("address", sa.String(length=255)),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("neighborhood_id", sa.Integer()),
        sa.Column("service_type_id", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["neighborhood_id"], ["neighborhoods.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["service_type_id"], ["service_types.id"], ondelete="SET NULL"
        ),
    )
    op.create_table(
        "parades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("location", sa.String(length=255)),
        sa.Column("start_at", sa.DateTime(timezone=True)),
        sa.Column("end_at", sa.DateTime(timezone=True)),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("neighborhood_id", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["neighborhood_id"], ["neighborhoods.id"], ondelete="SET NULL"
        ),
    )
    op.create_table(
        "feed_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_url", sa.String(length=255), nullable=False, unique=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True)),
        sa.Column("etag", sa.String(length=120)),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("feed_state")
    op.drop_table("parades")
    op.drop_table("services")
    op.drop_table("service_types")
    op.drop_table("neighborhoods")

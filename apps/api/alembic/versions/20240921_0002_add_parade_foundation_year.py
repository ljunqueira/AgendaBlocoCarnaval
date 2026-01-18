"""add foundation_year to parades

Revision ID: 20240921_0002
Revises: 20240921_0001
Create Date: 2024-09-21 00:02:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20240921_0002"
down_revision = "20240921_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("parades", sa.Column("foundation_year", sa.Integer()))


def downgrade() -> None:
    op.drop_column("parades", "foundation_year")

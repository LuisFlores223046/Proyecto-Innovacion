"""Corregir espacios.actualizado_en: NOT NULL con server_default

Revision ID: 002
Revises: 001
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Rellenar filas existentes que tengan NULL en actualizado_en
    op.execute("UPDATE espacios SET actualizado_en = creado_en WHERE actualizado_en IS NULL")

    # 2. Agregar server_default y cambiar a NOT NULL
    op.alter_column(
        "espacios",
        "actualizado_en",
        existing_type=sa.TIMESTAMP(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "espacios",
        "actualizado_en",
        existing_type=sa.TIMESTAMP(timezone=True),
        server_default=None,
        nullable=True,
    )

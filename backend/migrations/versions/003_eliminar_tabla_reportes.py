"""Eliminar tabla reportes — funcionalidad no requerida

Revision ID: 003
Revises: 002
Create Date: 2026-03-31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("reportes")


def downgrade() -> None:
    op.create_table(
        "reportes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id"), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("resuelto", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resuelto_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.CheckConstraint(
            "tipo IN ('cerrado', 'sucio', 'danado', 'lleno', 'otro')",
            name="ck_reporte_tipo",
        ),
    )

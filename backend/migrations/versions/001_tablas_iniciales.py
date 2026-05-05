"""Tablas iniciales — Mapa Interactivo CU UACJ

Revision ID: 001
Revises:
Create Date: 2026-03-30
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── categorias ────────────────────────────────────────────────────────────
    op.create_table(
        "categorias",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("icono", sa.String(10), nullable=False),
        sa.Column("color_hex", sa.String(7), nullable=False),
        sa.UniqueConstraint("nombre", name="uq_categoria_nombre"),
    )

    # ── edificios ─────────────────────────────────────────────────────────────
    op.create_table(
        "edificios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(20), nullable=False),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("latitud", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitud", sa.Numeric(10, 7), nullable=True),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.UniqueConstraint("codigo", name="uq_edificio_codigo"),
    )

    # ── pisos ─────────────────────────────────────────────────────────────────
    op.create_table(
        "pisos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("edificio_id", sa.Integer(), sa.ForeignKey("edificios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("numero", sa.String(5), nullable=False),
        sa.UniqueConstraint("edificio_id", "numero", name="uq_piso_edificio_numero"),
    )

    # ── espacios ──────────────────────────────────────────────────────────────
    op.create_table(
        "espacios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("codigo", sa.String(20), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("categoria_id", sa.Integer(), sa.ForeignKey("categorias.id"), nullable=True),
        sa.Column("piso_id", sa.Integer(), sa.ForeignKey("pisos.id"), nullable=True),
        sa.Column("latitud", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitud", sa.Numeric(10, 7), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("actualizado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("codigo", name="uq_espacio_codigo"),
    )

    # ── horarios ──────────────────────────────────────────────────────────────
    op.create_table(
        "horarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dia_semana", sa.SmallInteger(), nullable=False),
        sa.Column("hora_apertura", sa.Time(), nullable=False),
        sa.Column("hora_cierre", sa.Time(), nullable=False),
        sa.CheckConstraint("dia_semana >= 0 AND dia_semana <= 6", name="ck_horario_dia_semana"),
    )

    # ── contactos ─────────────────────────────────────────────────────────────
    op.create_table(
        "contactos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("valor", sa.String(200), nullable=False),
        sa.CheckConstraint("tipo IN ('telefono', 'correo', 'extension')", name="ck_contacto_tipo"),
    )

    # ── servicios_espacio ─────────────────────────────────────────────────────
    op.create_table(
        "servicios_espacio",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("descripcion", sa.String(200), nullable=False),
        sa.UniqueConstraint("espacio_id", "descripcion", name="uq_servicio_espacio_desc"),
    )

    # ── fotos_espacio ─────────────────────────────────────────────────────────
    op.create_table(
        "fotos_espacio",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("descripcion", sa.String(200), nullable=True),
        sa.Column("es_principal", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("orden", sa.Integer(), server_default="0", nullable=False),
        sa.Column("subida_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── eventos ───────────────────────────────────────────────────────────────
    op.create_table(
        "eventos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("espacio_id", sa.Integer(), sa.ForeignKey("espacios.id"), nullable=True),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("fecha_inicio", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("tipo", sa.String(20), server_default="otro", nullable=False),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.Column("url_registro", sa.String(500), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "tipo IN ('academico', 'deportivo', 'cultural', 'administrativo', 'otro')",
            name="ck_evento_tipo",
        ),
    )

    # ── administradores ───────────────────────────────────────────────────────
    op.create_table(
        "administradores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("activo", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("intentos_fallidos", sa.Integer(), server_default="0", nullable=False),
        sa.Column("bloqueado_hasta", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("username", name="uq_admin_username"),
        sa.UniqueConstraint("email", name="uq_admin_email"),
    )

    # ── índices de rendimiento ────────────────────────────────────────────────
    op.create_index("ix_espacios_codigo", "espacios", ["codigo"])
    op.create_index("ix_espacios_nombre", "espacios", ["nombre"])
    op.create_index("ix_espacios_activo", "espacios", ["activo"])
    op.create_index("ix_horarios_espacio_id", "horarios", ["espacio_id"])
    op.create_index("ix_eventos_fecha_inicio", "eventos", ["fecha_inicio"])


def downgrade() -> None:
    op.drop_index("ix_eventos_fecha_inicio", "eventos")
    op.drop_index("ix_horarios_espacio_id", "horarios")
    op.drop_index("ix_espacios_activo", "espacios")
    op.drop_index("ix_espacios_nombre", "espacios")
    op.drop_index("ix_espacios_codigo", "espacios")

    op.drop_table("administradores")
    op.drop_table("eventos")
    op.drop_table("fotos_espacio")
    op.drop_table("servicios_espacio")
    op.drop_table("contactos")
    op.drop_table("horarios")
    op.drop_table("espacios")
    op.drop_table("pisos")
    op.drop_table("edificios")
    op.drop_table("categorias")

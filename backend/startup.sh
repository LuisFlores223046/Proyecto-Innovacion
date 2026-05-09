#!/bin/bash
set -e

echo "Verificando estado de migraciones..."
python - <<'PYEOF'
from app.database import engine
from sqlalchemy import text

# Si la BD ya existe con las versiones antiguas (001..004), actualizamos
# el registro de Alembic para apuntar a la migración consolidada
# antes de ejecutar "alembic upgrade head".
try:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
        if row and row[0] in ('001', '002', '003', '004'):
            conn.execute(text(
                "UPDATE alembic_version SET version_num = '001_schema_completo'"
            ))
            conn.commit()
            print(f"  Migración consolidada: {row[0]} -> 001_schema_completo")
        elif row:
            print(f"  Versión de migración actual: {row[0]}")
        else:
            print("  BD nueva — se aplicará la migración completa")
except Exception:
    print("  BD nueva — se aplicará la migración completa")
PYEOF

echo "Corriendo migraciones..."
alembic upgrade head

echo "Ejecutando seed..."
python seed.py

echo "Iniciando servidor..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT

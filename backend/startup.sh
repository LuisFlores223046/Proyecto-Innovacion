#!/bin/bash
set -e

echo "Corriendo migraciones..."
alembic upgrade head

echo "Limpiando base de datos para re-seedear..."
python - <<EOF
from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
tablas = [
    "fotos_espacio", "servicios_espacio", "contactos", "horarios",
    "eventos", "espacios", "pisos", "edificios", "categorias", "administradores"
]
for tabla in tablas:
    db.execute(text(f"TRUNCATE TABLE {tabla} RESTART IDENTITY CASCADE"))
db.commit()
db.close()
print("Base de datos limpiada")
EOF

echo "Ejecutando seed..."
python seed.py

echo "Iniciando servidor..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT
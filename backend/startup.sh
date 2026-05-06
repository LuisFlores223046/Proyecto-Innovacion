#!/bin/bash

echo "Corriendo migraciones..."
alembic upgrade head

echo "Ejecutando seed (categorias, edificios, espacios, admin)..."
python seed.py

echo "Iniciando servidor..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT
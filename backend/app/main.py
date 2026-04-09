from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    categorias,
    edificios,
    espacios,
    horarios,
    contactos,
    servicios,
    fotos,
    eventos,
    auth,
)

app = FastAPI(
    title="Mapa Interactivo CU — UACJ",
    description="API REST para localizar espacios físicos dentro del Campus Ciudad Universitaria de la UACJ.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    settings.FRONTEND_URL,
]
origins = list({o for o in origins if o})

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(categorias.router, prefix=PREFIX)
app.include_router(edificios.router, prefix=PREFIX)
app.include_router(espacios.router, prefix=PREFIX)
app.include_router(horarios.router, prefix=PREFIX)
app.include_router(contactos.router, prefix=PREFIX)
app.include_router(servicios.router, prefix=PREFIX)
app.include_router(fotos.router, prefix=PREFIX)
app.include_router(eventos.router, prefix=PREFIX)



@app.get("/", tags=["Salud"])
def raiz():
    return {"mensaje": "API Mapa Interactivo CU — UACJ funcionando", "version": "1.0.0"}

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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

# ── Middleware de cabeceras de seguridad ───────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


_is_prod = settings.ENVIRONMENT == "production"

app = FastAPI(
    title="Mapa Interactivo CU — UACJ",
    description="API REST para localizar espacios físicos dentro del Campus Ciudad Universitaria de la UACJ.",
    version="1.0.0",
    # Documentación deshabilitada en producción para no exponer la API
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_dev_origins = ["http://localhost:5173", "http://localhost:3000"]
_prod_origins = ["https://mapacu-frontend.onrender.com", settings.FRONTEND_URL]

origins = list({o for o in (_prod_origins if _is_prod else _dev_origins + _prod_origins) if o})

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(SecurityHeadersMiddleware)

# En producción rechaza peticiones con Host no reconocido
if _is_prod:
    _allowed_hosts = list({
        h.replace("https://", "").replace("http://", "").split("/")[0]
        for h in _prod_origins if h
    })
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts or ["*"])

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
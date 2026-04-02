"""
Datos de prueba para el Mapa Interactivo CU — UACJ.
Ejecutar: python seed.py

Crea:
  - 22 categorías
  - 5 edificios con sus pisos
  - 10 espacios con horarios, servicios y fotos de placeholder
  - 1 administrador  (username: admin  /  password: admin123)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import (
    Categoria, Edificio, Piso, Espacio, Horario,
    ServicioEspacio, FotoEspacio, Evento, Administrador,
)
from app.auth.hashing import hash_password
from datetime import datetime, timezone, timedelta


def seed():
    db = SessionLocal()
    try:
        # ── Limpiar datos previos ─────────────────────────────────────────────
        for model in [
            FotoEspacio, ServicioEspacio, Horario, Evento,
            Espacio, Piso, Edificio, Categoria, Administrador,
        ]:
            db.query(model).delete()
        db.commit()

        # ── 22 Categorías ──────────────────────────────────────────────────────
        categorias_data = [
            ("Aula", "🏫", "#4A90D9"),
            ("Laboratorio", "🔬", "#7B2D8B"),
            ("Biblioteca", "📚", "#2E7D32"),
            ("Cafetería", "☕", "#F57C00"),
            ("Baño", "🚻", "#0097A7"),
            ("Estacionamiento", "🅿️", "#455A64"),
            ("Cancha Deportiva", "⚽", "#388E3C"),
            ("Auditorio", "🎭", "#C62828"),
            ("Oficina Administrativa", "🏛️", "#1565C0"),
            ("Enfermería", "🏥", "#D32F2F"),
            ("Banco / Cajero", "🏧", "#558B2F"),
            ("Papelería", "✏️", "#EF6C00"),
            ("Fotocopiadora", "🖨️", "#6D4C41"),
            ("Sala de Cómputo", "💻", "#283593"),
            ("Sala de Reuniones", "🤝", "#00695C"),
            ("Área Verde", "🌿", "#33691E"),
            ("Gimnasio", "💪", "#BF360C"),
            ("Tienda", "🛒", "#AD1457"),
            ("Capilla", "⛪", "#4527A0"),
            ("Centro de Idiomas", "🌐", "#00838F"),
            ("Coordinación", "📋", "#37474F"),
            ("Acceso / Entrada", "🚪", "#5D4037"),
        ]

        cats = {}
        for nombre, icono, color in categorias_data:
            cat = Categoria(nombre=nombre, icono=icono, color_hex=color)
            db.add(cat)
            cats[nombre] = cat
        db.flush()

        # ── 5 Edificios ────────────────────────────────────────────────────────
        edificios_data = [
            ("ICB", "Instituto de Ciencias Biomédicas",
             "Facultad de Medicina y Ciencias Biomédicas", 31.7219, -106.4258),
            ("IADA", "Instituto de Arquitectura, Diseño y Arte",
             "Facultad de Diseño, Arte y Arquitectura", 31.7225, -106.4265),
            ("IIT", "Instituto de Ingeniería y Tecnología",
             "Facultad de Ingeniería y Tecnología", 31.7215, -106.4250),
            ("ICH", "Instituto de Ciencias Humanísticas",
             "Facultad de Humanidades", 31.7230, -106.4270),
            ("ADMIN", "Rectoría y Administración Central",
             "Edificio principal de administración universitaria", 31.7222, -106.4262),
        ]

        edifs = {}
        pisos_map = {}
        for codigo, nombre, desc, lat, lon in edificios_data:
            e = Edificio(codigo=codigo, nombre=nombre, descripcion=desc, latitud=lat, longitud=lon)
            db.add(e)
            edifs[codigo] = e
        db.flush()

        # Pisos de cada edificio
        pisos_config = {
            "ICB": ["PB", "P1", "P2"],
            "IADA": ["PB", "P1", "P2", "P3"],
            "IIT": ["PB", "P1", "P2"],
            "ICH": ["PB", "P1"],
            "ADMIN": ["PB", "P1"],
        }
        for codigo, numeros in pisos_config.items():
            pisos_map[codigo] = {}
            for num in numeros:
                p = Piso(edificio_id=edifs[codigo].id, numero=num)
                db.add(p)
                pisos_map[codigo][num] = p
        db.flush()

        # ── 10 Espacios ────────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)

        espacios_data = [
            {
                "codigo": "ICB-A101",
                "nombre": "Aula 101 — ICB",
                "categoria": "Aula",
                "edificio": "ICB",
                "piso": "P1",
                "latitud": 31.7220,
                "longitud": -106.4259,
                "notas": "Aula principal con proyector y 40 lugares",
                "horarios": [
                    (0, "07:00", "21:00"), (1, "07:00", "21:00"),
                    (2, "07:00", "21:00"), (3, "07:00", "21:00"),
                    (4, "07:00", "21:00"),
                ],
                "servicios": ["Proyector HD", "Pizarrón inteligente", "Aire acondicionado"],
            },
            {
                "codigo": "ICB-LAB01",
                "nombre": "Laboratorio de Biología",
                "categoria": "Laboratorio",
                "edificio": "ICB",
                "piso": "PB",
                "latitud": 31.7218,
                "longitud": -106.4257,
                "notas": "Laboratorio de prácticas de biología celular y molecular",
                "horarios": [
                    (0, "08:00", "18:00"), (1, "08:00", "18:00"),
                    (2, "08:00", "18:00"), (3, "08:00", "18:00"),
                    (4, "08:00", "18:00"),
                ],
                "servicios": ["Microscopios ópticos", "Campana de flujo laminar", "Autoclave"],
            },
            {
                "codigo": "BICU-01",
                "nombre": "Biblioteca Central UACJ",
                "categoria": "Biblioteca",
                "edificio": "ADMIN",
                "piso": "PB",
                "latitud": 31.7223,
                "longitud": -106.4263,
                "notas": "Acervo de más de 50 000 volúmenes y acceso a bases de datos digitales",
                "horarios": [
                    (0, "08:00", "20:00"), (1, "08:00", "20:00"),
                    (2, "08:00", "20:00"), (3, "08:00", "20:00"),
                    (4, "08:00", "20:00"), (5, "09:00", "15:00"),
                ],
                "servicios": ["Wi-Fi", "Préstamo de laptops", "Sala de estudio grupal", "Impresión"],
            },
            {
                "codigo": "CAF-CENTRAL",
                "nombre": "Cafetería Central",
                "categoria": "Cafetería",
                "edificio": "ADMIN",
                "piso": "PB",
                "latitud": 31.7221,
                "longitud": -106.4261,
                "notas": "Servicio de desayuno, comida y cena. Menú económico para estudiantes.",
                "horarios": [
                    (0, "07:00", "20:00"), (1, "07:00", "20:00"),
                    (2, "07:00", "20:00"), (3, "07:00", "20:00"),
                    (4, "07:00", "20:00"), (5, "08:00", "14:00"),
                ],
                "servicios": ["Menú económico", "Área de mesas techada", "Opciones vegetarianas"],
            },
            {
                "codigo": "IIT-COMP01",
                "nombre": "Sala de Cómputo 1 — IIT",
                "categoria": "Sala de Cómputo",
                "edificio": "IIT",
                "piso": "P1",
                "latitud": 31.7216,
                "longitud": -106.4251,
                "notas": "40 equipos con software de ingeniería: AutoCAD, MATLAB, Visual Studio",
                "horarios": [
                    (0, "07:00", "21:00"), (1, "07:00", "21:00"),
                    (2, "07:00", "21:00"), (3, "07:00", "21:00"),
                    (4, "07:00", "21:00"),
                ],
                "servicios": ["AutoCAD", "MATLAB", "Visual Studio", "Impresora láser"],
            },
            {
                "codigo": "AUD-PRINCIPAL",
                "nombre": "Auditorio Principal UACJ",
                "categoria": "Auditorio",
                "edificio": "ADMIN",
                "piso": "PB",
                "latitud": 31.7224,
                "longitud": -106.4264,
                "notas": "Capacidad para 500 personas. Sistema de audio profesional.",
                "horarios": [
                    (0, "08:00", "22:00"), (1, "08:00", "22:00"),
                    (2, "08:00", "22:00"), (3, "08:00", "22:00"),
                    (4, "08:00", "22:00"), (5, "09:00", "18:00"),
                ],
                "servicios": ["Sistema de audio profesional", "Pantalla de proyección", "Cabina de traducción"],
            },
            {
                "codigo": "ENFER-01",
                "nombre": "Servicio Médico Estudiantil",
                "categoria": "Enfermería",
                "edificio": "ADMIN",
                "piso": "PB",
                "latitud": 31.7222,
                "longitud": -106.4260,
                "notas": "Atención médica gratuita para estudiantes y personal UACJ",
                "horarios": [
                    (0, "08:00", "20:00"), (1, "08:00", "20:00"),
                    (2, "08:00", "20:00"), (3, "08:00", "20:00"),
                    (4, "08:00", "20:00"),
                ],
                "servicios": ["Consulta general gratuita", "Primeros auxilios", "Farmacia básica"],
            },
            {
                "codigo": "IADA-EST01",
                "nombre": "Estudio de Diseño 1",
                "categoria": "Laboratorio",
                "edificio": "IADA",
                "piso": "P2",
                "latitud": 31.7226,
                "longitud": -106.4266,
                "notas": "Estudio para diseño gráfico y multimedia con tabletas digitalizadoras",
                "horarios": [
                    (0, "07:00", "21:00"), (1, "07:00", "21:00"),
                    (2, "07:00", "21:00"), (3, "07:00", "21:00"),
                    (4, "07:00", "21:00"),
                ],
                "servicios": ["iMac 27\"", "Adobe Creative Cloud", "Tabletas Wacom", "Plotter"],
            },
            {
                "codigo": "CANCHA-FUT",
                "nombre": "Cancha de Fútbol",
                "categoria": "Cancha Deportiva",
                "edificio": "IIT",
                "piso": "PB",
                "latitud": 31.7213,
                "longitud": -106.4248,
                "notas": "Cancha de fútbol 7 con pasto sintético. Requiere reservación.",
                "horarios": [
                    (0, "07:00", "21:00"), (1, "07:00", "21:00"),
                    (2, "07:00", "21:00"), (3, "07:00", "21:00"),
                    (4, "07:00", "21:00"), (5, "08:00", "18:00"),
                    (6, "08:00", "16:00"),
                ],
                "servicios": ["Pasto sintético", "Iluminación nocturna", "Vestidores"],
            },
            {
                "codigo": "ICH-IDIOMAS",
                "nombre": "Centro de Idiomas",
                "categoria": "Centro de Idiomas",
                "edificio": "ICH",
                "piso": "PB",
                "latitud": 31.7231,
                "longitud": -106.4271,
                "notas": "Clases de inglés, francés, alemán y chino mandarín",
                "horarios": [
                    (0, "08:00", "20:00"), (1, "08:00", "20:00"),
                    (2, "08:00", "20:00"), (3, "08:00", "20:00"),
                    (4, "08:00", "20:00"),
                ],
                "servicios": ["Laboratorio de idiomas", "TOEFL/IELTS prep", "Intercambio cultural"],
            },
        ]

        espacios_creados = []
        for ed in espacios_data:
            piso_obj = pisos_map[ed["edificio"]][ed["piso"]]
            cat_obj = cats[ed["categoria"]]
            espacio = Espacio(
                codigo=ed["codigo"],
                nombre=ed["nombre"],
                categoria_id=cat_obj.id,
                piso_id=piso_obj.id,
                latitud=ed["latitud"],
                longitud=ed["longitud"],
                notas=ed["notas"],
                activo=True,
            )
            db.add(espacio)
            db.flush()

            # Horarios
            for dia, apertura, cierre in ed["horarios"]:
                from datetime import time
                h, m = map(int, apertura.split(":"))
                hc, mc = map(int, cierre.split(":"))
                db.add(Horario(
                    espacio_id=espacio.id,
                    dia_semana=dia,
                    hora_apertura=time(h, m),
                    hora_cierre=time(hc, mc),
                ))

            # Servicios
            for desc in ed["servicios"]:
                db.add(ServicioEspacio(espacio_id=espacio.id, descripcion=desc))

            # Foto de placeholder
            db.add(FotoEspacio(
                espacio_id=espacio.id,
                url=f"https://placehold.co/800x600?text={espacio.codigo.replace('-', '+')}",
                descripcion="Imagen de referencia",
                es_principal=True,
                orden=0,
            ))

            espacios_creados.append(espacio)

        db.flush()

        # ── Eventos de ejemplo ─────────────────────────────────────────────────
        eventos_data = [
            {
                "espacio_id": espacios_creados[5].id,  # Auditorio
                "titulo": "Semana de Ingeniería 2026",
                "descripcion": "Conferencias, talleres y exposiciones del área de ingeniería.",
                "fecha_inicio": now + timedelta(days=5),
                "fecha_fin": now + timedelta(days=7),
                "tipo": "academico",
            },
            {
                "espacio_id": espacios_creados[8].id,  # Cancha
                "titulo": "Torneo Interfacultades de Fútbol",
                "descripcion": "Torneo semestral entre facultades. Inscripciones abiertas.",
                "fecha_inicio": now + timedelta(days=10),
                "fecha_fin": now + timedelta(days=12),
                "tipo": "deportivo",
            },
            {
                "espacio_id": None,
                "titulo": "Feria de Empleo UACJ 2026",
                "descripcion": "Más de 50 empresas participantes. Trae tu CV.",
                "fecha_inicio": now + timedelta(days=15),
                "fecha_fin": now + timedelta(days=15),
                "tipo": "administrativo",
            },
        ]
        from app.models.evento import Evento as EventoModel
        for ev in eventos_data:
            db.add(EventoModel(**ev, activo=True))

        # ── Administrador inicial ──────────────────────────────────────────────
        admin = Administrador(
            username="admin",
            email="admin@uacj.mx",
            password_hash=hash_password("admin123"),
            activo=True,
        )
        db.add(admin)

        db.commit()
        print("✅ Seed completado exitosamente.")
        print("   Admin: username=admin / password=admin123")

    except Exception as exc:
        db.rollback()
        print(f"❌ Error durante el seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

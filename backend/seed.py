"""
Seed completo con datos reales del Campus Ciudad Universitaria UACJ.
Fuente: RecampoCU_v4.xlsx

Modos de ejecución:
  - Base de datos VACÍA   → crea todos los datos desde cero.
  - Base de datos CON datos → actualiza nombres y ortografía SIN tocar eventos.

Variables de entorno para el administrador (configurar en Render):
  ADMIN_USERNAME  → nombre de usuario del administrador
  ADMIN_PASSWORD  → contraseña del administrador
  ADMIN_EMAIL     → correo del administrador (opcional)
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import (
    Categoria, Edificio, Piso, Espacio, Horario,
    Contacto, ServicioEspacio, FotoEspacio, Evento, Administrador,
)
from app.auth.hashing import hash_password
from datetime import time


# ── Credenciales del administrador ────────────────────────────────────────────
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "mapacu_admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "CU@2026#MapaX9!")
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@uacj.mx")

# ── Mapa de renombrado de categorías (nombre anterior → nombre correcto) ──────
RENAME_CATS = {
    "Bano Hombres":   "Baño Hombres",
    "Bano Mujeres":   "Baño Mujeres",
    "Cafeteria":      "Cafetería",
    "Servicio Medico": "Servicio Médico",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def lv(apertura: str, cierre: str):
    """Horarios lunes-viernes (días 0-4)."""
    ha, ma = map(int, apertura.split(":"))
    hc, mc = map(int, cierre.split(":"))
    return [(d, time(ha, ma), time(hc, mc)) for d in range(5)]


def dms(lat_d, lat_m, lat_s, lon_d, lon_m, lon_s):
    """Grados-Minutos-Segundos → Grados decimales."""
    lat = lat_d + lat_m / 60 + lat_s / 3600
    lon = -(lon_d + lon_m / 60 + lon_s / 3600)
    return round(lat, 6), round(lon, 6)


# ── Datos de categorías ───────────────────────────────────────────────────────
CATEGORIAS_DATA = [
    ("Aula",                    "🏫", "#4A90E2"),
    ("Laboratorio",             "🔬", "#7B68EE"),
    ("Oficina Administrativa",  "🏢", "#F5A623"),
    ("Cafetería",               "☕", "#D0021B"),
    ("Biblioteca",              "📚", "#2D7D46"),
    ("Baño Hombres",            "🚹", "#1565C0"),
    ("Baño Mujeres",            "🚺", "#C2185B"),
    ("Impresoras",              "🖨",  "#8B572A"),
    ("Zona de Estudio",         "📖", "#00897B"),
    ("Servicio Médico",         "🏥", "#B71C1C"),
    ("Audiovisual",             "🎬", "#6A1B9A"),
    ("Otro",                    "📍", "#757575"),
]

# ── Datos de edificios ────────────────────────────────────────────────────────
EDIFICIOS_DATA = [
    ("A",   "Edificio A", "Edificio A del Campus CU UACJ",                31.492003, -106.415700),
    ("B",   "Edificio B", "Edificio B del Campus CU UACJ",                31.493762, -106.413766),
    ("C",   "Edificio C", "Edificio C del Campus CU UACJ",                31.493050, -106.414430),
    ("D",   "Edificio D", "Complejo D1-D2-D3-D4 del Campus CU UACJ",     31.491200, -106.413850),
    ("GIM", "Gimnasio",   "Gimnasio del Campus CU UACJ",                  31.493420, -106.416300),
]


# ══════════════════════════════════════════════════════════════════════════════
# MODO ACTUALIZACIÓN — corrige ortografía sin tocar eventos ni IDs
# ══════════════════════════════════════════════════════════════════════════════

def _actualizar_datos(db):
    """Actualiza nombres y ortografía en una BD con datos existentes."""

    # 1. Renombrar categorías
    print("Actualizando categorías...")
    for nombre_viejo, nombre_nuevo in RENAME_CATS.items():
        cat = db.query(Categoria).filter_by(nombre=nombre_viejo).first()
        if cat:
            cat.nombre = nombre_nuevo
            print(f"  '{nombre_viejo}' → '{nombre_nuevo}'")
    db.commit()

    # Construir mapa nombre → id con nombres ya corregidos
    cats = {c.nombre: c.id for c in db.query(Categoria).all()}

    # 2. Actualizar espacios por código
    print("Actualizando nombres de espacios...")
    _actualizar_espacios(db, cats)

    # 3. Actualizar/crear administrador
    _actualizar_admin(db)

    db.commit()
    print("\nActualización completada exitosamente.")


def _actualizar_espacio(db, cats, codigo, nombre_nuevo, cat_key, notas=None,
                         horarios=None, contactos=None, servicios=None):
    """Actualiza nombre y notas de un espacio existente por código.
    También recrea sus servicios y contactos con datos corregidos."""
    esp = db.query(Espacio).filter_by(codigo=codigo).first()
    if not esp:
        return  # Si no existe, omitir (raro en datos reales)

    esp.nombre = nombre_nuevo
    esp.notas  = notas

    # Recrear servicios con texto corregido
    db.query(ServicioEspacio).filter_by(espacio_id=esp.id).delete()
    if servicios:
        for desc in servicios:
            db.add(ServicioEspacio(espacio_id=esp.id, descripcion=desc))

    # Recrear contactos con texto corregido
    db.query(Contacto).filter_by(espacio_id=esp.id).delete()
    if contactos:
        for tipo, valor in contactos:
            db.add(Contacto(espacio_id=esp.id, tipo=tipo, valor=valor))


def _actualizar_admin(db):
    """Actualiza las credenciales del administrador o crea uno nuevo."""
    print("Actualizando administrador...")

    # Buscar admin existente (por username "admin" o por el username nuevo)
    admin = (
        db.query(Administrador).filter_by(username="admin").first()
        or db.query(Administrador).filter_by(username=ADMIN_USERNAME).first()
    )

    if admin:
        admin.username      = ADMIN_USERNAME
        admin.email         = ADMIN_EMAIL
        admin.password_hash = hash_password(ADMIN_PASSWORD)
        print(f"  Admin actualizado → username: {ADMIN_USERNAME}")
    else:
        admin = Administrador(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
        )
        db.add(admin)
        print(f"  Admin creado → username: {ADMIN_USERNAME}")

    db.commit()


def _actualizar_espacios(db, cats):
    """Itera todos los espacios y actualiza nombre/notas/servicios/contactos."""

    H_AULA = lv("08:00", "19:30")
    H_BANO = lv("08:00", "19:30")
    H_OFIC = lv("08:00", "18:00")

    def upd(codigo, nombre, cat_key, notas=None, servicios=None, contactos=None):
        _actualizar_espacio(db, cats, codigo, nombre, cat_key,
                            notas=notas, servicios=servicios, contactos=contactos)

    # ── Edificio A ────────────────────────────────────────────────────────────
    upd("A-101", "Audiovisual A", "Audiovisual")
    upd("A-103", "Baño Mujeres A-PB-1", "Baño Mujeres")
    upd("A-104", "Baño Hombres A-PB-1", "Baño Hombres")
    for cod in ["A-106","A-107","A-108","A-126","A-127","A-128","A-132"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("A-110", "CBU", "Oficina Administrativa",
        notas="Ayuda con psicoterapia, becas, objetos extraviados, información general, canalización psicológica",
        servicios=["Psicoterapia","Becas","Objetos extraviados","Información general","Canalización psicológica"],
        contactos=[("telefono","656-688-2100")])
    upd("A-111", "UAMI Edificio A", "Servicio Médico",
        notas="Servicio médico de atención inicial",
        servicios=["Migraña","Sutura","Inmovilización","Curaciones","Presión arterial","Glucosa","Seguro estudiantil"],
        contactos=[("telefono","656-688-2100"),("correo","uami.cu@uacj.mx")])
    upd("A-113", "Baño Hombres A-PB-2", "Baño Hombres")
    upd("A-114", "Cafetería Edificio A", "Cafetería")
    upd("A-115", "Baño Mujeres A-PB-2", "Baño Mujeres")
    upd("A-117", "Librería Tienda UACJ", "Otro",
        servicios=["Venta de artículos UACJ","Libros y papelería"])
    upd("A-118", "Galería Cultural", "Otro")
    upd("A-119", "Patio Interior A", "Zona de Estudio")
    upd("A-130", "Baño Hombres A-PB-3", "Baño Hombres")
    upd("A-131", "Baño Mujeres A-PB-3", "Baño Mujeres")
    for cod in ["A-201","A-202","A-203","A-207","A-208","A-213","A-214","A-215",
                "A-216","A-217","A-218","A-219","A-225","A-226","A-227","A-228"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("A-205", "Baño Hombres A-P1-1", "Baño Hombres")
    upd("A-206", "Baño Mujeres A-P1-1", "Baño Mujeres")
    upd("A-210", "Baño Hombres A-P1-2", "Baño Hombres")
    upd("A-211", "Baño Mujeres A-P1-2", "Baño Mujeres")
    upd("A-221", "Baño Hombres A-P1-3", "Baño Hombres")
    upd("A-223", "Baño Mujeres A-P1-3", "Baño Mujeres")
    upd("A-222", "Sala de Apoyo Didáctico Docentes A", "Oficina Administrativa")
    upd("A-EST1-P1", "Zona de Estudio A P1-1", "Zona de Estudio")
    upd("A-EST2-P1", "Zona de Estudio A P1-2", "Zona de Estudio")
    for cod in ["A-301","A-302","A-303","A-304","A-306","A-307","A-313","A-314"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("A-309", "Baño Hombres A-P2", "Baño Hombres")
    upd("A-311", "Baño Mujeres A-P2", "Baño Mujeres")
    upd("A-310", "Sala Multifuncional Docentes A", "Oficina Administrativa")
    upd("A-EST1-P2", "Zona de Estudio A P2-1", "Zona de Estudio")
    upd("A-EST2-P2", "Zona de Estudio A P2-2", "Zona de Estudio")

    # ── Edificio B ────────────────────────────────────────────────────────────
    for cod in ["B-101-B","B-101-C","B-101-D","B-101-E","B-101-F","B-101-G",
                "B-101-H","B-109","B-110","B-111","B-115","B-116"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("B-106", "Baño Mujeres B-PB-1", "Baño Mujeres")
    upd("B-108", "Baño Hombres B-PB-1", "Baño Hombres")
    upd("B-118", "Baño Mujeres B-PB-2", "Baño Mujeres")
    upd("B-120", "Baño Hombres B-PB-2", "Baño Hombres")
    upd("B-CAS", "Casilleros Edificio B", "Otro")
    upd("B-EST", "Zona de Estudio B", "Zona de Estudio")
    for cod in ["B-206","B-207","B-221","B-222","B-223-B","B-223-C","B-223-D",
                "B-223-E","B-223-F","B-223-G","B-223-H"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("B-208", "Centro de Cómputo B-1", "Laboratorio",
        servicios=["Computadoras con acceso a internet","Impresión"])
    upd("B-210", "Centro de Cómputo B-2", "Laboratorio",
        servicios=["Computadoras con acceso a internet","Impresión"])
    upd("B-209", "Cubículo Docentes B", "Oficina Administrativa")
    upd("B-211", "Tutora de Guardia B", "Oficina Administrativa")
    upd("B-203", "Baño Mujeres B-P1-1", "Baño Mujeres")
    upd("B-205", "Baño Hombres B-P1-1", "Baño Hombres")
    upd("B-213", "Baño Mujeres B-P1-2", "Baño Mujeres")
    upd("B-215", "Baño Hombres B-P1-2", "Baño Hombres")
    upd("B-218", "Baño Mujeres B-P1-3", "Baño Mujeres")
    upd("B-220", "Baño Hombres B-P1-3", "Baño Hombres")
    for cod in ["B-301","B-302","B-303","B-304","B-305","B-306","B-307",
                "B-320","B-321","B-322","B-323-B","B-323-C","B-323-D",
                "B-322-E","B-322-F","B-322-G"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("B-308", "Sala Descanso Docentes B", "Oficina Administrativa")
    upd("B-309", "Sala Multifuncional Docentes B", "Oficina Administrativa")
    upd("B-312", "Baño Mujeres B-P2", "Baño Mujeres")
    upd("B-314", "Baño Hombres B-P2", "Baño Hombres")

    # ── Edificio C ────────────────────────────────────────────────────────────
    upd("C-129", "Oficinas Administrativas C", "Oficina Administrativa",
        notas="Jefatura vinculación, servicio social, prácticas profesionales, movilidad estudiantil",
        servicios=["Servicio social","Prácticas profesionales","Movilidad estudiantil","Vinculación"],
        contactos=[("telefono","656-688-2100 ext. 6534"),("correo","jescuder@uacj.mx")])
    upd("C-124", "Audiovisual C", "Audiovisual")
    upd("C-BM-PB", "Baño Mujeres C-PB", "Baño Mujeres")
    upd("C-BH-PB", "Baño Hombres C-PB", "Baño Hombres")
    upd("C-CAF", "Cafetería Edificio C", "Cafetería")
    for cod in ["C-204","C-205","C-206","C-207","C-209","C-210","C-221","C-222",
                "C-223-B","C-223-C","C-223-D","C-223-E","C-223-F","C-223-G","C-223-H"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("C-BH-P1-1", "Baño Hombres C-P1-1", "Baño Hombres")
    upd("C-BH-P1-2", "Baño Hombres C-P1-2", "Baño Hombres")
    upd("C-BH-P1-3", "Baño Hombres C-P1-3", "Baño Hombres")
    upd("C-PREST", "Sala de Préstamo C", "Oficina Administrativa",
        servicios=["Préstamo de equipos","Atención a estudiantes"])
    for cod in ["C-304","C-306","C-307","C-308-B","C-308-C","C-308-D",
                "C-308-E","C-308-F","C-308-G","C-308-H"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("C-BH-P2", "Baño Hombres C-P2", "Baño Hombres")

    # ── Edificio D ────────────────────────────────────────────────────────────
    upd("D1-101", "Laboratorio de Electrónica D1-101", "Laboratorio")
    upd("D1-105", "Laboratorio de Electrónica D1-105", "Laboratorio")
    upd("D1-115", "Laboratorio de Física",             "Laboratorio")
    upd("D1-111", "Taller de Fotografía",              "Laboratorio")
    upd("D1-112", "Taller de Serigrafía",              "Laboratorio")
    upd("D1-106", "Salón D1-106",      "Aula")
    upd("D1-107", "Digitales D1-107",  "Aula")
    upd("D1-114", "Salón D1-114",      "Aula")
    upd("D2-101", "Laboratorio de Manufactura",                        "Laboratorio")
    upd("D2-102", "Laboratorio de Mecatrónica",                        "Laboratorio")
    upd("D2-104", "Laboratorio de Sistemas Hidráulicos y Neumáticos",  "Laboratorio")
    upd("D2-105", "Taller de Maquetas",                                "Laboratorio")
    upd("D2-106", "Baño Mujeres D2-PB", "Baño Mujeres")
    upd("D2-108", "Baño Hombres D2-PB", "Baño Hombres")
    upd("D3-102", "Laboratorio de Habilidades Motrices",                         "Laboratorio")
    upd("D3-103", "Laboratorio de Ciencia, Tecnología Alimentaria y Nutrición",  "Laboratorio")
    upd("D3-104", "Laboratorio de Evaluación y Diagnóstico Nutricional",         "Laboratorio")
    upd("D3-105", "Laboratorio de Gastronomía",                                  "Laboratorio")
    upd("D3-107", "Laboratorio de Sistemas Automotrices",                        "Laboratorio")
    upd("D3-109", "Baño Mujeres D3-PB", "Baño Mujeres")
    upd("D3-111", "Baño Hombres D3-PB", "Baño Hombres")
    upd("D3-BEB", "Bebederos D3", "Otro")
    for cod in ["D4-106","D4-107","D4-108","D4-109","D4-110",
                "D4-112","D4-113","D4-114","D4-115"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("D-MERC", "Mercadito D", "Cafetería")
    for cod in ["D1-205","D1-207","D1-208","D1-209","D1-211"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("D1-201", "Baño Hombres D1-P1", "Baño Hombres")
    upd("D1-203", "Baño Mujeres D1-P1", "Baño Mujeres")
    upd("D2-209", "Laboratorio de Diseño Asistido por Computadora", "Laboratorio")
    upd("D2-210", "Laboratorio de Cómputo Avanzado",                "Laboratorio")
    upd("D2-212", "Laboratorio de Ergonomía y Métodos",             "Laboratorio")
    upd("D2-207", "Aula de Cómputo D2", "Laboratorio",
        servicios=["Computadoras con acceso a internet"])
    upd("D2-206", "Sala Multiusos y Préstamo D2", "Oficina Administrativa",
        servicios=["Préstamo de proyectores","Préstamo de laptops"])
    upd("D2-202", "Baño Mujeres D2-P1", "Baño Mujeres")
    upd("D2-204", "Baño Hombres D2-P1", "Baño Hombres")
    upd("D3-209", "Laboratorio de Bioquímica",                 "Laboratorio")
    upd("D3-210", "Laboratorio de Toxicología y Farmacología", "Laboratorio")
    upd("D3-211", "Laboratorio de Habilidades de Enfermería",  "Laboratorio")
    upd("D3-212", "Cámara de Gesell",                          "Laboratorio")
    upd("D3-207", "Centro de Simulación de Negocios",          "Laboratorio")
    upd("D3-203", "Sala de Maestros D3", "Oficina Administrativa")
    for cod in ["D4-208","D4-212","D4-214"]:
        upd(cod, f"Salón {cod}", "Aula")
    upd("D4-207", "Sala de Impresiones D4", "Impresoras",
        servicios=["Impresión","Copiado"])
    upd("D3-305", "Biblioteca D3", "Biblioteca",
        servicios=["Préstamo de libros","Sala de lectura","Acceso a internet"])
    upd("D3-301", "Laboratorio de Radio y Revisión", "Laboratorio")
    upd("D3-306", "Sala de Juicios Orales",          "Laboratorio")
    for cod in ["D4-308","D4-309","D4-311","D4-312","D4-313","D4-315","D4-316","D4-317"]:
        upd(cod, f"Salón {cod}", "Aula")

    # ── Gimnasio ──────────────────────────────────────────────────────────────
    upd("GIM-E108",  "Sala de Halterofilia",          "Otro")
    upd("GIM-E103",  "Baño Mujeres Gimnasio PB-1",    "Baño Mujeres")
    upd("GIM-E104",  "Baño Hombres Gimnasio PB-1",    "Baño Hombres")
    upd("GIM-E106A", "Sala de Caminadoras",            "Otro",
        servicios=["Caminadoras eléctricas"])
    upd("GIM-E106B", "Sala de Máquinas",               "Otro",
        servicios=["Máquinas de ejercicio"])
    upd("GIM-E110",  "Sala de Calistenia",             "Otro")
    upd("GIM-E105",  "Responsable Gimnasio",           "Oficina Administrativa")
    upd("GIM-E111",  "Canchas Polideportivas",         "Otro",
        servicios=["Basketball","Voleibol"])
    upd("GIM-E112",  "Alberca Olímpica",               "Otro")
    upd("GIM-E112E", "UAMI Gimnasio",                  "Servicio Médico",
        servicios=["Atención médica inicial"])
    upd("GIM-E112A", "Baño Mujeres Gimnasio PB-2",    "Baño Mujeres")
    upd("GIM-E112D", "Baño Hombres Gimnasio PB-2",    "Baño Hombres")
    upd("GIM-E112R", "Baño Mujeres Gimnasio PB-3",    "Baño Mujeres")
    upd("GIM-E112G", "Baño Hombres Gimnasio PB-3",    "Baño Hombres")
    upd("GIM-E207",  "Jefatura Deporte Interno y Estadística", "Oficina Administrativa")
    upd("GIM-E205",  "Laboratorio de Fisiología del Ejercicio", "Laboratorio",
        servicios=["Fisiología del ejercicio","Terapia física y rehabilitación"])
    upd("GIM-E202",  "Baño Hombres Gimnasio P1",      "Baño Hombres")
    upd("GIM-E201",  "Baño Mujeres Gimnasio P1",      "Baño Mujeres")
    upd("GIM-E203",  "Sala de Elípticas",              "Otro",
        servicios=["Elípticas"])
    upd("GIM-E204",  "Sala de Bicicletas Estáticas",  "Otro",
        servicios=["Bicicletas estáticas"])
    upd("GIM-E208",  "Gradas de Canchas",              "Otro")
    upd("GIM-E209",  "Gradas de Alberca",              "Otro")

    db.commit()
    print(f"  {db.query(Espacio).count()} espacios actualizados")


# ══════════════════════════════════════════════════════════════════════════════
# MODO SEED INICIAL — base de datos vacía
# ══════════════════════════════════════════════════════════════════════════════

def _seed_inicial(db):
    """Crea todos los datos desde cero en una base de datos vacía."""

    # Limpiar datos anteriores (por si quedaron tablas parciales)
    # NUNCA se eliminan eventos, incluso en seed inicial
    print("Limpiando tablas...")
    db.query(FotoEspacio).delete()
    db.query(ServicioEspacio).delete()
    db.query(Contacto).delete()
    db.query(Horario).delete()
    db.query(Espacio).delete()
    db.query(Piso).delete()
    db.query(Edificio).delete()
    db.query(Categoria).delete()
    db.query(Administrador).delete()
    db.commit()

    # Resetear secuencias
    tablas = ["categorias","edificios","pisos","espacios","horarios",
              "contactos","servicios_espacio","fotos_espacio","eventos","administradores"]
    for tabla in tablas:
        db.execute(__import__("sqlalchemy").text(
            f"ALTER SEQUENCE {tabla}_id_seq RESTART WITH 1"
        ))
    db.commit()

    # ── Categorías ────────────────────────────────────────────────────────────
    print("Creando categorías...")
    cats = {}
    for nombre, icono, color in CATEGORIAS_DATA:
        c = Categoria(nombre=nombre, icono=icono, color_hex=color)
        db.add(c)
        db.flush()
        cats[nombre] = c.id
    db.commit()
    print(f"  {len(cats)} categorías creadas")

    # ── Edificios ─────────────────────────────────────────────────────────────
    print("Creando edificios...")
    eds = {}
    for codigo, nombre, desc, lat, lon in EDIFICIOS_DATA:
        e = Edificio(codigo=codigo, nombre=nombre, descripcion=desc, latitud=lat, longitud=lon)
        db.add(e)
        db.flush()
        eds[codigo] = e.id
    db.commit()

    # ── Pisos ─────────────────────────────────────────────────────────────────
    print("Creando pisos...")
    pisos = {}
    for ed_codigo in ["A","B","C","D","GIM"]:
        for numero in ["PB","1","2","3"]:
            p = Piso(edificio_id=eds[ed_codigo], numero=numero)
            db.add(p)
            db.flush()
            pisos[f"{ed_codigo}-{numero}"] = p.id
    db.commit()

    # ── Helpers de inserción ──────────────────────────────────────────────────
    count = 0

    def add_esp(codigo, nombre, cat_key, ed_key, piso_num, lat, lon, notas=None):
        nonlocal count
        e = Espacio(
            codigo=codigo, nombre=nombre,
            categoria_id=cats[cat_key],
            piso_id=pisos[f"{ed_key}-{piso_num}"],
            latitud=lat, longitud=lon,
            activo=True, notas=notas,
        )
        db.add(e)
        db.flush()
        count += 1
        return e.id

    def add_hrs(espacio_id, turnos):
        for dia, apertura, cierre in turnos:
            db.add(Horario(espacio_id=espacio_id, dia_semana=dia,
                           hora_apertura=apertura, hora_cierre=cierre))

    def add_con(espacio_id, tipo, valor):
        db.add(Contacto(espacio_id=espacio_id, tipo=tipo, valor=valor))

    def add_srv(espacio_id, desc):
        db.add(ServicioEspacio(espacio_id=espacio_id, descripcion=desc))

    H_AULA = lv("08:00", "19:30")
    H_BANO = lv("08:00", "19:30")
    H_OFIC = lv("08:00", "18:00")
    H_GIM  = lv("08:00", "19:45")

    # ══════════════════════════════════════════════════════════════════════════
    # EDIFICIO A
    # ══════════════════════════════════════════════════════════════════════════
    print("Procesando Edificio A...")

    eid = add_esp("A-101","Audiovisual A","Audiovisual","A","PB",31.492270,-106.415795)
    add_hrs(eid, H_AULA)

    eid = add_esp("A-103","Baño Mujeres A-PB-1","Baño Mujeres","A","PB",31.492299,-106.415704)
    add_hrs(eid, H_BANO)
    eid = add_esp("A-104","Baño Hombres A-PB-1","Baño Hombres","A","PB",31.492299,-106.415704)
    add_hrs(eid, H_BANO)

    for codigo, lat, lon in [
        ("A-106",31.492313,-106.415642),("A-107",31.492302,-106.415559),
        ("A-108",31.492272,-106.415473),("A-126",31.491853,-106.415889),
        ("A-127",31.491908,-106.415935),("A-128",31.491966,-106.415943),
        ("A-132",31.492107,-106.415956),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "A", "PB", lat, lon)
        add_hrs(eid, H_AULA)

    eid = add_esp("A-110","CBU","Oficina Administrativa","A","PB",31.492139,-106.415594,
                  "Ayuda con psicoterapia, becas, objetos extraviados, información general, canalización psicológica")
    add_hrs(eid, lv("08:00","20:00"))
    add_con(eid,"telefono","656-688-2100")
    for s in ["Psicoterapia","Becas","Objetos extraviados","Información general","Canalización psicológica"]:
        add_srv(eid, s)

    eid = add_esp("A-111","UAMI Edificio A","Servicio Médico","A","PB",31.492025,-106.415409,
                  "Servicio médico de atención inicial")
    add_hrs(eid, lv("08:00","20:00"))
    add_con(eid,"telefono","656-688-2100"); add_con(eid,"correo","uami.cu@uacj.mx")
    for s in ["Migraña","Sutura","Inmovilización","Curaciones","Presión arterial","Glucosa","Seguro estudiantil"]:
        add_srv(eid, s)

    eid = add_esp("A-113","Baño Hombres A-PB-2","Baño Hombres","A","PB",31.491986,-106.415403)
    add_hrs(eid, H_BANO)
    eid = add_esp("A-114","Cafetería Edificio A","Cafetería","A","PB",31.491847,-106.415420)
    add_hrs(eid, lv("08:00","18:00"))
    eid = add_esp("A-115","Baño Mujeres A-PB-2","Baño Mujeres","A","PB",31.491869,-106.415564)
    add_hrs(eid, H_BANO)

    eid = add_esp("A-117","Librería Tienda UACJ","Otro","A","PB",31.491869,-106.415605)
    add_hrs(eid, lv("08:00","18:00"))
    add_srv(eid,"Venta de artículos UACJ"); add_srv(eid,"Libros y papelería")

    eid = add_esp("A-118","Galería Cultural","Otro","A","PB",31.492002,-106.415803)
    add_hrs(eid, H_AULA)
    eid = add_esp("A-119","Patio Interior A","Zona de Estudio","A","PB",31.491991,-106.415615)
    eid = add_esp("A-130","Baño Hombres A-PB-3","Baño Hombres","A","PB",31.491993,-106.415961)
    add_hrs(eid, H_BANO)
    eid = add_esp("A-131","Baño Mujeres A-PB-3","Baño Mujeres","A","PB",31.491993,-106.415961)
    add_hrs(eid, H_BANO)

    for codigo, lat, lon in [
        ("A-201",31.491853,-106.415889),("A-202",31.491908,-106.415935),
        ("A-203",31.491966,-106.415943),("A-207",31.492107,-106.415956),
        ("A-208",31.492270,-106.415795),("A-213",31.492313,-106.415642),
        ("A-214",31.492302,-106.415559),("A-215",31.492272,-106.415473),
        ("A-216",31.492119,-106.415688),("A-217",31.492116,-106.415546),
        ("A-218",31.492057,-106.415457),("A-219",31.492016,-106.415406),
        ("A-225",31.491904,-106.415597),("A-226",31.491904,-106.415658),
        ("A-227",31.491966,-106.415747),("A-228",31.492041,-106.415798),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "A", "1", lat, lon)
        add_hrs(eid, H_AULA)

    eid = add_esp("A-205","Baño Hombres A-P1-1","Baño Hombres","A","1",31.491993,-106.415961); add_hrs(eid,H_BANO)
    eid = add_esp("A-206","Baño Mujeres A-P1-1","Baño Mujeres","A","1",31.491993,-106.415961); add_hrs(eid,H_BANO)
    eid = add_esp("A-210","Baño Hombres A-P1-2","Baño Hombres","A","1",31.492299,-106.415704); add_hrs(eid,H_BANO)
    eid = add_esp("A-211","Baño Mujeres A-P1-2","Baño Mujeres","A","1",31.492299,-106.415704); add_hrs(eid,H_BANO)
    eid = add_esp("A-221","Baño Hombres A-P1-3","Baño Hombres","A","1",31.491986,-106.415403); add_hrs(eid,H_BANO)
    eid = add_esp("A-223","Baño Mujeres A-P1-3","Baño Mujeres","A","1",31.491869,-106.415564); add_hrs(eid,H_BANO)
    eid = add_esp("A-222","Sala de Apoyo Didáctico Docentes A","Oficina Administrativa","A","1",31.491918,-106.415465)
    add_hrs(eid,H_OFIC)
    eid = add_esp("A-EST1-P1","Zona de Estudio A P1-1","Zona de Estudio","A","1",31.492091,-106.415508)
    eid = add_esp("A-EST2-P1","Zona de Estudio A P1-2","Zona de Estudio","A","1",31.491929,-106.415709)

    for codigo, lat, lon in [
        ("A-301",31.491966,-106.415747),("A-302",31.492041,-106.415798),
        ("A-303",31.492119,-106.415688),("A-304",31.492116,-106.415546),
        ("A-306",31.492057,-106.415457),("A-307",31.492016,-106.415406),
        ("A-313",31.491904,-106.415597),("A-314",31.491904,-106.415658),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "A", "2", lat, lon)
        add_hrs(eid, H_AULA)

    eid = add_esp("A-309","Baño Hombres A-P2","Baño Hombres","A","2",31.491986,-106.415403); add_hrs(eid,H_BANO)
    eid = add_esp("A-311","Baño Mujeres A-P2","Baño Mujeres","A","2",31.491869,-106.415564); add_hrs(eid,H_BANO)
    eid = add_esp("A-310","Sala Multifuncional Docentes A","Oficina Administrativa","A","2",31.491918,-106.415465)
    add_hrs(eid,H_OFIC)
    eid = add_esp("A-EST1-P2","Zona de Estudio A P2-1","Zona de Estudio","A","2",31.492091,-106.415508)
    eid = add_esp("A-EST2-P2","Zona de Estudio A P2-2","Zona de Estudio","A","2",31.491929,-106.415709)
    db.commit()
    print(f"  A: {count} espacios"); count_a = count; count = 0

    # ══════════════════════════════════════════════════════════════════════════
    # EDIFICIO B
    # ══════════════════════════════════════════════════════════════════════════
    print("Procesando Edificio B...")

    for codigo, nombre, lat, lon in [
        ("B-101-B","Salón B-101-B",31.493813,-106.414016),
        ("B-101-C","Salón B-101-C",31.493813,-106.414141),
        ("B-101-D","Salón B-101-D",31.493813,-106.414172),
        ("B-101-E","Salón B-101-E",31.493837,-106.414172),
        ("B-101-F","Salón B-101-F",31.493837,-106.414078),
        ("B-101-G","Salón B-101-G",31.493837,-106.414016),
        ("B-101-H","Salón B-101-H",31.493813,-106.413953),
        ("B-109",  "Salón B-109",  31.493787,-106.413672),
        ("B-110",  "Salón B-110",  31.493787,-106.413547),
        ("B-111",  "Salón B-111",  31.493787,-106.413516),
        ("B-115",  "Salón B-115",  31.493813,-106.413453),
        ("B-116",  "Salón B-116",  31.493813,-106.413484),
    ]:
        eid = add_esp(codigo, nombre, "Aula", "B", "PB", lat, lon); add_hrs(eid, H_AULA)

    eid = add_esp("B-106","Baño Mujeres B-PB-1","Baño Mujeres","B","PB",31.493762,-106.413766); add_hrs(eid,H_BANO)
    eid = add_esp("B-108","Baño Hombres B-PB-1","Baño Hombres","B","PB",31.493762,-106.413766); add_hrs(eid,H_BANO)
    eid = add_esp("B-118","Baño Mujeres B-PB-2","Baño Mujeres","B","PB",31.493738,-106.413672); add_hrs(eid,H_BANO)
    eid = add_esp("B-120","Baño Hombres B-PB-2","Baño Hombres","B","PB",31.493738,-106.413672); add_hrs(eid,H_BANO)
    eid = add_esp("B-CAS","Casilleros Edificio B","Otro","B","PB",31.493713,-106.413984)
    eid = add_esp("B-EST","Zona de Estudio B","Zona de Estudio","B","PB",31.493787,-106.413672)

    for codigo, nombre, lat, lon in [
        ("B-206",  "Salón B-206",               31.493738,-106.413766),
        ("B-207",  "Salón Multifuncional B-207", 31.493787,-106.413641),
        ("B-221",  "Salón B-221",               31.493738,-106.413703),
        ("B-222",  "Salón B-222",               31.493713,-106.413703),
        ("B-223-B","Salón B-223-B",             31.493837,-106.413953),
        ("B-223-C","Salón B-223-C",             31.493837,-106.414047),
        ("B-223-D","Salón B-223-D",             31.493837,-106.414203),
        ("B-223-E","Salón B-223-E",             31.493813,-106.414172),
        ("B-223-F","Salón B-223-F",             31.493813,-106.414109),
        ("B-223-G","Salón B-223-G",             31.493837,-106.414047),
        ("B-223-H","Salón B-223-H",             31.493787,-106.413953),
    ]:
        eid = add_esp(codigo, nombre, "Aula", "B", "1", lat, lon); add_hrs(eid, H_AULA)

    eid = add_esp("B-208","Centro de Cómputo B-1","Laboratorio","B","1",31.493787,-106.413484)
    add_hrs(eid,H_AULA); add_srv(eid,"Computadoras con acceso a internet"); add_srv(eid,"Impresión")
    eid = add_esp("B-210","Centro de Cómputo B-2","Laboratorio","B","1",31.493813,-106.413422)
    add_hrs(eid,H_AULA); add_srv(eid,"Computadoras con acceso a internet"); add_srv(eid,"Impresión")
    eid = add_esp("B-209","Cubículo Docentes B","Oficina Administrativa","B","1",31.493813,-106.413453); add_hrs(eid,H_OFIC)
    eid = add_esp("B-211","Tutora de Guardia B","Oficina Administrativa","B","1",31.493813,-106.413328); add_hrs(eid,H_OFIC)
    eid = add_esp("B-203","Baño Mujeres B-P1-1","Baño Mujeres","B","1",31.493837,-106.413734); add_hrs(eid,H_BANO)
    eid = add_esp("B-205","Baño Hombres B-P1-1","Baño Hombres","B","1",31.493837,-106.413734); add_hrs(eid,H_BANO)
    eid = add_esp("B-213","Baño Mujeres B-P1-2","Baño Mujeres","B","1",31.493787,-106.413422); add_hrs(eid,H_BANO)
    eid = add_esp("B-215","Baño Hombres B-P1-2","Baño Hombres","B","1",31.493787,-106.413422); add_hrs(eid,H_BANO)
    eid = add_esp("B-218","Baño Mujeres B-P1-3","Baño Mujeres","B","1",31.493762,-106.413578); add_hrs(eid,H_BANO)
    eid = add_esp("B-220","Baño Hombres B-P1-3","Baño Hombres","B","1",31.493762,-106.413578); add_hrs(eid,H_BANO)

    for codigo, nombre, lat, lon in [
        ("B-301",  "Salón B-301",   31.493713,-106.413766),
        ("B-302",  "Salón B-302",   31.493713,-106.413766),
        ("B-303",  "Salón B-303",   31.493837,-106.413734),
        ("B-304",  "Salón B-304",   31.493837,-106.413734),
        ("B-305",  "Salón B-305",   31.493837,-106.413734),
        ("B-306",  "Salón B-306",   31.493738,-106.413766),
        ("B-307",  "Salón B-307",   31.493787,-106.413609),
        ("B-320",  "Salón B-320",   31.493713,-106.413703),
        ("B-321",  "Salón B-321",   31.493738,-106.413703),
        ("B-322",  "Salón B-322",   31.493713,-106.413703),
        ("B-323-B","Salón B-323-B", 31.493837,-106.413953),
        ("B-323-C","Salón B-323-C", 31.493837,-106.414047),
        ("B-323-D","Salón B-323-D", 31.493837,-106.414203),
        ("B-322-E","Salón B-322-E", 31.493813,-106.414172),
        ("B-322-F","Salón B-322-F", 31.493813,-106.414109),
        ("B-322-G","Salón B-322-G", 31.493837,-106.414047),
    ]:
        eid = add_esp(codigo, nombre, "Aula", "B", "2", lat, lon); add_hrs(eid, H_AULA)

    eid = add_esp("B-308","Sala Descanso Docentes B","Oficina Administrativa","B","2",31.493762,-106.413578); add_hrs(eid,H_OFIC)
    eid = add_esp("B-309","Sala Multifuncional Docentes B","Oficina Administrativa","B","2",31.493762,-106.413484); add_hrs(eid,H_OFIC)
    eid = add_esp("B-312","Baño Mujeres B-P2","Baño Mujeres","B","2",31.493762,-106.413453); add_hrs(eid,H_BANO)
    eid = add_esp("B-314","Baño Hombres B-P2","Baño Hombres","B","2",31.493762,-106.413453); add_hrs(eid,H_BANO)
    db.commit()
    print(f"  B: {count} espacios"); count_b = count; count = 0

    # ══════════════════════════════════════════════════════════════════════════
    # EDIFICIO C
    # ══════════════════════════════════════════════════════════════════════════
    print("Procesando Edificio C...")

    eid = add_esp("C-129","Oficinas Administrativas C","Oficina Administrativa","C","PB",
                  31.493060,-106.414232,
                  "Jefatura vinculación, servicio social, prácticas profesionales, movilidad estudiantil")
    add_hrs(eid,H_OFIC)
    add_con(eid,"telefono","656-688-2100 ext. 6534"); add_con(eid,"correo","jescuder@uacj.mx")
    for s in ["Servicio social","Prácticas profesionales","Movilidad estudiantil","Vinculación"]:
        add_srv(eid,s)

    eid = add_esp("C-124","Audiovisual C","Audiovisual","C","PB",31.493040,-106.414285); add_hrs(eid,H_AULA)
    eid = add_esp("C-BM-PB","Baño Mujeres C-PB","Baño Mujeres","C","PB",31.493013,-106.414349); add_hrs(eid,H_BANO)
    eid = add_esp("C-BH-PB","Baño Hombres C-PB","Baño Hombres","C","PB",31.493020,-106.414450); add_hrs(eid,H_BANO)
    eid = add_esp("C-CAF","Cafetería Edificio C","Cafetería","C","PB",31.493040,-106.414605); add_hrs(eid,lv("08:00","18:00"))

    for codigo, lat, lon in [
        ("C-204",31.493007,-106.414343),("C-205",31.493013,-106.414274),
        ("C-206",31.493055,-106.414131),("C-207",31.493060,-106.414130),
        ("C-209",31.493065,-106.414123),("C-210",31.493047,-106.414132),
        ("C-221",31.493005,-106.414415),("C-222",31.493022,-106.414453),
        ("C-223-B",31.493047,-106.414592),("C-223-C",31.493035,-106.414673),
        ("C-223-D",31.493099,-106.414792),("C-223-E",31.493074,-106.414781),
        ("C-223-F",31.493062,-106.414710),("C-223-G",31.493055,-106.414671),
        ("C-223-H",31.493037,-106.414535),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "C", "1", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("C-BH-P1-1","Baño Hombres C-P1-1","Baño Hombres","C","1",31.493030,-106.414390); add_hrs(eid,H_BANO)
    eid = add_esp("C-BH-P1-2","Baño Hombres C-P1-2","Baño Hombres","C","1",31.493000,-106.414271); add_hrs(eid,H_BANO)
    eid = add_esp("C-BH-P1-3","Baño Hombres C-P1-3","Baño Hombres","C","1",31.493053,-106.414133); add_hrs(eid,H_BANO)
    eid = add_esp("C-PREST","Sala de Préstamo C","Oficina Administrativa","C","1",31.492995,-106.414219)
    add_hrs(eid,H_OFIC); add_srv(eid,"Préstamo de equipos"); add_srv(eid,"Atención a estudiantes")

    for codigo, lat, lon in [
        ("C-304",31.493084,-106.414451),("C-306",31.493081,-106.414453),
        ("C-307",31.493072,-106.414455),("C-308-B",31.493031,-106.414575),
        ("C-308-C",31.493061,-106.414482),("C-308-D",31.493054,-106.414790),
        ("C-308-E",31.493067,-106.414797),("C-308-F",31.493032,-106.414795),
        ("C-308-G",31.493042,-106.414663),("C-308-H",31.493047,-106.414619),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "C", "2", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("C-BH-P2","Baño Hombres C-P2","Baño Hombres","C","2",31.493022,-106.414491); add_hrs(eid,H_BANO)
    db.commit()
    print(f"  C: {count} espacios"); count_c = count; count = 0

    # ══════════════════════════════════════════════════════════════════════════
    # EDIFICIO D
    # ══════════════════════════════════════════════════════════════════════════
    print("Procesando Edificio D...")

    for codigo, nombre, lat, lon in [
        ("D1-101","Laboratorio de Electrónica D1-101",31.491333,-106.413918),
        ("D1-105","Laboratorio de Electrónica D1-105",31.491499,-106.413806),
        ("D1-115","Laboratorio de Física",            31.491330,-106.413785),
        ("D1-111","Taller de Fotografía",             31.491508,-106.413805),
        ("D1-112","Taller de Serigrafía",             31.491508,-106.413805),
    ]:
        eid = add_esp(codigo, nombre, "Laboratorio", "D", "PB", lat, lon); add_hrs(eid,H_AULA)

    for codigo, nombre, lat, lon in [
        ("D1-106","Salón D1-106",    31.491520,-106.413985),
        ("D1-107","Digitales D1-107",31.491511,-106.413796),
        ("D1-114","Salón D1-114",    31.491493,-106.413802),
    ]:
        eid = add_esp(codigo, nombre, "Aula", "D", "PB", lat, lon); add_hrs(eid,H_AULA)

    for codigo, nombre, lat, lon in [
        ("D2-101","Laboratorio de Manufactura",                       31.491259,-106.414282),
        ("D2-102","Laboratorio de Mecatrónica",                       31.491253,-106.414296),
        ("D2-104","Laboratorio de Sistemas Hidráulicos y Neumáticos", 31.491253,-106.414293),
        ("D2-105","Taller de Maquetas",                               31.491259,-106.414282),
    ]:
        eid = add_esp(codigo, nombre, "Laboratorio", "D", "PB", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D2-106","Baño Mujeres D2-PB","Baño Mujeres","D","PB",31.491242,-106.414045); add_hrs(eid,H_BANO)
    eid = add_esp("D2-108","Baño Hombres D2-PB","Baño Hombres","D","PB",31.491242,-106.414045); add_hrs(eid,H_BANO)

    for codigo, nombre, lat, lon in [
        ("D3-102","Laboratorio de Habilidades Motrices",                        31.491041,-106.413814),
        ("D3-103","Laboratorio de Ciencia, Tecnología Alimentaria y Nutrición", 31.490735,-106.413838),
        ("D3-104","Laboratorio de Evaluación y Diagnóstico Nutricional",        31.490700,-106.413849),
        ("D3-105","Laboratorio de Gastronomía",                                 31.490809,-106.413931),
        ("D3-107","Laboratorio de Sistemas Automotrices",                       31.491047,-106.413830),
    ]:
        eid = add_esp(codigo, nombre, "Laboratorio", "D", "PB", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D3-109","Baño Mujeres D3-PB","Baño Mujeres","D","PB",31.491037,-106.413829); add_hrs(eid,H_BANO)
    eid = add_esp("D3-111","Baño Hombres D3-PB","Baño Hombres","D","PB",31.491037,-106.413829); add_hrs(eid,H_BANO)
    eid = add_esp("D3-BEB","Bebederos D3","Otro","D","PB",31.491048,-106.413821)

    for codigo, lat, lon in [
        ("D4-106",31.491182,-106.413517),("D4-107",31.491229,-106.413500),
        ("D4-108",31.491189,-106.413441),("D4-109",31.491181,-106.413433),
        ("D4-110",31.491191,-106.413409),("D4-112",31.491181,-106.413433),
        ("D4-113",31.491189,-106.413441),("D4-114",31.491229,-106.413500),
        ("D4-115",31.491182,-106.413517),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "D", "PB", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D-MERC","Mercadito D","Cafetería","D","PB",31.491172,-106.413800); add_hrs(eid,lv("08:00","18:00"))

    for codigo, lat, lon in [
        ("D1-205",31.491537,-106.413823),("D1-207",31.491512,-106.413868),
        ("D1-208",31.491481,-106.413788),("D1-209",31.491433,-106.413831),
        ("D1-211",31.491392,-106.413906),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "D", "1", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D1-201","Baño Hombres D1-P1","Baño Hombres","D","1",31.491493,-106.413868); add_hrs(eid,H_BANO)
    eid = add_esp("D1-203","Baño Mujeres D1-P1","Baño Mujeres","D","1",31.491482,-106.413797); add_hrs(eid,H_BANO)

    for codigo, nombre, lat, lon in [
        ("D2-209","Laboratorio de Diseño Asistido por Computadora",31.491103,-106.414164),
        ("D2-210","Laboratorio de Cómputo Avanzado",               31.491121,-106.414191),
        ("D2-212","Laboratorio de Ergonomía y Métodos",            31.491145,-106.414202),
    ]:
        eid = add_esp(codigo, nombre, "Laboratorio", "D", "1", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D2-207","Aula de Cómputo D2","Laboratorio","D","1",31.491205,-106.414047)
    add_hrs(eid,H_AULA); add_srv(eid,"Computadoras con acceso a internet")

    eid = add_esp("D2-206","Sala Multiusos y Préstamo D2","Oficina Administrativa","D","1",31.491178,-106.414139)
    add_hrs(eid,H_OFIC); add_srv(eid,"Préstamo de proyectores"); add_srv(eid,"Préstamo de laptops")

    eid = add_esp("D2-202","Baño Mujeres D2-P1","Baño Mujeres","D","1",31.491197,-106.414007); add_hrs(eid,H_BANO)
    eid = add_esp("D2-204","Baño Hombres D2-P1","Baño Hombres","D","1",31.491193,-106.413952); add_hrs(eid,H_BANO)

    for codigo, nombre, lat, lon in [
        ("D3-209","Laboratorio de Bioquímica",                 31.490786,-106.413760),
        ("D3-210","Laboratorio de Toxicología y Farmacología", 31.490811,-106.413677),
        ("D3-211","Laboratorio de Habilidades de Enfermería",  31.490647,-106.413872),
        ("D3-212","Cámara de Gesell",                          31.491014,-106.413793),
        ("D3-207","Centro de Simulación de Negocios",          31.490995,-106.413782),
    ]:
        eid = add_esp(codigo, nombre, "Laboratorio", "D", "1", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D3-203","Sala de Maestros D3","Oficina Administrativa","D","1",31.491103,-106.413615); add_hrs(eid,H_OFIC)

    for codigo, lat, lon in [
        ("D4-208",31.491236,-106.413420),("D4-212",31.491210,-106.413383),("D4-214",31.491259,-106.413416),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "D", "1", lat, lon); add_hrs(eid,H_AULA)

    eid = add_esp("D4-207","Sala de Impresiones D4","Impresoras","D","1",31.491156,-106.413538)
    add_hrs(eid,H_OFIC); add_srv(eid,"Impresión"); add_srv(eid,"Copiado")

    eid = add_esp("D3-305","Biblioteca D3","Biblioteca","D","2",31.491045,-106.413712)
    add_hrs(eid,lv("08:00","19:30"))
    add_srv(eid,"Préstamo de libros"); add_srv(eid,"Sala de lectura"); add_srv(eid,"Acceso a internet")

    eid = add_esp("D3-301","Laboratorio de Radio y Revisión","Laboratorio","D","2",31.491101,-106.413607); add_hrs(eid,H_AULA)
    eid = add_esp("D3-306","Sala de Juicios Orales","Laboratorio","D","2",31.491015,-106.413737); add_hrs(eid,H_AULA)

    for codigo, lat, lon in [
        ("D4-308",31.491164,-106.413511),("D4-309",31.491176,-106.413517),
        ("D4-311",31.491183,-106.413460),("D4-312",31.491184,-106.413421),
        ("D4-313",31.491184,-106.413430),("D4-315",31.491180,-106.413503),
        ("D4-316",31.491171,-106.413514),("D4-317",31.491168,-106.413496),
    ]:
        eid = add_esp(codigo, f"Salón {codigo}", "Aula", "D", "2", lat, lon); add_hrs(eid,H_AULA)

    db.commit()
    print(f"  D: {count} espacios"); count_d = count; count = 0

    # ══════════════════════════════════════════════════════════════════════════
    # GIMNASIO
    # ══════════════════════════════════════════════════════════════════════════
    print("Procesando Gimnasio...")

    eid = add_esp("GIM-E108","Sala de Halterofilia","Otro","GIM","PB",*dms(31,29,36.7766,106,24,58.1606)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E103","Baño Mujeres Gimnasio PB-1","Baño Mujeres","GIM","PB",*dms(31,29,36.2862,106,25,0.1766)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E104","Baño Hombres Gimnasio PB-1","Baño Hombres","GIM","PB",*dms(31,29,36.2862,106,25,0.1766)); add_hrs(eid,H_GIM)

    eid = add_esp("GIM-E106A","Sala de Caminadoras","Otro","GIM","PB",*dms(31,29,36.7767,106,24,57.9515))
    add_hrs(eid,H_GIM); add_srv(eid,"Caminadoras eléctricas")

    eid = add_esp("GIM-E106B","Sala de Máquinas","Otro","GIM","PB",*dms(31,29,36.7927,106,24,58.4228))
    add_hrs(eid,H_GIM); add_srv(eid,"Máquinas de ejercicio")

    eid = add_esp("GIM-E110","Sala de Calistenia","Otro","GIM","PB",*dms(31,29,36.308,106,24,58.358)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E105","Responsable Gimnasio","Oficina Administrativa","GIM","PB",31.493420,-106.416300)
    add_hrs(eid,lv("08:00","15:00"))

    eid = add_esp("GIM-E111","Canchas Polideportivas","Otro","GIM","PB",*dms(31,29,36.6551,106,24,59.2708))
    add_hrs(eid,H_GIM); add_srv(eid,"Basketball"); add_srv(eid,"Voleibol")

    eid = add_esp("GIM-E112","Alberca Olímpica","Otro","GIM","PB",*dms(31,29,36.1000,106,24,58.666)); add_hrs(eid,H_GIM)

    eid = add_esp("GIM-E112E","UAMI Gimnasio","Servicio Médico","GIM","PB",*dms(31,29,36.125,106,24,58.358))
    add_hrs(eid,lv("08:00","15:45")); add_srv(eid,"Atención médica inicial")

    eid = add_esp("GIM-E112A","Baño Mujeres Gimnasio PB-2","Baño Mujeres","GIM","PB",*dms(31,29,36.175,106,24,59.785)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E112D","Baño Hombres Gimnasio PB-2","Baño Hombres","GIM","PB",*dms(31,29,36.175,106,24,59.785)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E112R","Baño Mujeres Gimnasio PB-3","Baño Mujeres","GIM","PB",*dms(31,29,36.125,106,24,58.358)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E112G","Baño Hombres Gimnasio PB-3","Baño Hombres","GIM","PB",*dms(31,29,36.125,106,24,58.358)); add_hrs(eid,H_GIM)

    eid = add_esp("GIM-E207","Jefatura Deporte Interno y Estadística","Oficina Administrativa","GIM","1",*dms(31,29,36.632,106,24,59.689))
    add_hrs(eid,lv("08:00","15:45"))

    eid = add_esp("GIM-E205","Laboratorio de Fisiología del Ejercicio","Laboratorio","GIM","1",*dms(31,29,36.632,106,24,59.689))
    for d in [0,1,2,3]:
        db.add(Horario(espacio_id=eid, dia_semana=d, hora_apertura=time(8,0), hora_cierre=time(19,45)))
    add_srv(eid,"Fisiología del ejercicio"); add_srv(eid,"Terapia física y rehabilitación")

    eid = add_esp("GIM-E202","Baño Hombres Gimnasio P1","Baño Hombres","GIM","1",*dms(31,29,36.7062,106,24,58.9691)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E201","Baño Mujeres Gimnasio P1","Baño Mujeres","GIM","1",*dms(31,29,36.7062,106,24,58.9691)); add_hrs(eid,H_GIM)

    eid = add_esp("GIM-E203","Sala de Elípticas","Otro","GIM","1",*dms(31,29,36.612,106,24,59.223))
    add_hrs(eid,H_GIM); add_srv(eid,"Elípticas")

    eid = add_esp("GIM-E204","Sala de Bicicletas Estáticas","Otro","GIM","1",*dms(31,29,36.612,106,24,59.223))
    add_hrs(eid,H_GIM); add_srv(eid,"Bicicletas estáticas")

    eid = add_esp("GIM-E208","Gradas de Canchas","Otro","GIM","1",*dms(31,29,36.6708,106,24,59.2231)); add_hrs(eid,H_GIM)
    eid = add_esp("GIM-E209","Gradas de Alberca","Otro","GIM","1",*dms(31,29,36.6708,106,24,59.2231)); add_hrs(eid,H_GIM)

    db.commit()
    print(f"  Gimnasio: {count} espacios"); count_gim = count

    # ── Administrador ─────────────────────────────────────────────────────────
    _actualizar_admin(db)

    total = count_a + count_b + count_c + count_d + count_gim
    print(f"\nSeed inicial completado exitosamente")
    print(f"  Categorías  : {len(CATEGORIAS_DATA)}")
    print(f"  Edificios   : {len(EDIFICIOS_DATA)}")
    print(f"  Espacios    : {total}")
    print(f"    Edificio A  : {count_a}")
    print(f"    Edificio B  : {count_b}")
    print(f"    Edificio C  : {count_c}")
    print(f"    Edificio D  : {count_d}")
    print(f"    Gimnasio    : {count_gim}")
    print(f"  Admin       : {ADMIN_USERNAME}")


# ══════════════════════════════════════════════════════════════════════════════
# PUNTO DE ENTRADA
# ══════════════════════════════════════════════════════════════════════════════

def run():
    db = SessionLocal()
    try:
        force_seed = os.getenv("FORCE_SEED", "").lower() == "true"

        tiene_eventos    = db.query(Evento).first()    is not None
        tiene_categorias = db.query(Categoria).first() is not None

        if force_seed:
            print("=" * 55)
            print("MODO: SEED FORZADO (FORCE_SEED=true)")
            print("ADVERTENCIA: Se borrarán todos los datos excepto eventos.")
            print("=" * 55)
            _seed_inicial(db)
        elif tiene_eventos or tiene_categorias:
            print("=" * 55)
            print("MODO: ACTUALIZACIÓN (base de datos con datos existentes)")
            print("Los eventos NO serán eliminados.")
            print("=" * 55)
            _actualizar_datos(db)
        else:
            print("=" * 55)
            print("MODO: SEED INICIAL (base de datos vacía)")
            print("=" * 55)
            _seed_inicial(db)
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()

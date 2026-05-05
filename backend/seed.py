"""
Seed completo con datos reales del Campus Ciudad Universitaria UACJ.
Fuente: RecampoCU_v4.xlsx
Ejecutar: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import SessionLocal
from app.models import (
    Categoria, Edificio, Piso, Espacio, Horario,
    Contacto, ServicioEspacio, FotoEspacio, Evento, Administrador,
)
from app.auth.hashing import hash_password
from datetime import time


# ── helpers ───────────────────────────────────────────────────────────────────

def lv(apertura: str, cierre: str):
    """Horarios lunes-viernes (dias 0-4)."""
    ha, ma = map(int, apertura.split(":"))
    hc, mc = map(int, cierre.split(":"))
    return [(d, time(ha, ma), time(hc, mc)) for d in range(5)]


def dms(lat_d, lat_m, lat_s, lon_d, lon_m, lon_s):
    """Grados-Minutos-Segundos → Grados decimales."""
    lat = lat_d + lat_m / 60 + lat_s / 3600
    lon = -(lon_d + lon_m / 60 + lon_s / 3600)
    return round(lat, 6), round(lon, 6)


# ── main ──────────────────────────────────────────────────────────────────────

def run():
    db = SessionLocal()
    try:
        # ── Limpiar datos anteriores ──────────────────────────────────────────
        print("Limpiando datos anteriores...")
        db.query(FotoEspacio).delete()
        db.query(ServicioEspacio).delete()
        db.query(Contacto).delete()
        db.query(Horario).delete()
        db.query(Evento).delete()
        db.query(Espacio).delete()
        db.query(Piso).delete()
        db.query(Edificio).delete()
        db.query(Categoria).delete()
        db.query(Administrador).delete()
        db.commit()

        # Resetear secuencias para que IDs empiecen desde 1
        tablas = [
            "categorias", "edificios", "pisos", "espacios",
            "horarios", "contactos", "servicios_espacio",
            "fotos_espacio", "eventos", "administradores",
        ]
        for tabla in tablas:
            db.execute(text(
                f"ALTER SEQUENCE {tabla}_id_seq RESTART WITH 1"
            ))
        db.commit()
        print("OK Datos anteriores eliminados y secuencias reseteadas")

        # ── Categorias ────────────────────────────────────────────────────────
        print("Creando categorias...")
        cats = {}
        categorias_data = [
            ("Aula",                    "🏫", "#4A90E2"),
            ("Laboratorio",             "🔬", "#7B68EE"),
            ("Taller",                  "🔧", "#E67E22"),
            ("Oficina Administrativa",  "🏢", "#F5A623"),
            ("Servicios Estudiantiles", "🎓", "#27AE60"),
            ("Cafeteria",               "☕", "#D0021B"),
            ("Biblioteca",              "📚", "#2D7D46"),
            ("Baño Hombres",            "🚹", "#1565C0"),
            ("Baño Mujeres",            "🚺", "#C2185B"),
            ("Impresoras",              "🖨",  "#8B572A"),
            ("Zona de Estudio",         "📖", "#00897B"),
            ("Sala de Descanso",        "🛋",  "#95A5A6"),
            ("Servicio Medico",         "🏥", "#B71C1C"),
            ("Audiovisual",             "🎬", "#6A1B9A"),
            ("Deportes",                "⚽", "#16A085"),
            ("Otro",                    "📍", "#757575"),
        ]
        for nombre, icono, color in categorias_data:
            c = Categoria(nombre=nombre, icono=icono, color_hex=color)
            db.add(c)
            db.flush()
            cats[nombre] = c.id
        db.commit()
        print(f"OK {len(cats)} categorias creadas")

        # ── Edificios ─────────────────────────────────────────────────────────
        print("Creando edificios...")
        eds = {}
        edificios_data = [
            ("A",   "Edificio A", "Edificio A del Campus CU UACJ", 31.492003, -106.415700),
            ("B",   "Edificio B", "Edificio B del Campus CU UACJ", 31.493762, -106.413766),
            ("C",   "Edificio C", "Edificio C del Campus CU UACJ", 31.493050, -106.414430),
            ("D",   "Edificio D", "Complejo D1-D2-D3-D4 del Campus CU UACJ", 31.491200, -106.413850),
            ("GIM", "Gimnasio",   "Gimnasio del Campus CU UACJ",   31.493420, -106.416300),
        ]
        for codigo, nombre, desc, lat, lon in edificios_data:
            e = Edificio(codigo=codigo, nombre=nombre, descripcion=desc, latitud=lat, longitud=lon)
            db.add(e)
            db.flush()
            eds[codigo] = e.id
        db.commit()
        print(f"OK {len(eds)} edificios creados")

        # ── Pisos ─────────────────────────────────────────────────────────────
        print("Creando pisos...")
        pisos = {}
        for ed_codigo in ["A", "B", "C", "D", "GIM"]:
            for numero in ["PB", "1", "2", "3"]:
                p = Piso(edificio_id=eds[ed_codigo], numero=numero)
                db.add(p)
                db.flush()
                pisos[f"{ed_codigo}-{numero}"] = p.id
        db.commit()
        print(f"OK {len(pisos)} pisos creados")

        # ── helpers de insercion ──────────────────────────────────────────────
        count = 0

        def add_espacio(codigo, nombre, cat_key, ed_key, piso_num, lat, lon, notas=None):
            e = Espacio(
                codigo=codigo,
                nombre=nombre,
                categoria_id=cats[cat_key],
                piso_id=pisos[f"{ed_key}-{piso_num}"],
                latitud=lat,
                longitud=lon,
                activo=True,
                notas=notas,
            )
            db.add(e)
            db.flush()
            return e.id

        def add_horarios(espacio_id, turnos):
            for dia, apertura, cierre in turnos:
                db.add(Horario(
                    espacio_id=espacio_id,
                    dia_semana=dia,
                    hora_apertura=apertura,
                    hora_cierre=cierre,
                ))

        def add_contacto(espacio_id, tipo, valor):
            db.add(Contacto(espacio_id=espacio_id, tipo=tipo, valor=valor))

        def add_servicio(espacio_id, desc):
            db.add(ServicioEspacio(espacio_id=espacio_id, descripcion=desc))

        H_AULA  = lv("08:00", "19:30")
        H_Baño  = lv("08:00", "19:30")
        H_OFIC  = lv("08:00", "18:00")
        H_GIM   = lv("08:00", "19:45")

        # ══════════════════════════════════════════════════════════════════════
        # EDIFICIO A
        # ══════════════════════════════════════════════════════════════════════
        print("Procesando Edificio A...")

        # — PB —
        eid = add_espacio("A-101", "Audiovisual A", "Audiovisual", "A", "PB", 31.492270, -106.415795)
        add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("A-103", "Baño Mujeres A-PB-1", "Baño Mujeres", "A", "PB", 31.492299, -106.415704)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("A-104", "Baño Hombres A-PB-1", "Baño Hombres", "A", "PB", 31.492299, -106.415704)
        add_horarios(eid, H_Baño); count += 1

        for codigo, lat, lon in [
            ("A-106", 31.492313, -106.415642),
            ("A-107", 31.492302, -106.415559),
            ("A-108", 31.492272, -106.415473),
            ("A-126", 31.491853, -106.415889),
            ("A-127", 31.491908, -106.415935),
            ("A-128", 31.491966, -106.415943),
            ("A-132", 31.492107, -106.415956),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "A", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("A-110", "CBU", "Servicios Estudiantiles", "A", "PB", 31.492139, -106.415594,
                          "Ayuda con psicoterapia, becas, objetos extraviados, informacion general, canalizacion psicologica")
        add_horarios(eid, lv("08:00", "20:00"))
        add_contacto(eid, "telefono", "656-688-2100")
        add_servicio(eid, "Psicoterapia")
        add_servicio(eid, "Becas")
        add_servicio(eid, "Objetos extraviados")
        add_servicio(eid, "Informacion general")
        add_servicio(eid, "Canalizacion psicologica")
        count += 1

        eid = add_espacio("A-111", "UAMI Edificio A", "Servicio Medico", "A", "PB", 31.492025, -106.415409,
                          "Servicio medico de atencion inicial")
        add_horarios(eid, lv("08:00", "20:00"))
        add_contacto(eid, "telefono", "656-688-2100")
        add_contacto(eid, "correo", "uami.cu@uacj.mx")
        add_servicio(eid, "Migrana")
        add_servicio(eid, "Sutura")
        add_servicio(eid, "Inmovilizacion")
        add_servicio(eid, "Curaciones")
        add_servicio(eid, "Presion arterial")
        add_servicio(eid, "Glucosa")
        add_servicio(eid, "Seguro estudiantil")
        count += 1

        eid = add_espacio("A-113", "Baño Hombres A-PB-2", "Baño Hombres", "A", "PB", 31.491986, -106.415403)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("A-114", "Cafeteria Edificio A", "Cafeteria", "A", "PB", 31.491847, -106.415420)
        add_horarios(eid, lv("08:00", "18:00")); count += 1

        eid = add_espacio("A-115", "Baño Mujeres A-PB-2", "Baño Mujeres", "A", "PB", 31.491869, -106.415564)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("A-117", "Libreria Tienda UACJ", "Servicios Estudiantiles", "A", "PB", 31.491869, -106.415605)
        add_horarios(eid, lv("08:00", "18:00"))
        add_servicio(eid, "Venta de articulos UACJ")
        add_servicio(eid, "Libros y papeleria")
        count += 1

        eid = add_espacio("A-118", "Galeria Cultural", "Otro", "A", "PB", 31.492002, -106.415803)
        add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("A-119", "Patio Interior A", "Zona de Estudio", "A", "PB", 31.491991, -106.415615)
        count += 1

        eid = add_espacio("A-130", "Baño Hombres A-PB-3", "Baño Hombres", "A", "PB", 31.491993, -106.415961)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("A-131", "Baño Mujeres A-PB-3", "Baño Mujeres", "A", "PB", 31.491993, -106.415961)
        add_horarios(eid, H_Baño); count += 1

        # — Piso 1 —
        for codigo, lat, lon in [
            ("A-201", 31.491853, -106.415889), ("A-202", 31.491908, -106.415935),
            ("A-203", 31.491966, -106.415943), ("A-207", 31.492107, -106.415956),
            ("A-208", 31.492270, -106.415795), ("A-213", 31.492313, -106.415642),
            ("A-214", 31.492302, -106.415559), ("A-215", 31.492272, -106.415473),
            ("A-216", 31.492119, -106.415688), ("A-217", 31.492116, -106.415546),
            ("A-218", 31.492057, -106.415457), ("A-219", 31.492016, -106.415406),
            ("A-225", 31.491904, -106.415597), ("A-226", 31.491904, -106.415658),
            ("A-227", 31.491966, -106.415747), ("A-228", 31.492041, -106.415798),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "A", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("A-205", "Baño Hombres A-P1-1", "Baño Hombres", "A", "1", 31.491993, -106.415961)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-206", "Baño Mujeres A-P1-1", "Baño Mujeres", "A", "1", 31.491993, -106.415961)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-210", "Baño Hombres A-P1-2", "Baño Hombres", "A", "1", 31.492299, -106.415704)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-211", "Baño Mujeres A-P1-2", "Baño Mujeres", "A", "1", 31.492299, -106.415704)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-221", "Baño Hombres A-P1-3", "Baño Hombres", "A", "1", 31.491986, -106.415403)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-223", "Baño Mujeres A-P1-3", "Baño Mujeres", "A", "1", 31.491869, -106.415564)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("A-222", "Sala de Apoyo Didactico Docentes A", "Oficina Administrativa", "A", "1", 31.491918, -106.415465)
        add_horarios(eid, H_OFIC); count += 1
        eid = add_espacio("A-EST1-P1", "Zona de Estudio A P1-1", "Zona de Estudio", "A", "1", 31.492091, -106.415508)
        count += 1
        eid = add_espacio("A-EST2-P1", "Zona de Estudio A P1-2", "Zona de Estudio", "A", "1", 31.491929, -106.415709)
        count += 1

        # — Piso 2 —
        for codigo, lat, lon in [
            ("A-301", 31.491966, -106.415747), ("A-302", 31.492041, -106.415798),
            ("A-303", 31.492119, -106.415688), ("A-304", 31.492116, -106.415546),
            ("A-306", 31.492057, -106.415457), ("A-307", 31.492016, -106.415406),
            ("A-313", 31.491904, -106.415597), ("A-314", 31.491904, -106.415658),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "A", "2", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("A-309", "Baño Hombres A-P2", "Baño Hombres", "A", "2", 31.491986, -106.415403)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-311", "Baño Mujeres A-P2", "Baño Mujeres", "A", "2", 31.491869, -106.415564)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("A-310", "Sala Multifuncional Docentes A", "Oficina Administrativa", "A", "2", 31.491918, -106.415465)
        add_horarios(eid, H_OFIC); count += 1
        eid = add_espacio("A-EST1-P2", "Zona de Estudio A P2-1", "Zona de Estudio", "A", "2", 31.492091, -106.415508)
        count += 1
        eid = add_espacio("A-EST2-P2", "Zona de Estudio A P2-2", "Zona de Estudio", "A", "2", 31.491929, -106.415709)
        count += 1

        db.commit()
        print(f"  A: {count} espacios")
        count_a = count; count = 0

        # ══════════════════════════════════════════════════════════════════════
        # EDIFICIO B
        # ══════════════════════════════════════════════════════════════════════
        print("Procesando Edificio B...")

        # — PB —
        for codigo, nombre, lat, lon in [
            ("B-101-B", "Salón B-101-B", 31.493813, -106.414016),
            ("B-101-C", "Salón B-101-C", 31.493813, -106.414141),
            ("B-101-D", "Salón B-101-D", 31.493813, -106.414172),
            ("B-101-E", "Salón B-101-E", 31.493837, -106.414172),
            ("B-101-F", "Salón B-101-F", 31.493837, -106.414078),
            ("B-101-G", "Salón B-101-G", 31.493837, -106.414016),
            ("B-101-H", "Salón B-101-H", 31.493813, -106.413953),
            ("B-109",   "Salón B-109",   31.493787, -106.413672),
            ("B-110",   "Salón B-110",   31.493787, -106.413547),
            ("B-111",   "Salón B-111",   31.493787, -106.413516),
            ("B-115",   "Salón B-115",   31.493813, -106.413453),
            ("B-116",   "Salón B-116",   31.493813, -106.413484),
        ]:
            eid = add_espacio(codigo, nombre, "Aula", "B", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("B-106", "Baño Mujeres B-PB-1", "Baño Mujeres", "B", "PB", 31.493762, -106.413766)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-108", "Baño Hombres B-PB-1", "Baño Hombres", "B", "PB", 31.493762, -106.413766)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-118", "Baño Mujeres B-PB-2", "Baño Mujeres", "B", "PB", 31.493738, -106.413672)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-120", "Baño Hombres B-PB-2", "Baño Hombres", "B", "PB", 31.493738, -106.413672)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("B-CAS", "Casilleros Edificio B", "Servicios Estudiantiles", "B", "PB", 31.493713, -106.413984)
        count += 1
        eid = add_espacio("B-EST", "Zona de Estudio B", "Zona de Estudio", "B", "PB", 31.493787, -106.413672)
        count += 1
        eid = add_espacio("B-AJE", "Mesa de Ajedrez B", "Deportes", "B", "PB", 31.493762, -106.413797)
        count += 1

        # — Piso 1 —
        for codigo, nombre, lat, lon in [
            ("B-206",   "Salón B-206",              31.493738, -106.413766),
            ("B-207",   "Salón Multifuncional B-207",31.493787, -106.413641),
            ("B-221",   "Salón B-221",              31.493738, -106.413703),
            ("B-222",   "Salón B-222",              31.493713, -106.413703),
            ("B-223-B", "Salón B-223-B",            31.493837, -106.413953),
            ("B-223-C", "Salón B-223-C",            31.493837, -106.414047),
            ("B-223-D", "Salón B-223-D",            31.493837, -106.414203),
            ("B-223-E", "Salón B-223-E",            31.493813, -106.414172),
            ("B-223-F", "Salón B-223-F",            31.493813, -106.414109),
            ("B-223-G", "Salón B-223-G",            31.493837, -106.414047),
            ("B-223-H", "Salón B-223-H",            31.493787, -106.413953),
        ]:
            eid = add_espacio(codigo, nombre, "Aula", "B", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("B-208", "Centro de Computo B-1", "Laboratorio", "B", "1", 31.493787, -106.413484)
        add_horarios(eid, H_AULA)
        add_servicio(eid, "Computadoras con acceso a internet")
        add_servicio(eid, "Impresion")
        count += 1

        eid = add_espacio("B-210", "Centro de Computo B-2", "Laboratorio", "B", "1", 31.493813, -106.413422)
        add_horarios(eid, H_AULA)
        add_servicio(eid, "Computadoras con acceso a internet")
        add_servicio(eid, "Impresion")
        count += 1

        eid = add_espacio("B-209", "Cubiculo Docentes B", "Oficina Administrativa", "B", "1", 31.493813, -106.413453)
        add_horarios(eid, H_OFIC); count += 1

        eid = add_espacio("B-211", "Tutora de Guardia B", "Oficina Administrativa", "B", "1", 31.493813, -106.413328)
        add_horarios(eid, H_OFIC); count += 1

        eid = add_espacio("B-203", "Baño Mujeres B-P1-1", "Baño Mujeres", "B", "1", 31.493837, -106.413734)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-205", "Baño Hombres B-P1-1", "Baño Hombres", "B", "1", 31.493837, -106.413734)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-213", "Baño Mujeres B-P1-2", "Baño Mujeres", "B", "1", 31.493787, -106.413422)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-215", "Baño Hombres B-P1-2", "Baño Hombres", "B", "1", 31.493787, -106.413422)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-218", "Baño Mujeres B-P1-3", "Baño Mujeres", "B", "1", 31.493762, -106.413578)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-220", "Baño Hombres B-P1-3", "Baño Hombres", "B", "1", 31.493762, -106.413578)
        add_horarios(eid, H_Baño); count += 1

        # — Piso 2 —
        for codigo, nombre, lat, lon in [
            ("B-301",   "Salón B-301",   31.493713, -106.413766),
            ("B-302",   "Salón B-302",   31.493713, -106.413766),
            ("B-303",   "Salón B-303",   31.493837, -106.413734),
            ("B-304",   "Salón B-304",   31.493837, -106.413734),
            ("B-305",   "Salón B-305",   31.493837, -106.413734),
            ("B-306",   "Salón B-306",   31.493738, -106.413766),
            ("B-307",   "Salón B-307",   31.493787, -106.413609),
            ("B-320",   "Salón B-320",   31.493713, -106.413703),
            ("B-321",   "Salón B-321",   31.493738, -106.413703),
            ("B-322",   "Salón B-322",   31.493713, -106.413703),
            ("B-323-B", "Salón B-323-B", 31.493837, -106.413953),
            ("B-323-C", "Salón B-323-C", 31.493837, -106.414047),
            ("B-323-D", "Salón B-323-D", 31.493837, -106.414203),
            ("B-323-E", "Salón B-322-E", 31.493813, -106.414172),
            ("B-323-F", "Salón B-322-F", 31.493813, -106.414109),
            ("B-323-G", "Salón B-322-G", 31.493837, -106.414047),
        ]:
            eid = add_espacio(codigo, nombre, "Aula", "B", "2", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("B-308", "Sala Descanso Docentes B", "Oficina Administrativa", "B", "2", 31.493762, -106.413578)
        add_horarios(eid, H_OFIC); count += 1
        eid = add_espacio("B-309", "Sala Multifuncional Docentes B", "Oficina Administrativa", "B", "2", 31.493762, -106.413484)
        add_horarios(eid, H_OFIC); count += 1
        eid = add_espacio("B-312", "Baño Mujeres B-P2", "Baño Mujeres", "B", "2", 31.493762, -106.413453)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("B-314", "Baño Hombres B-P2", "Baño Hombres", "B", "2", 31.493762, -106.413453)
        add_horarios(eid, H_Baño); count += 1

        db.commit()
        print(f"  B: {count} espacios")
        count_b = count; count = 0

        # ══════════════════════════════════════════════════════════════════════
        # EDIFICIO C
        # ══════════════════════════════════════════════════════════════════════
        print("Procesando Edificio C...")

        # — PB —
        eid = add_espacio("C-129", "Oficinas Administrativas C", "Oficina Administrativa", "C", "PB",
                          31.493060, -106.414232,
                          "Jefatura vinculacion, servicio social, practicas profesionales, movilidad estudiantil")
        add_horarios(eid, H_OFIC)
        add_contacto(eid, "telefono", "656-688-2100 ext. 6534")
        add_contacto(eid, "correo", "jescuder@uacj.mx")
        add_servicio(eid, "Servicio social")
        add_servicio(eid, "Practicas profesionales")
        add_servicio(eid, "Movilidad estudiantil")
        add_servicio(eid, "Vinculacion")
        count += 1

        eid = add_espacio("C-124", "Audiovisual C", "Audiovisual", "C", "PB", 31.493040, -106.414285)
        add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("C-BM-PB", "Baño Mujeres C-PB", "Baño Mujeres", "C", "PB", 31.493013, -106.414349)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("C-BH-PB", "Baño Hombres C-PB", "Baño Hombres", "C", "PB", 31.493020, -106.414450)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("C-CAF", "Cafeteria Edificio C", "Cafeteria", "C", "PB", 31.493040, -106.414605)
        add_horarios(eid, lv("08:00", "18:00")); count += 1

        # — Piso 1 —
        for codigo, lat, lon in [
            ("C-204",   31.493007, -106.414343),
            ("C-205",   31.493013, -106.414274),
            ("C-206",   31.493055, -106.414131),
            ("C-207",   31.493060, -106.414130),
            ("C-209",   31.493065, -106.414123),
            ("C-210",   31.493047, -106.414132),
            ("C-221",   31.493005, -106.414415),
            ("C-222",   31.493022, -106.414453),
            ("C-223-B", 31.493047, -106.414592),
            ("C-223-C", 31.493035, -106.414673),
            ("C-223-D", 31.493099, -106.414792),
            ("C-223-E", 31.493074, -106.414781),
            ("C-223-F", 31.493062, -106.414710),
            ("C-223-G", 31.493055, -106.414671),
            ("C-223-H", 31.493037, -106.414535),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "C", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("C-BH-P1-1", "Baño Hombres C-P1-1", "Baño Hombres", "C", "1", 31.493030, -106.414390)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("C-BH-P1-2", "Baño Hombres C-P1-2", "Baño Hombres", "C", "1", 31.493000, -106.414271)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("C-BH-P1-3", "Baño Hombres C-P1-3", "Baño Hombres", "C", "1", 31.493053, -106.414133)
        add_horarios(eid, H_Baño); count += 1

        eid = add_espacio("C-PREST", "Sala de Prestamo C", "Oficina Administrativa", "C", "1", 31.492995, -106.414219)
        add_horarios(eid, H_OFIC)
        add_servicio(eid, "Prestamo de equipos")
        add_servicio(eid, "Atencion a estudiantes")
        count += 1

        # — Piso 2 —
        for codigo, lat, lon in [
            ("C-304",   31.493084, -106.414451),
            ("C-306",   31.493081, -106.414453),
            ("C-307",   31.493072, -106.414455),
            ("C-308-B", 31.493031, -106.414575),
            ("C-308-C", 31.493061, -106.414482),
            ("C-308-D", 31.493054, -106.414790),
            ("C-308-E", 31.493067, -106.414797),
            ("C-308-F", 31.493032, -106.414795),
            ("C-308-G", 31.493042, -106.414663),
            ("C-308-H", 31.493047, -106.414619),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "C", "2", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("C-BH-P2", "Baño Hombres C-P2", "Baño Hombres", "C", "2", 31.493022, -106.414491)
        add_horarios(eid, H_Baño); count += 1

        db.commit()
        print(f"  C: {count} espacios")
        count_c = count; count = 0

        # ══════════════════════════════════════════════════════════════════════
        # EDIFICIO D
        # ══════════════════════════════════════════════════════════════════════
        print("Procesando Edificio D...")

        # — PB — D1 laboratorios
        for codigo, nombre, lat, lon in [
            ("D1-101", "Laboratorio de Electronica D1-101", 31.491333, -106.413918),
            ("D1-105", "Laboratorio de Electronica D1-105", 31.491499, -106.413806),
            ("D1-115", "Laboratorio de Fisica",             31.491330, -106.413785),
            ("D1-111", "Taller de Fotografia",              31.491508, -106.413805),
            ("D1-112", "Taller de Serigrafia",              31.491508, -106.413805),
        ]:
            eid = add_espacio(codigo, nombre, "Taller", "D", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        for codigo, nombre, lat, lon in [
            ("D1-106", "Salón D1-106",  31.491520, -106.413985),
            ("D1-107", "Digitales D1-107", 31.491511, -106.413796),
            ("D1-114", "Salón D1-114",  31.491493, -106.413802),
        ]:
            eid = add_espacio(codigo, nombre, "Aula", "D", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        # — PB — D2 laboratorios
        for codigo, nombre, lat, lon in [
            ("D2-101", "Laboratorio de Manufactura",                      31.491259, -106.414282),
            ("D2-102", "Laboratorio de Mecatronica",                      31.491253, -106.414296),
            ("D2-104", "Laboratorio de Sistemas Hidraulicos y Neumaticos", 31.491253, -106.414293),
            ("D2-105", "Taller de Maquetas",                              31.491259, -106.414282),
        ]:
            eid = add_espacio(codigo, nombre, "Taller", "D", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D2-106", "Baño Mujeres D2-PB", "Baño Mujeres", "D", "PB", 31.491242, -106.414045)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("D2-108", "Baño Hombres D2-PB", "Baño Hombres", "D", "PB", 31.491242, -106.414045)
        add_horarios(eid, H_Baño); count += 1

        # — PB — D3 laboratorios
        for codigo, nombre, lat, lon in [
            ("D3-102", "Laboratorio de Habilidades Motrices",                   31.491041, -106.413814),
            ("D3-103", "Laboratorio de Ciencia, Tecnologia Alimentaria y Nutricion", 31.490735, -106.413838),
            ("D3-104", "Laboratorio de Evaluacion y Diagnostico Nutricional",   31.490700, -106.413849),
            ("D3-105", "Laboratorio de Gastronomia",                            31.490809, -106.413931),
            ("D3-107", "Laboratorio de Sistemas Automotrices",                  31.491047, -106.413830),
        ]:
            eid = add_espacio(codigo, nombre, "Laboratorio", "D", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D3-109", "Baño Mujeres D3-PB", "Baño Mujeres", "D", "PB", 31.491037, -106.413829)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("D3-111", "Baño Hombres D3-PB", "Baño Hombres", "D", "PB", 31.491037, -106.413829)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("D3-BEB", "Bebederos D3", "Otro", "D", "PB", 31.491048, -106.413821)
        count += 1

        # — PB — D4 aulas
        for codigo, lat, lon in [
            ("D4-106", 31.491182, -106.413517), ("D4-107", 31.491229, -106.413500),
            ("D4-108", 31.491189, -106.413441), ("D4-109", 31.491181, -106.413433),
            ("D4-110", 31.491191, -106.413409), ("D4-112", 31.491181, -106.413433),
            ("D4-113", 31.491189, -106.413441), ("D4-114", 31.491229, -106.413500),
            ("D4-115", 31.491182, -106.413517),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "D", "PB", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D-MERC", "Mercadito D", "Cafeteria", "D", "PB", 31.491172, -106.413800)
        add_horarios(eid, lv("08:00", "18:00")); count += 1

        # — Piso 1 — D1
        for codigo, lat, lon in [
            ("D1-205", 31.491537, -106.413823), ("D1-207", 31.491512, -106.413868),
            ("D1-208", 31.491481, -106.413788), ("D1-209", 31.491433, -106.413831),
            ("D1-211", 31.491392, -106.413906),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "D", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D1-201", "Baño Hombres D1-P1", "Baño Hombres", "D", "1", 31.491493, -106.413868)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("D1-203", "Baño Mujeres D1-P1", "Baño Mujeres", "D", "1", 31.491482, -106.413797)
        add_horarios(eid, H_Baño); count += 1

        # — Piso 1 — D2
        for codigo, nombre, lat, lon in [
            ("D2-209", "Laboratorio de Diseno Asistido por Computadora", 31.491103, -106.414164),
            ("D2-210", "Laboratorio de Computo Avanzado",                31.491121, -106.414191),
            ("D2-212", "Laboratorio de Ergonomia y Metodos",             31.491145, -106.414202),
        ]:
            eid = add_espacio(codigo, nombre, "Laboratorio", "D", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D2-207", "Aula de Computo D2", "Laboratorio", "D", "1", 31.491205, -106.414047)
        add_horarios(eid, H_AULA)
        add_servicio(eid, "Computadoras con acceso a internet")
        count += 1

        eid = add_espacio("D2-206", "Sala Multiusos y Prestamo D2", "Oficina Administrativa", "D", "1", 31.491178, -106.414139)
        add_horarios(eid, H_OFIC)
        add_servicio(eid, "Prestamo de proyectores")
        add_servicio(eid, "Prestamo de laptops")
        count += 1

        eid = add_espacio("D2-202", "Baño Mujeres D2-P1", "Baño Mujeres", "D", "1", 31.491197, -106.414007)
        add_horarios(eid, H_Baño); count += 1
        eid = add_espacio("D2-204", "Baño Hombres D2-P1", "Baño Hombres", "D", "1", 31.491193, -106.413952)
        add_horarios(eid, H_Baño); count += 1

        # — Piso 1 — D3
        for codigo, nombre, lat, lon in [
            ("D3-209", "Laboratorio de Bioquimica",               31.490786, -106.413760),
            ("D3-210", "Laboratorio de Toxicologia y Farmacologia", 31.490811, -106.413677),
            ("D3-211", "Laboratorio de Habilidades de Enfermeria", 31.490647, -106.413872),
            ("D3-212", "Camara de Gesell",                         31.491014, -106.413793),
            ("D3-207", "Centro de Simulacion de Negocios",         31.490995, -106.413782),
        ]:
            eid = add_espacio(codigo, nombre, "Laboratorio", "D", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D3-203", "Sala de Maestros D3", "Oficina Administrativa", "D", "1", 31.491103, -106.413615)
        add_horarios(eid, H_OFIC); count += 1

        eid = add_espacio("D3-201", "Sala de Descanso Estudiantes D3-1", "Sala de Descanso", "D", "1", 31.491109, -106.413634)
        count += 1
        eid = add_espacio("D3-202", "Audiovisual D3", "Audiovisual", "D", "1", 31.491109, -106.413634)
        add_horarios(eid, H_AULA); count += 1
        eid = add_espacio("D3-211b", "Sala de Descanso Estudiantes D3-2", "Sala de Descanso", "D", "1", 31.491081, -106.413629)
        count += 1

        # — Piso 1 — D4
        for codigo, lat, lon in [
            ("D4-208", 31.491236, -106.413420),
            ("D4-212", 31.491210, -106.413383),
            ("D4-214", 31.491259, -106.413416),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "D", "1", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D4-207", "Sala de Impresiones D4", "Impresoras", "D", "1", 31.491156, -106.413538)
        add_horarios(eid, H_OFIC)
        add_servicio(eid, "Impresion")
        add_servicio(eid, "Copiado")
        count += 1

        eid = add_espacio("D-PING", "Mesas de Ping-Pong", "Deportes", "D", "1", 31.491146, -106.413863)
        count += 1

        # — Piso 2 — D3 y D4
        eid = add_espacio("D3-305", "Biblioteca D3", "Biblioteca", "D", "2", 31.491045, -106.413712)
        add_horarios(eid, lv("08:00", "19:30"))
        add_servicio(eid, "Prestamo de libros")
        add_servicio(eid, "Sala de lectura")
        add_servicio(eid, "Acceso a internet")
        count += 1

        eid = add_espacio("D3-301", "Laboratorio de Radio y Revision", "Laboratorio", "D", "2", 31.491101, -106.413607)
        add_horarios(eid, H_AULA); count += 1

        eid = add_espacio("D3-306", "Sala de Juicios Orales", "Laboratorio", "D", "2", 31.491015, -106.413737)
        add_horarios(eid, H_AULA); count += 1

        for codigo, lat, lon in [
            ("D4-308", 31.491164, -106.413511), ("D4-309", 31.491176, -106.413517),
            ("D4-311", 31.491183, -106.413460), ("D4-312", 31.491184, -106.413421),
            ("D4-313", 31.491184, -106.413430), ("D4-315", 31.491180, -106.413503),
            ("D4-316", 31.491171, -106.413514), ("D4-317", 31.491168, -106.413496),
        ]:
            eid = add_espacio(codigo, f"Salón {codigo}", "Aula", "D", "2", lat, lon)
            add_horarios(eid, H_AULA); count += 1

        db.commit()
        print(f"  D: {count} espacios")
        count_d = count; count = 0

        # ══════════════════════════════════════════════════════════════════════
        # GIMNASIO  (coordenadas en DMS → DD)
        # ══════════════════════════════════════════════════════════════════════
        print("Procesando Gimnasio...")

        # PB
        eid = add_espacio("GIM-E108", "Sala de Halterofilia", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.7766, 106, 24, 58.1606))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E103", "Baño Mujeres Gimnasio PB-1", "Baño Mujeres", "GIM", "PB",
                          *dms(31, 29, 36.2862, 106, 25, 0.1766))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E104", "Baño Hombres Gimnasio PB-1", "Baño Hombres", "GIM", "PB",
                          *dms(31, 29, 36.2862, 106, 25, 0.1766))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E106A", "Sala de Caminadoras", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.7767, 106, 24, 57.9515))
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Caminadoras electricas")
        count += 1

        eid = add_espacio("GIM-E106B", "Sala de Maquinas", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.7927, 106, 24, 58.4228))
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Maquinas de ejercicio")
        count += 1

        eid = add_espacio("GIM-E110", "Sala de Calistenia", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.308, 106, 24, 58.358))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E105", "Responsable Gimnasio", "Oficina Administrativa", "GIM", "PB",
                          31.493420, -106.416300)  # coord. general: DMS original es sospechosa
        add_horarios(eid, lv("08:00", "15:00")); count += 1

        eid = add_espacio("GIM-E111", "Canchas Polideportivas", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.6551, 106, 24, 59.2708))
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Basketball")
        add_servicio(eid, "Voleibol")
        count += 1

        eid = add_espacio("GIM-E112", "Alberca Olimpica", "Deportes", "GIM", "PB",
                          *dms(31, 29, 36.1000, 106, 24, 58.666))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E112E", "UAMI Gimnasio", "Servicio Medico", "GIM", "PB",
                          *dms(31, 29, 36.125, 106, 24, 58.358))
        add_horarios(eid, lv("08:00", "15:45"))
        add_servicio(eid, "Atencion medica inicial")
        count += 1

        eid = add_espacio("GIM-E112A", "Baño Mujeres Gimnasio PB-2", "Baño Mujeres", "GIM", "PB",
                          *dms(31, 29, 36.175, 106, 24, 59.785))
        add_horarios(eid, H_GIM); count += 1
        eid = add_espacio("GIM-E112D", "Baño Hombres Gimnasio PB-2", "Baño Hombres", "GIM", "PB",
                          *dms(31, 29, 36.175, 106, 24, 59.785))
        add_horarios(eid, H_GIM); count += 1
        eid = add_espacio("GIM-E112R", "Baño Mujeres Gimnasio PB-3", "Baño Mujeres", "GIM", "PB",
                          *dms(31, 29, 36.125, 106, 24, 58.358))
        add_horarios(eid, H_GIM); count += 1
        eid = add_espacio("GIM-E112G", "Baño Hombres Gimnasio PB-3", "Baño Hombres", "GIM", "PB",
                          *dms(31, 29, 36.125, 106, 24, 58.358))
        add_horarios(eid, H_GIM); count += 1

        # Piso 1
        eid = add_espacio("GIM-E207", "Jefatura Deporte Interno y Estadistica", "Oficina Administrativa", "GIM", "1",
                          *dms(31, 29, 36.632, 106, 24, 59.689))
        add_horarios(eid, lv("08:00", "15:45")); count += 1

        eid = add_espacio("GIM-E205", "Laboratorio de Fisiologia del Ejercicio", "Laboratorio", "GIM", "1",
                          *dms(31, 29, 36.632, 106, 24, 59.689))
        for d in [0, 1, 2, 3]:  # Lunes a Jueves
            db.add(Horario(espacio_id=eid, dia_semana=d, hora_apertura=time(8, 0), hora_cierre=time(19, 45)))
        add_servicio(eid, "Fisiologia del ejercicio")
        add_servicio(eid, "Terapia fisica y rehabilitacion")
        count += 1

        eid = add_espacio("GIM-E202", "Baño Hombres Gimnasio P1", "Baño Hombres", "GIM", "1",
                          *dms(31, 29, 36.7062, 106, 24, 58.9691))
        add_horarios(eid, H_GIM); count += 1
        eid = add_espacio("GIM-E201", "Baño Mujeres Gimnasio P1", "Baño Mujeres", "GIM", "1",
                          *dms(31, 29, 36.7062, 106, 24, 58.9691))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E203", "Sala de Elipticas", "Deportes", "GIM", "1",
                          *dms(31, 29, 36.612, 106, 24, 59.223))  # coord. aproximada
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Elipticas")
        count += 1

        eid = add_espacio("GIM-E204", "Sala de Bicicletas Estaticas", "Deportes", "GIM", "1",
                          *dms(31, 29, 36.612, 106, 24, 59.223))  # coord. aproximada
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Bicicletas estaticas")
        count += 1

        eid = add_espacio("GIM-E208", "Gradas de Canchas", "Deportes", "GIM", "1",
                          *dms(31, 29, 36.6708, 106, 24, 59.2231))
        add_horarios(eid, H_GIM); count += 1
        eid = add_espacio("GIM-E209", "Gradas de Alberca", "Deportes", "GIM", "1",
                          *dms(31, 29, 36.6708, 106, 24, 59.2231))
        add_horarios(eid, H_GIM); count += 1

        eid = add_espacio("GIM-E210", "Maquinas de Peso Libre", "Deportes", "GIM", "1",
                          31.493420, -106.416300)  # coord. aproximada gimnasio
        add_horarios(eid, H_GIM)
        add_servicio(eid, "Pesas libres")
        add_servicio(eid, "Mancuernas")
        count += 1

        db.commit()
        print(f"  Gimnasio: {count} espacios")
        count_gim = count

        # ── Administrador ─────────────────────────────────────────────────────
        print("Creando administrador...")
        admin = Administrador(
            username="admin",
            email="admin@uacj.mx",
            password_hash=hash_password("admin123"),
        )
        db.add(admin)
        db.commit()
        print("OK Admin: username=admin / password=admin123")

        total = count_a + count_b + count_c + count_d + count_gim
        print(f"\n Seed completado exitosamente")
        print(f"   Categorias : {len(cats)}")
        print(f"   Edificios  : {len(eds)}")
        print(f"   Pisos      : {len(pisos)}")
        print(f"   Espacios   : {total}")
        print(f"     Edificio A  : {count_a}")
        print(f"     Edificio B  : {count_b}")
        print(f"     Edificio C  : {count_c}")
        print(f"     Edificio D  : {count_d}")
        print(f"     Gimnasio    : {count_gim}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()

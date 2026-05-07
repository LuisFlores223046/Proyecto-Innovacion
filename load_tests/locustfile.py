"""
locustfile.py — Tests de carga para Mapa Interactivo CU UACJ
──────────────────────────────────────────────────────────────
Qué se mide:
  • Tiempo de respuesta (p50, p95, p99) por endpoint.
  • Tasa de errores bajo carga sostenida.
  • Throughput máximo antes de degradación.
  • Cuellos de botella en endpoints de búsqueda y geolocalización.

Usuarios simulados:
  ─ UsuarioPublico  : simula visitante del mapa (70% del tráfico)
      GET /espacios
      GET /espacios/buscar/{q}
      GET /espacios/abiertos/ahora
      GET /espacios/cercanos
      GET /espacios/{id}
      GET /categorias
      GET /edificios

  ─ AdministradorCarga : simula admin usando el panel (30% del tráfico)
      POST /auth/login
      POST /espacios (crear)
      PATCH /espacios/{id}
      GET /auth/me

Ejecución:
  locust -f load_tests/locustfile.py --host=http://localhost:8000 --headless \
         -u 50 -r 5 --run-time 2m --csv=load_tests/results

UI interactiva:
  locust -f load_tests/locustfile.py --host=http://localhost:8000
  → Abrir http://localhost:8089
"""

import os
import random
import string
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner


# ─── Credenciales del administrador de prueba ─────────────────────────────────
ADMIN_USERNAME = os.getenv("TEST_ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASS", "Admin123!")

# ─── Términos de búsqueda representativos ─────────────────────────────────────
TERMINOS_BUSQUEDA = [
    "Laboratorio",
    "Biblioteca",
    "Cafetería",
    "Aula",
    "Baño",
    "Estacionamiento",
    "Rectoría",
    "Gimnasio",
    "Auditorio",
    "Coordinación",
]

# ─── Coordenadas aproximadas del campus UACJ ─────────────────────────────────
LAT_BASE = 31.7200
LON_BASE = -106.4270
RADIO_METROS = 300.0


def _random_suffix(n=6) -> str:
    return "".join(random.choices(string.ascii_lowercase, k=n))


# ─── Usuario Público ──────────────────────────────────────────────────────────
class UsuarioPublico(HttpUser):
    """
    Simula a un estudiante o visitante que navega el mapa interactivo.
    Espera entre 1 y 3 segundos entre acciones (comportamiento real).
    """
    weight = 7  # 70% del tráfico total
    wait_time = between(1, 3)

    @task(3)
    def listar_espacios(self):
        """Carga inicial del mapa: obtiene todos los espacios activos."""
        with self.client.get(
            "/api/v1/espacios",
            params={"activo": True},
            name="GET /espacios",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Error {resp.status_code}: {resp.text[:100]}")

    @task(4)
    def buscar_espacio(self):
        """Simulación de escritura en el SearchBar con debounce."""
        termino = random.choice(TERMINOS_BUSQUEDA)
        with self.client.get(
            f"/api/v1/espacios/buscar/{termino}",
            name="GET /espacios/buscar/{q}",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                body = resp.json()
                if not isinstance(body, list):
                    resp.failure("La respuesta no es una lista")
                else:
                    resp.success()
            else:
                resp.failure(f"Error {resp.status_code}")

    @task(2)
    def espacios_abiertos_ahora(self):
        """Tab 'Abierto ahora' — consulta intensiva con JOIN y filtros de horario."""
        with self.client.get(
            "/api/v1/espacios/abiertos/ahora",
            name="GET /espacios/abiertos/ahora",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Error {resp.status_code}: {resp.text[:100]}")

    @task(3)
    def espacios_cercanos(self):
        """Búsqueda por proximidad — usa Haversine en SQL (potencialmente costoso)."""
        # Añadir pequeña variación aleatoria en coordenadas para evitar caché
        lat = LAT_BASE + random.uniform(-0.001, 0.001)
        lon = LON_BASE + random.uniform(-0.001, 0.001)
        with self.client.get(
            "/api/v1/espacios/cercanos",
            params={"lat": lat, "lon": lon, "radio": RADIO_METROS},
            name="GET /espacios/cercanos",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Error {resp.status_code}")

    @task(2)
    def detalle_espacio(self):
        """Clic en un marcador del mapa para ver el detalle completo del espacio."""
        # IDs bajos probablemente existen en la BD de prueba
        espacio_id = random.randint(1, 10)
        with self.client.get(
            f"/api/v1/espacios/{espacio_id}",
            name="GET /espacios/{id}",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()  # 404 es válido si el ID no existe
            else:
                resp.failure(f"Error inesperado {resp.status_code}")

    @task(1)
    def listar_categorias(self):
        """Carga las categorías para los filtros de búsqueda."""
        with self.client.get(
            "/api/v1/categorias",
            name="GET /categorias",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Error {resp.status_code}")

    @task(1)
    def listar_edificios(self):
        """Obtiene los edificios para renderizar marcadores en el mapa."""
        with self.client.get(
            "/api/v1/edificios",
            name="GET /edificios",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Error {resp.status_code}")


# ─── Administrador bajo carga ─────────────────────────────────────────────────
class AdministradorCarga(HttpUser):
    """
    Simula a un administrador usando el panel (creación y edición de espacios).
    Espera más tiempo entre acciones para representar uso real del panel.
    """
    weight = 3  # 30% del tráfico total
    wait_time = between(2, 5)

    def on_start(self):
        """Al iniciar la sesión de Locust, hace login y guarda el token JWT."""
        self._token = None
        self._espacio_id_creado = None
        self._login()

    def _login(self):
        """Autentica al administrador y almacena el token en los headers."""
        with self.client.post(
            "/api/v1/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            name="POST /auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                self._token = resp.json().get("access_token")
                self.client.headers.update(
                    {"Authorization": f"Bearer {self._token}"}
                )
                resp.success()
            else:
                resp.failure(f"Login fallido: {resp.status_code} {resp.text[:100]}")

    @task(1)
    def perfil_admin(self):
        """Verifica que el token sigue siendo válido (heartbeat)."""
        with self.client.get(
            "/api/v1/auth/me",
            name="GET /auth/me",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code in (401, 403):
                # Token expirado — reautenticar
                self._login()
                resp.failure("Token expirado, reautenticando")
            else:
                resp.failure(f"Error {resp.status_code}")

    @task(2)
    def crear_espacio(self):
        """Simula al admin registrando un nuevo espacio en el mapa."""
        sufijo = _random_suffix()
        payload = {
            "codigo": f"LOAD-{sufijo.upper()}",
            "nombre": f"Espacio de carga {sufijo}",
            "latitud": LAT_BASE + random.uniform(-0.005, 0.005),
            "longitud": LON_BASE + random.uniform(-0.005, 0.005),
            "activo": True,
            "notas": f"Espacio creado por test de carga — sufijo {sufijo}",
        }
        with self.client.post(
            "/api/v1/espacios",
            json=payload,
            name="POST /espacios",
            catch_response=True,
        ) as resp:
            if resp.status_code == 201:
                self._espacio_id_creado = resp.json().get("id")
                resp.success()
            elif resp.status_code in (401, 403):
                self._login()
                resp.failure("Token inválido, reautenticando")
            else:
                resp.failure(f"Error al crear espacio: {resp.status_code}")

    @task(1)
    def actualizar_espacio(self):
        """Simula la edición de un espacio ya creado."""
        if not self._espacio_id_creado:
            return  # Aún no hemos creado un espacio — omitir

        with self.client.patch(
            f"/api/v1/espacios/{self._espacio_id_creado}",
            json={"notas": f"Actualizado en {random.randint(1000, 9999)}"},
            name="PATCH /espacios/{id}",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 404:
                self._espacio_id_creado = None  # El espacio fue eliminado
                resp.success()
            else:
                resp.failure(f"Error al actualizar: {resp.status_code}")

    @task(1)
    def listar_admins(self):
        """Carga la lista de administradores desde el panel."""
        with self.client.get(
            "/api/v1/auth/admin",
            name="GET /auth/admin",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code in (401, 403):
                self._login()
                resp.failure("Token expirado")
            else:
                resp.failure(f"Error {resp.status_code}")


# ─── Hook: imprimir resumen al finalizar ──────────────────────────────────────
@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """Imprime un resumen de SLOs al terminar la prueba."""
    stats = environment.runner.stats.total if environment.runner else None
    if stats is None:
        return

    print("\n" + "=" * 60)
    print("  RESUMEN DE PRUEBA DE CARGA — Mapa CU UACJ")
    print("=" * 60)
    print(f"  Total peticiones : {stats.num_requests}")
    print(f"  Peticiones/seg   : {stats.current_rps:.2f}")
    print(f"  Errores          : {stats.num_failures} ({stats.fail_ratio * 100:.1f}%)")
    print(f"  Tiempo resp. p50 : {stats.get_response_time_percentile(0.5):.0f} ms")
    print(f"  Tiempo resp. p95 : {stats.get_response_time_percentile(0.95):.0f} ms")
    print(f"  Tiempo resp. p99 : {stats.get_response_time_percentile(0.99):.0f} ms")
    print("=" * 60)

    # ── Evaluación de SLOs del proyecto ──────────────────────────────────────
    p95 = stats.get_response_time_percentile(0.95)
    fail_ratio = stats.fail_ratio

    slo_passed = True
    if p95 > 2000:
        print(f"  ⚠ SLO FALLIDO: p95 ({p95:.0f} ms) supera el umbral de 2000 ms")
        slo_passed = False
    if fail_ratio > 0.01:
        print(f"  ⚠ SLO FALLIDO: tasa de error ({fail_ratio*100:.1f}%) supera el 1%")
        slo_passed = False
    if slo_passed:
        print("  ✔ Todos los SLOs cumplidos")
    print("=" * 60 + "\n")

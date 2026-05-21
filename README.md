# ✈️ ViajesB2B — Agencia de Viajes Multi-Proveedor

Sistema académico de agencia de viajes B2B desarrollado para el curso de **Análisis, Diseño y Fabricación de Sistemas** — Universidad del Istmo (UNIS), Ingeniería en Sistemas 2026.

---

## 📋 Descripción

Plataforma B2B que permite a una agencia de viajes conectarse dinámicamente con múltiples cadenas hoteleras mediante servicios REST, comparar precios, realizar reservas y emitir facturas electrónicas a través del sistema SAT Simulación.

### Ecosistema completo

| Sistema | Tecnología | Puerto |
|---|---|---|
| **Agencia — Backend** | Python FastAPI + MySQL | 8000 |
| **Agencia — Frontend** | React + Vite | 5173 |
| **HotelChain A** (Europa & Asia) | C# .NET 8 + SQL Server | API: 8081, FE: 8080 |
| **HotelChain B** (Americas) | C# .NET 8 + SQL Server | API: 8091, FE: 8090 |
| **SAT Simulación** | Java Spring Boot + H2 | 9090 |
| **SAT Frontend** | React + Vite | 3001 |

---

## 🏗️ Arquitectura

```
NAVEGADOR
    ↓ (solo llama a su propio backend)
Agencia Frontend (React :5173)
    ↓
Agencia Backend (FastAPI :8000)
    ↓ REST server-to-server
HotelChain A (:8081) ←→ HotelChain B (:8091)
    ↓
SAT Simulación (:9090)
```

**Regla arquitectónica:** el frontend nunca llama directamente a otro sistema. Toda comunicación entre sistemas se hace desde los servidores backend.

---

## 🛠️ Stack Tecnológico

### Agencia de Viajes
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic
- **Base de datos:** MySQL 8
- **Autenticación:** JWT (PyJWT), BCrypt
- **PDF:** ReportLab
- **Email:** SMTP (Mailtrap para desarrollo)
- **Frontend:** React 18, Vite, Axios, React Router

### Sistemas externos
- **HotelChain:** C# .NET 8, ASP.NET Core, EF Core, SQL Server, Blazor WASM
- **SAT:** Java 17, Spring Boot 3, Hibernate/JPA, H2, iText5, Spring Security

---

## 📁 Estructura del proyecto

```
AgenciaViajes/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Variables de entorno y configuración
│   │   │   ├── auth_dependencies.py # Dependencias JWT para FastAPI
│   │   │   └── seed.py            # Seed inicial: 2 agencias + 2 admins
│   │   ├── database/
│   │   │   └── database.py        # Conexión SQLAlchemy + sesión
│   │   ├── models/
│   │   │   ├── agency.py          # Tabla agencies
│   │   │   ├── user.py            # Tabla users (con roles)
│   │   │   ├── provider.py        # Tabla providers (HotelChain A/B)
│   │   │   ├── reserva_hotel.py   # Tabla reservas_hotel
│   │   │   ├── customer.py        # Tabla customers (datos huésped)
│   │   │   └── operation_audit.py # Bitácora de operaciones
│   │   ├── routers/
│   │   │   ├── auth.py            # Login, registro, captcha, usuarios
│   │   │   ├── agencies.py        # CRUD agencias
│   │   │   ├── providers.py       # CRUD proveedores (HotelChain)
│   │   │   ├── hoteles.py         # Búsqueda multi-proveedor + detalle
│   │   │   ├── reservas_hotel.py  # Historial y cancelación de reservas
│   │   │   ├── checkout.py        # Flujo de pago y confirmación
│   │   │   └── callbacks.py       # Webhook para cancelaciones del hotel
│   │   ├── schemas/
│   │   │   └── checkout_schema.py # Pydantic models para checkout
│   │   ├── services/
│   │   │   ├── hotelchain_client.py # Cliente REST para HotelChain
│   │   │   ├── sat_client.py       # Cliente REST para SAT
│   │   │   ├── pdf_service.py      # Generación de PDFs con ReportLab
│   │   │   ├── email_service.py    # Envío de emails SMTP
│   │   │   └── audit_service.py    # Registro de operaciones
│   │   └── main.py                # Punto de entrada FastAPI
│   ├── .env                       # Variables de entorno (no commitear)
│   ├── .env.example               # Plantilla de variables
│   └── requirements.txt           # Dependencias Python
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.js          # Axios con JWT automático
    │   │   └── pdfDownload.js     # Descarga PDF autenticada
    │   ├── auth/
    │   │   └── AuthContext.jsx    # Context de autenticación global
    │   ├── cart/
    │   │   └── CartContext.jsx    # Context del carrito (1 habitación)
    │   ├── components/
    │   │   ├── Header.jsx         # Navbar con perfil y carrito
    │   │   └── Footer.jsx         # Footer con links
    │   ├── pages/
    │   │   ├── Home.jsx           # Hero + destinos + búsqueda
    │   │   ├── Login.jsx          # Inicio de sesión
    │   │   ├── Register.jsx       # Registro con todos los campos del spec
    │   │   ├── SearchResults.jsx  # Resultados agrupados por hotel
    │   │   ├── HotelDetail.jsx    # Detalle con galería, amenidades, reseñas
    │   │   ├── Checkout.jsx       # Flujo 3 pasos con cartSnapshot
    │   │   ├── Reservations.jsx   # Mis reservas + descarga PDF
    │   │   ├── InfoPage.jsx       # Páginas informativas dinámicas
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx  # Stats generales
    │   │       ├── AdminProviders.jsx  # CRUD providers
    │   │       ├── AdminUsers.jsx      # Gestión de roles
    │   │       └── AdminReservas.jsx   # Todas las reservas
    │   ├── App.jsx                # Rutas con ProtectedRoute
    │   ├── styles.css             # Diseño minimalista pastel (Inter font)
    │   └── main.jsx               # Entry point React
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Instalación y arranque

### Requisitos
- Python 3.11+
- Node.js 18+
- MySQL 8
- .NET 8 SDK (para HotelChain)
- Java 17 + Maven 3.9+ (para SAT)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jeremy-png/agencia-viajes-b2b.git
cd agencia-viajes-b2b
```

### 2. Configurar la base de datos
```sql
CREATE DATABASE agencia_db;
CREATE USER 'agencia'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON agencia_db.* TO 'agencia'@'localhost';
```

### 3. Configurar variables de entorno
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
```

```env
DATABASE_URL=mysql+pymysql://agencia:password@localhost/agencia_db
SECRET_KEY=tu_secret_key_aqui
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu_usuario_mailtrap
SMTP_PASSWORD=tu_password_mailtrap
FRONTEND_ORIGIN=http://localhost:5173
PROVIDER_CALLBACK_SECRET=tu_callback_secret
```

### 4. Instalar dependencias y correr el backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

El seed crea automáticamente:
- Agencia A: `admin@agencia-a.com` / `Admin1234!`
- Agencia B: `admin@agencia-b.com` / `Admin1234!`

### 5. Instalar dependencias y correr el frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Credenciales de prueba

| Sistema | Email | Password |
|---|---|---|
| Agencia Admin A | admin@agencia-a.com | Admin1234! |
| Agencia Admin B | admin@agencia-b.com | Admin1234! |
| HotelChain Admin | admin@hotelchain.com | HotelChain#123 |
| HotelChain WS A | agencia@hotelchain-a.com | HotelChain#123 |
| HotelChain WS B | agencia@hotelchain-b.com | HotelChain#123 |
| SAT Admin | admin@sat.gob.gt | SAT@Admin2026 |
| SAT WebService | agencia@viajesb2b.gt | Agencia@SAT2026 |

---

## 📡 Endpoints principales

### Autenticación
```
POST /auth/login          # Login con email y password
POST /auth/register       # Registro de nuevo usuario
GET  /auth/captcha        # Obtener captcha matemático
```

### Hoteles
```
POST /hoteles/buscar                        # Búsqueda multi-proveedor
GET  /hoteles/detalle/{provider_id}/{hotel_id}  # Detalle con markup
GET  /hoteles/ciudades                      # Ciudades disponibles
```

### Checkout
```
POST /checkout/iniciar    # Paso 1: validar datos
POST /checkout/confirmar  # Paso 2: crear reserva + PDF + email + SAT
GET  /checkout/pdf/{code} # Descargar PDF (requiere JWT)
```

### Reservas
```
GET  /reservas/hotel               # Mis reservas (con filtros)
POST /reservas/hotel/{id}/cancelar # Cancelar reserva
```

### Callbacks
```
POST /callbacks/reservacion-cambio  # Webhook desde HotelChain
```

### Admin
```
GET  /providers          # Listar proveedores
POST /providers          # Crear proveedor
PUT  /providers/{id}     # Editar proveedor
GET  /auth/users         # Listar usuarios
POST /auth/users/{id}/role  # Cambiar rol
```

---

## 🔄 Flujo de integración B2B

### Búsqueda multi-proveedor
```python
for provider in providers_activos:
    token = hotelchain_login(provider.base_url, ...)
    rooms = hotelchain_search_rooms(...)
    precio_final = precio_base * (1 + markup)  # Aplicar ganancia
    resultados.append(...)

# Resultados ordenados por precio de menor a mayor
```

### Callback de cancelación
```
HotelChain cancela reserva
    → POST /callbacks/reservacion-cambio
    → Valida X-Callback-Secret
    → Actualiza estado en MySQL
    → Envía email al cliente
    → Registra en operation_audit
```

---

## 🏨 Destinos disponibles

**HotelChain Europa & Asia**
- París, Francia — Hotel Le Marais Paris
- Roma, Italia — Grand Hotel Roma Colosseo
- Tokyo, Japón — Tokyo Shinjuku Tower Hotel
- Barcelona, España — Hotel Arts Barcelona Mar

**HotelChain Americas**
- Nueva York, EE.UU. — Manhattan Skyline Hotel
- Cancún, México — Cancun Beach Resort & Spa
- Buenos Aires, Argentina — Hotel Palacio Buenos Aires
- Dubai, EAU — Dubai Marina Tower Hotel

---

## 🧾 Integración SAT

Después de cada reserva confirmada, la agencia emite una factura electrónica:

```python
sat_resp = emitir_factura(
    nombre_cliente   = "Juan García",
    pasaporte_nit    = "GT123456",
    tipo_servicio    = "HOTEL",    # IVA: 15%
    noches           = 2,
    precio_por_noche = 207.00,
    total            = 414.00,
)
# Respuesta: uuid, A-000001, Q476.10 (con IVA), pdfUrl
```

---

## 🔒 Seguridad implementada

- Contraseñas con BCrypt (hash unidireccional)
- JWT con expiración y roles
- Solo últimos 4 dígitos de tarjeta almacenados
- CVV nunca almacenado
- Captcha matemático anti-bot
- Descarga de PDF requiere autenticación JWT
- Comunicación B2B exclusivamente server-to-server
- Callback con secret compartido

---

## 📄 Licencia

Sistema académico — Universidad del Istmo (UNIS) 2026.
Ingeniería en Sistemas — Análisis, Diseño y Fabricación de Sistemas.

# Gimed Backend API

Backend API para Gimed — Plataforma de beneficios y servicios médicos/farmacéuticos, con sistema de registro y autenticación, gestión multi-entidad (Farmacias, Doctores, Emergencias, Prestadores, Prestaciones/Servicios, Ofertas).

---

## 🚀 Características Principales

- Registro y autenticación JWT (usuarios, farmacias, doctores, admin, emergencias)
- Gestión y búsqueda de farmacias, doctores, emergencias y prestadores (providers)
- Sistema de prestaciones/ofertas (servicios, precios y reservas)
- Alta, edición y asignación de servicios y ofertas a providers (farmacias, doctores, etc.)
- Solicitud de turnos/servicios (“requests”) con seguimiento de estado
- Contactos empresariales y leads de usuarios
- Roles y permisos multi-entidad (usuario, pharmacy, doctor, emergency, admin)
- API RESTful (Express + Mongoose + Geolocalización)
- Seguridad: JWT, bcrypt, Express Middleware
- Verificación de email, protección rutas, validación de entrada

---

## 📋 Requisitos Previos

- Node.js (v14+)
- MongoDB (v4.4+)
- Cuenta en Resend (o proveedor SMTP de emails)
- Variables `.env` (ver ejemplo en `.env.example`)

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/pabloapc/gimed-backend.git
cd gimed-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gimed
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRE=7d
JWT_VERIFICATION_EXPIRE=24h
RESEND_API_KEY=tu_api_key_de_resend
FROM_EMAIL=noreply@tudominio.com
FRONTEND_URL=http://localhost:3000
```

4. Iniciar MongoDB (si es local):
```bash
mongod
```

5. (Opcional) Poblar la base de datos con farmacias de ejemplo:
```bash
npm run seed
```

## 🚀 Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación de la API

### Base URL
```
http://localhost:3000/api
```

### Autenticación

#### 1. Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Por favor verifica tu correo electrónico.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "isVerified": false
    }
  }
}
```

#### 2. Verificar Email
```http
GET /api/auth/verify-email/:token
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Correo electrónico verificado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "isVerified": true
    }
  }
}
```

#### 3. Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "isVerified": true
    }
  }
}
```

#### 4. Obtener Perfil de Usuario
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Farmacias (Requiere Autenticación)

Todas las rutas de farmacias requieren el header:
```
Authorization: Bearer {token}
```

#### 1. Listar Todas las Farmacias
```http
GET /api/pharmacies
```

#### 2. Listar Farmacias Cercanas (con coordenadas)
```http
GET /api/pharmacies?latitude=40.7128&longitude=-74.0060&maxDistance=5000
```

Parámetros de consulta:
- `latitude` (opcional): Latitud del usuario
- `longitude` (opcional): Longitud del usuario
- `maxDistance` (opcional): Distancia máxima en metros (default: 10000)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "count": 3,
  "message": "Farmacias cercanas encontradas",
  "data": {
    "pharmacies": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Farmacia San José",
        "address": "Av. Principal #123, Centro",
        "phone": "+1234567890",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        },
        "benefits": "Descuento del 15% en medicamentos genéricos",
        "discount": 15,
        "openingHours": "Lun-Vie: 8:00-20:00"
      }
    ]
  }
}
```

#### 3. Farmacias Cercanas al Usuario Actual
```http
GET /api/pharmacies/nearby?maxDistance=5000
```

Usa la ubicación del usuario registrado automáticamente.

#### 4. Obtener Detalle de Farmacia
```http
GET /api/pharmacies/:id
```

#### 5. Crear Nueva Farmacia
```http
POST /api/pharmacies
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Farmacia Nueva",
  "address": "Calle 123, Centro",
  "phone": "+1234567890",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "benefits": "Descuento del 10% en medicamentos genéricos",
  "discount": 10,
  "openingHours": "Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00"
}
```

**Campos requeridos**: `name`, `address`, `latitude`, `longitude`

**Campos opcionales**: `phone`, `benefits` (default: "Descuentos especiales para usuarios registrados"), `discount` (default: 10), `openingHours` (default: "Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00")

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Farmacia creada exitosamente",
  "data": {
    "pharmacy": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Farmacia Nueva",
      "address": "Calle 123, Centro",
      "phone": "+1234567890",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "benefits": "Descuento del 10% en medicamentos genéricos",
      "discount": 10,
      "openingHours": "Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 6. Actualizar Farmacia
```http
PUT /api/pharmacies/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Farmacia Actualizada",
  "discount": 15,
  "isActive": true
}
```

**Nota**: Todos los campos son opcionales. Solo se actualizarán los campos proporcionados.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Farmacia actualizada exitosamente",
  "data": {
    "pharmacy": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Farmacia Actualizada",
      "address": "Calle 123, Centro",
      "phone": "+1234567890",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "benefits": "Descuento del 15% en medicamentos genéricos",
      "discount": 15,
      "openingHours": "Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00",
      "isActive": true,
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

#### 7. Eliminar Farmacia
```http
DELETE /api/pharmacies/:id
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Farmacia eliminada exitosamente",
  "data": {}
}
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT para autenticación
- Validación de entrada con express-validator
- Verificación de email obligatoria
- Rutas protegidas con middleware de autenticación

## 🗂️ Estructura del Proyecto

```
gimed-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de MongoDB
│   ├── controllers/
│   │   ├── authController.js    # Controladores de autenticación
│   │   └── pharmacyController.js # Controladores de farmacias
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticación
│   │   ├── errorHandler.js      # Manejo de errores
│   │   └── validate.js          # Validación de datos
│   ├── models/
│   │   ├── User.js              # Modelo de usuario
│   │   └── Pharmacy.js          # Modelo de farmacia
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   └── pharmacyRoutes.js    # Rutas de farmacias
│   │   └── doctorsRoutes.js    # Rutas de farmacias
│   ├── utils/
│   │   ├── emailService.js      # Servicio de emails
│   │   ├── jwtUtils.js          # Utilidades JWT
│   │   └── seedPharmacies.js    # Script de seed
│   └── index.js                 # Punto de entrada
├── .env.example                 # Variables de entorno de ejemplo
├── .gitignore
├── package.json
└── README.md
```



## 📦 Dependencias Principales

- **express**: Framework web
- **mongoose**: ODM para MongoDB
- **jsonwebtoken**: Generación y verificación de JWT
- **bcrypt**: Hash de contraseñas
- **nodemailer**: Envío de emails
- **resend**: Servicio de email transaccional
- **express-validator**: Validación de entrada
- **cors**: Middleware CORS
- **dotenv**: Variables de entorno

## 🧪 Testing

```bash
npm test
```

## 📝 Notas de Desarrollo

- En modo desarrollo sin configurar Resend, los enlaces de verificación se mostrarán en la consola
- Los usuarios deben verificar su email antes de poder acceder a las rutas protegidas
- Las coordenadas se almacenan en formato GeoJSON para consultas geoespaciales eficientes
- El sistema usa índices 2dsphere de MongoDB para búsquedas de proximidad

## 📝 Notas 2

- Verifica tu email tras registrarte para acceder a rutas protegidas
- Geolocalización aplicada: búsqueda por proximidad, índices 2dsphere en MongoDB
- Usuarios, farmacias, doctores y emergencias pueden registrarse y usar la plataforma según su rol

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request





## Actualizacion rutas
## 📚 Rutas Principales de la API

> **Todas las rutas `/api/*` requieren autenticación JWT, salvo públicas marcadas. Los endpoints admin requieren role `admin`.**

### Autenticación y Usuario

- `POST   /api/auth/register`            — Registro de usuario
- `POST   /api/auth/login`               — Login
- `GET    /api/auth/me`                  — Perfil propio (token)
- `GET    /api/auth/verify-email/:token` — Verificación de email

### Farmacias

- `GET    /api/pharmacies`               — Listar farmacias
- `GET    /api/pharmacies/nearby`        — Cercanas al usuario
- `GET    /api/pharmacies/:id`           — Detalle farmacia
- `POST   /api/pharmacies`               — Crear farmacia
- `PUT    /api/pharmacies/:id`           — Editar farmacia
- `DELETE /api/pharmacies/:id`           — Eliminar farmacia

### Doctores

- `GET    /api/doctors`                  — Listar doctores
- `GET    /api/doctors/nearby`           — Cercanos al usuario
- `GET    /api/doctors/:id`              — Detalle doctor
- `POST   /api/doctors`                  — Crear doctor
- `PUT    /api/doctors/:id`              — Editar doctor
- `DELETE /api/doctors/:id`              — Eliminar doctor

### Emergencias

- `GET    /api/emergencies`              — Listar emergencias
- `GET    /api/emergencies/nearby`       — Cercanas
- `GET    /api/emergencies/:id`          — Detalle emergencia
- `POST   /api/emergencies`              — Crear emergencia
- `PUT    /api/emergencies/:id`          — Editar emergencia
- `DELETE /api/emergencies/:id`          — Eliminar emergencia

### Prestadores (“Providers”)

- `GET    /api/providers`                — Listar prestadores públicos
- `GET    /api/providers/:id`            — Detalle prestador
- `GET    /api/providers/:id/offerings`  — Ofertas/servicios de un prestador

### Prestaciones / Ofertas

- `GET    /api/prestations`              — Lista de prestaciones públicas
- `GET    /api/prestations/:id`          — Detalle prestación
- `GET    /api/provider-offerings`             — (Admin) Lista de todas las ofertas proveedor/prestación
- `POST   /api/provider-offerings`             — (Admin) Crear nueva oferta
- `PUT    /api/provider-offerings/:id`         — (Admin) Modificar oferta
- `DELETE /api/provider-offerings/:id`         — (Admin) Eliminar oferta

### Solicitudes (“Requests”)

- `POST   /api/requests`                 — Crear solicitud (usuario → farmacia/doctor/emergencia)
- `GET    /api/requests/pharmacy`        — Solicitudes de farmacia
- `GET    /api/requests/doctor`          — Solicitudes de doctor
- `GET    /api/requests/emergency`       — Solicitudes de emergencia
- `GET    /api/requests/user`            — Solicitudes propias del usuario
- `GET    /api/requests/:id`             — Detalle de solicitud
- `PUT    /api/requests/:id/status`      — Cambiar estado (aceptar, cancelar, etc.)
- `PUT    /api/requests/:id/reply`       — Responder/confirmar solicitud (usuario/farmacia/doctor/emergency)

### Contacto / Leads

- `POST   /api/contact/enterprise`       — Lead de contacto empresarial
- `POST   /api/contact`                  — (Auth) Lead de usuario logueado

**Ver rutas admin en `/api/admin/*` para gestión avanzada de usuarios, entidades, leads y estadísticas.**

## 🗂️ Modelos Principales

### User

- name, email, password, dni, teléfono, dirección, ciudad, provincia, código postal
- role (`user`, `pharmacy`, `doctor`, `emergency`, `admin`)
- location (geolocalización)
- isVerified, verificationToken, etc.

### Pharmacy / Doctor / Emergency

- name, address, phone, location, benefits, discount, openingHours, isActive, (y para doctores: specialty, url)

### Provider

- name, slug, code, categories, address, phone, url, horario, owner (User), location, metadata, isActive

### Prestation

- code, name, slug, description, categories, tags, defaultDurationMinutes, defaultPrice, applicableTo, isActive

### ProviderOffering

- providerId, prestationId, price, currency, durationMinutes, active, metadata

### Request

- targetType (`pharmacy`, `doctor`, `emergency`, `other`)
- targetId, user, userSnapshot, actionType, notes, status, prestationId, providerId, metadata, timestamps

### Lead

- name, email, company, role, message, source, user, userSnapshot

---

---
## Servicio de Auditoría de Carpeta Médica

Se incorporó un módulo de auditoría médica para gestionar licencias y reposos con trazabilidad completa del caso.

### Objetivo
Validar y monitorear carpetas médicas de empleados, integrando:
1. **Diagnóstico** (detalle médico + días de reposo).
2. **Carga digital** de receta/certificados.
3. **Auditoría automática** de consistencia y autenticidad.
4. **Seguimiento** con eventos GPS y registro de contacto activo.

### Componentes agregados

- **Modelo**: `src/models/MedicalAudit.js`
  - Guarda diagnóstico, documentos, estado de auditoría, tracking geolocalizado, log de contacto y cierre del caso.
  - Incluye índices para consulta por estado/empleado y geolocalización (`2dsphere`).

- **Servicio de validación**: `src/services/auditValidationService.js`
  - Ejecuta reglas automáticas sobre diagnóstico y documentos.
  - Devuelve:
    - `score` (0-100),
    - `flags` (alertas),
    - `suggestedStatus` (`validated`, `in_review`, `rejected`),
    - `autoApproved` (aprobación automática si cumple umbral).

- **Controlador**: `src/controllers/medicalAuditController.js`
  - Alta de auditoría.
  - Consulta de auditorías del empleado.
  - Consulta de auditoría por ID con control de acceso.
  - Carga de documentos adicionales.
  - Registro de eventos de seguimiento GPS.
  - Registro de contacto (admin).
  - Gestión administrativa: listado, validación/rechazo y cierre.

- **Rutas**:
  - `src/routes/auditRoutes.js` (usuario autenticado)
  - `src/routes/adminAuditRoutes.js` (solo admin)

### Estados principales

- **Auditoría**: `pending`, `in_review`, `validated`, `rejected`, `requires_more`.
- **Caso**: `active`, `closed`, `appealed`, `cancelled`.

### Endpoints

#### Usuario autenticado
- `POST /api/audits` → Crear auditoría.
- `GET /api/audits/my` → Listar mis auditorías.
- `GET /api/audits/:id` → Ver detalle.
- `POST /api/audits/:id/documents` → Agregar documentación.
- `POST /api/audits/:id/tracking` → Registrar ubicación/evento.

#### Administración
- `POST /api/audits/:id/contact` → Registrar contacto.
- `GET /api/admin/audits` → Listado general con filtros.
- `PATCH /api/admin/audits/:id/validate` → Validar/Rechazar/Requerir más info.
- `PATCH /api/admin/audits/:id/close` → Cerrar caso.

### Seguridad

- Todas las rutas usan autenticación (`protect`).
- Rutas administrativas protegidas por rol (`isAdmin`).
- Control de acceso en detalle de auditoría (dueño del caso o admin).


## 📄 Licencia

ISC

## 👤 Autor

Pablo APC

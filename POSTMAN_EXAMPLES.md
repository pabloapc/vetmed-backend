# Ejemplos de Requests para Postman

Esta guía te ayudará a probar la API usando Postman o cualquier cliente HTTP.

## Configuración Inicial

1. Base URL: `http://localhost:3000/api`
2. Para rutas protegidas, añade un header: `Authorization: Bearer {tu_token}`

## 1. Verificar que la API está funcionando

```
GET http://localhost:3000/
```

## 2. Registrar un Usuario

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Nota:** En modo desarrollo, el enlace de verificación se mostrará en la consola del servidor.

## 3. Verificar Email

Copia el token del enlace de verificación que aparece en la consola y úsalo:

```
GET http://localhost:3000/api/auth/verify-email/{TOKEN_AQUI}
```

Guarda el token JWT que recibes en la respuesta.

## 4. Iniciar Sesión

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

Guarda el token JWT de la respuesta.

## 5. Obtener Perfil de Usuario

```
GET http://localhost:3000/api/auth/me
Authorization: Bearer {tu_token_jwt}
```

## 6. Listar Todas las Farmacias

```
GET http://localhost:3000/api/pharmacies
Authorization: Bearer {tu_token_jwt}
```

## 7. Buscar Farmacias Cercanas

```
GET http://localhost:3000/api/pharmacies?latitude=40.7128&longitude=-74.0060&maxDistance=5000
Authorization: Bearer {tu_token_jwt}
```

## 8. Farmacias Cercanas al Usuario Actual

```
GET http://localhost:3000/api/pharmacies/nearby?maxDistance=5000
Authorization: Bearer {tu_token_jwt}
```

## 9. Obtener Detalle de una Farmacia

```
GET http://localhost:3000/api/pharmacies/{pharmacy_id}
Authorization: Bearer {tu_token_jwt}
```

## 10. Crear Nueva Farmacia

```
POST http://localhost:3000/api/pharmacies
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}

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

**Campos opcionales**: `phone`, `benefits`, `discount`, `openingHours`

## 11. Actualizar Farmacia Existente

```
PUT http://localhost:3000/api/pharmacies/{pharmacy_id}
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}

{
  "name": "Farmacia Actualizada",
  "discount": 15,
  "isActive": true
}
```

**Nota**: Todos los campos son opcionales. Solo actualiza los campos que proporciones.

Ejemplos de actualización:
- Cambiar solo el nombre: `{"name": "Nuevo Nombre"}`
- Cambiar solo el descuento: `{"discount": 20}`
- Desactivar temporalmente: `{"isActive": false}`
- Actualizar ubicación: `{"latitude": 40.7130, "longitude": -74.0065}`

## 12. Eliminar Farmacia

```
DELETE http://localhost:3000/api/pharmacies/{pharmacy_id}
Authorization: Bearer {tu_token_jwt}
```

**⚠️ Advertencia**: Esta operación elimina permanentemente la farmacia de la base de datos.

## Respuestas Comunes

### Éxito (200, 201)
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Error (400, 401, 404, 500)
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Códigos de Estado HTTP

- `200` - OK (petición exitosa)
- `201` - Created (recurso creado exitosamente)
- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (email no verificado)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error (error del servidor)

## Tips para Testing

1. Primero registra un usuario
2. Verifica el email usando el token de la consola
3. Usa el token JWT en el header `Authorization: Bearer {token}` para todas las rutas protegidas
4. Si quieres probar farmacias cercanas, primero ejecuta `npm run seed` para poblar la base de datos
5. Los tokens expiran según la configuración (default: 7 días para auth, 24 horas para verificación)

## Colección de Postman

Puedes importar esta colección JSON en Postman:

```json
{
  "info": {
    "name": "Gimed API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Juan Pérez\",\n  \"email\": \"juan@example.com\",\n  \"password\": \"password123\",\n  \"latitude\": 40.7128,\n  \"longitude\": -74.0060\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"juan@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Verify Email",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/auth/verify-email/:token",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "verify-email", ":token"],
              "variable": [
                {
                  "key": "token",
                  "value": ""
                }
              ]
            }
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/auth/me",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "me"]
            }
          }
        }
      ]
    },
    {
      "name": "Pharmacies",
      "item": [
        {
          "name": "Get All Pharmacies",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/pharmacies",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies"]
            }
          }
        },
        {
          "name": "Get Nearby Pharmacies",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/pharmacies/nearby?maxDistance=5000",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies", "nearby"],
              "query": [
                {
                  "key": "maxDistance",
                  "value": "5000"
                }
              ]
            }
          }
        },
        {
          "name": "Search Pharmacies by Location",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/pharmacies?latitude=40.7128&longitude=-74.0060&maxDistance=5000",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies"],
              "query": [
                {
                  "key": "latitude",
                  "value": "40.7128"
                },
                {
                  "key": "longitude",
                  "value": "-74.0060"
                },
                {
                  "key": "maxDistance",
                  "value": "5000"
                }
              ]
            }
          }
        },
        {
          "name": "Get Pharmacy by ID",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/pharmacies/:id",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": ""
                }
              ]
            }
          }
        },
        {
          "name": "Create Pharmacy",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Farmacia Nueva\",\n  \"address\": \"Calle 123, Centro\",\n  \"phone\": \"+1234567890\",\n  \"latitude\": 40.7128,\n  \"longitude\": -74.0060,\n  \"benefits\": \"Descuento del 10% en medicamentos genéricos\",\n  \"discount\": 10,\n  \"openingHours\": \"Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/pharmacies",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies"]
            }
          }
        },
        {
          "name": "Update Pharmacy",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Farmacia Actualizada\",\n  \"discount\": 15,\n  \"isActive\": true\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/pharmacies/:id",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": ""
                }
              ]
            }
          }
        },
        {
          "name": "Delete Pharmacy",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/pharmacies/:id",
              "host": ["{{baseUrl}}"],
              "path": ["pharmacies", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": ""
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Copia el JSON de arriba y usa "Import" -> "Raw text" en Postman.

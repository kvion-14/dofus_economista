# Dofus Economista

Aplicación web para gestionar cálculos y cuentas de forjamagia en el juego Dofus.

## Características

- **Registro de items rotos**: Guarda información sobre items que rompes al hacer forjamagia
- **Cálculos automáticos**: Calcula el valor total de las runas obtenidas y el beneficio/pérdida
- **Gestión de precios**: Asigna precios a cada tipo de runa para los cálculos
- **Historial de precios**: Guarda un registro de los cambios de precios de cada runa
- **Gestión de equipo**: Calcula estadísticas totales de tu equipo
- **Persistencia con SQLite**: Todos los datos se guardan en una base de datos SQLite local
- **API de DofusDB**: Obtiene automáticamente la lista de runas del juego
- **Backend Flask**: API REST para gestionar datos
- **Launcher automático**: Script .bat para iniciar backend y frontend con un solo clic

## Instalación y Uso Rápido

### Requisitos previos
- Node.js (https://nodejs.org/)
- Python 3 (https://python.org/)

### Iniciar la aplicación

**Opción 1: Usar el launcher (recomendado)**

1. Haz doble clic en `DofusEconomista.bat`
2. El launcher iniciará automáticamente:
   - El backend de Python (Flask) en puerto 5000
   - El frontend de Next.js en puerto 3000
   - Tu navegador en http://localhost:3000
3. Cierra la ventana del launcher para detener todos los servicios

**Opción 2: Iniciar manualmente**

1. Instala las dependencias del frontend:
```bash
npm install
```

2. Instala las dependencias del backend:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

3. Inicia el backend (en una terminal):
```bash
cd backend
python app.py
```

4. Inicia el frontend (en otra terminal):
```bash
npm run dev
```

5. Abre tu navegador en `http://localhost:3000`

## Uso

### Página Principal (Romper Runas)

1. Haz clic en "Agregar Item" para registrar un nuevo item roto
2. Completa la información:
   - **Nombre del item**: Ej: "Anillo del Dragón"
   - **Porcentaje de rotura**: El porcentaje que te da el juego al romper el item
   - **Precio del item** (opcional): Si compraste el item, pon su precio
   - **Precio de crafteo** (opcional): Si lo crafteaste, pon el costo
3. Agrega las runas que obtuviste:
   - Selecciona el tipo de runa del desplegable
   - Indica la cantidad
   - Puedes agregar múltiples runas
4. Guarda el item

La tabla mostrará:
- Total de kamas de las runas obtenidas
- Beneficio/pérdida si compraste el item
- Beneficio/pérdida si lo crafteaste
- "Falta info" si no completaste el precio correspondiente

### Página de Precios Runas

1. Navega a la página "Precios Runas" desde el menú superior
2. Verás todas las runas del juego (obtenidas de la API de DofusDB)
3. Para asignar un precio:
   - Haz clic en el precio para editarlo
   - Ingresa el precio en kamas
   - Haz clic en el icono de guardar
4. Para actualizar los datos de la API, haz clic en "Actualizar datos API"
5. Para ver el historial de precios, haz clic en "Ver Históricos"

### Página de Históricos

1. Navega a la página "Históricos" desde la página de Precios Runas
2. Verás todas las runas con historial de cambios de precios
3. Haz clic en una runa para ver su historial completo
4. Usa el campo de búsqueda para filtrar por nombre de runa

### Página de Equipo

1. Navega a la página "Equipo" desde el menú superior
2. Busca items por nombre o filtra por tipo
3. Agrega items a tu equipo para calcular estadísticas totales
4. Ve los bonus acumulados de tu equipo completo

## API del Backend

El backend (Flask) expone una API REST en `http://localhost:5000`:

### Precios de runas
- `GET /api/rune-prices` - Obtener todos los precios de runas
- `POST /api/rune-prices` - Establecer precio de una runa
- `DELETE /api/rune-prices/<rune_id>` - Eliminar precio de una runa

### Historial de precios
- `GET /api/price-history` - Obtener historial de precios
- `DELETE /api/price-history` - Limpiar historial de precios

### Items rotos
- `GET /api/broken-items` - Obtener items rotos
- `GET /api/broken-items-history` - Obtener historial de items rotos
- `POST /api/broken-items` - Añadir item roto
- `DELETE /api/broken-items/<item_id>` - Eliminar item roto

### Datos de runas
- `GET /api/runes` - Obtener datos de runas
- `POST /api/runes` - Establecer datos de runas

### Equipo
- `GET /api/equipment` - Obtener equipo
- `POST /api/equipment` - Establecer equipo
- `GET /api/equipment-items` - Obtener items de equipo
- `POST /api/equipment-items` - Añadir item a equipo
- `DELETE /api/equipment-items/<item_id>` - Eliminar item de equipo

### Favoritos
- `GET /api/favorites` - Obtener items favoritos
- `POST /api/favorites/<item_id>` - Añadir/eliminar favorito

### Caché
- `GET /api/items-cache/<type_id>` - Obtener caché de items
- `POST /api/items-cache` - Guardar caché de items
- `GET /api/characteristics-cache` - Obtener caché de características
- `POST /api/characteristics-cache` - Guardar caché de características
- `GET /api/item-images-cache` - Obtener caché de imágenes
- `POST /api/item-images-cache` - Guardar caché de imágenes
- `GET /api/characteristic-icons` - Obtener iconos de características
- `POST /api/characteristic-icons` - Establecer iconos de características

### Utilidades
- `POST /api/clear-all` - Limpiar todos los datos
- `POST /api/reset-prices` - Resetear todos los precios a 0

## Base de Datos

La aplicación usa **SQLite** para guardar todos los datos de forma persistente en el archivo `backend/dofus.db`.

### Estructura de la base de datos

- **rune_prices**: Precios actuales de las runas
- **price_history**: Historial de cambios de precios
- **broken_items**: Items rotos registrados
- **broken_items_history**: Historial completo de items rotos
- **runes**: Datos de runas obtenidos de la API de DofusDB
- **equipment**: IDs de items en el equipo
- **equipment_items**: Datos completos de items del equipo
- **favorites**: Items marcados como favoritos
- **items_cache**: Caché de items por tipo
- **characteristics_cache**: Caché de características
- **item_images_cache**: Caché de imágenes de items
- **characteristic_icons**: Mapeo de características a iconos

## Tecnologías

- **Next.js 16**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS 4**: Estilos
- **Lucide React**: Iconos
- **Flask 3.0**: Backend API
- **SQLite**: Base de datos
- **DofusDB API**: Datos de runas del juego

## Estructura del Proyecto

```
.
├── backend/
│   ├── app.py              # Backend Flask con API
│   ├── dofus.db            # Base de datos SQLite
│   └── requirements.txt    # Dependencias de Python
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Layout principal con Header
│   │   ├── page.tsx        # Página principal (items rotos)
│   │   ├── precios/
│   │   │   └── page.tsx    # Página de precios de runas
│   │   ├── equipo/
│   │   │   └── page.tsx    # Página de equipo
│   │   └── globals.css     # Estilos globales
│   ├── components/
│   │   └── Header.tsx      # Componente de navegación
│   ├── lib/
│   │   ├── dofus-api.ts    # Servicio para API de DofusDB
│   │   └── storage-sql.ts  # Sistema de persistencia con API backend
│   └── types/
│       └── dofus.ts        # Types e interfaces
├── public/
│   └── assets/             # Imágenes y recursos
├── DofusEconomista.bat     # Launcher automático
├── package.json            # Dependencias de Node.js
└── next.config.ts          # Configuración de Next.js
```

## Notas

- Los datos se guardan en SQLite en el archivo `backend/dofus.db`. Si borras este archivo, perderás todos los datos.
- La aplicación necesita conexión a internet para obtener la lista de runas de la API de DofusDB.
- Los precios están en kamas (moneda del juego).
- El launcher `.bat` verifica automáticamente que Node.js y Python estén instalados antes de iniciar.

# Dofus Economista Backend

Backend en Python con Flask y SQLite para la aplicación Dofus Economista.

## Instalación

1. Crear un entorno virtual:
```bash
python -m venv venv
```

2. Activar el entorno virtual:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

## Ejecución

Iniciar el servidor:
```bash
python app.py
```

El servidor se ejecutará en `http://localhost:5000`

## API Endpoints

### Precios de runas
- `GET /api/rune-prices` - Obtener todos los precios de runas
- `POST /api/rune-prices` - Establecer precio de una runa
- `DELETE /api/rune-prices/<rune_id>` - Eliminar precio de una runa

### Historial de precios
- `GET /api/price-history` - Obtener historial de precios
- `DELETE /api/price-history` - Limpiar historial de precios

### Items rotos
- `GET /api/broken-items` - Obtener items rotos
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

### Caché
- `GET /api/items-cache/<type_id>` - Obtener caché de items
- `POST /api/items-cache` - Guardar caché de items
- `GET /api/characteristics-cache` - Obtener caché de características
- `POST /api/characteristics-cache` - Guardar caché de características
- `GET /api/item-images-cache` - Obtener caché de imágenes
- `POST /api/item-images-cache` - Guardar caché de imágenes

### Utilidades
- `POST /api/clear-all` - Limpiar todos los datos
- `POST /api/reset-prices` - Resetear todos los precios a 0

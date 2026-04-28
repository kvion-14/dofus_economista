# Dofus Forjamagia

Aplicación web para gestionar cálculos y cuentas de forjamagia en el juego Dofus.

## Características

- **Registro de items rotos**: Guarda información sobre items que rompes al hacer forjamagia
- **Cálculos automáticos**: Calcula el valor total de las runas obtenidas y el beneficio/pérdida
- **Gestión de precios**: Asigna precios a cada tipo de runa para los cálculos
- **Historial de precios**: Guarda un registro de los cambios de precios de cada runa
- **Persistencia con SQLite**: Todos los datos se guardan en una base de datos SQLite local
- **API de DofusDB**: Obtiene automáticamente la lista de runas del juego
- **Migración automática**: Los datos de localStorage se migran automáticamente a SQLite

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:3000`

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

## Base de Datos (AlaSQL)

La aplicación usa **AlaSQL** para guardar todos los datos de forma persistente. AlaSQL es una base de datos SQL que funciona en el navegador sin necesidad de archivos WASM ni configuración de servidor. Los datos se guardan en localStorage como JSON.

### Backup de datos

Para hacer backup de tus datos:

1. La base de datos se guarda automáticamente en localStorage bajo la clave `dofus.db`
2. Para hacer backup manual, puedes exportar la base de datos como archivo JSON desde la aplicación (funcionalidad próximamente disponible)
3. Para restaurar, puedes importar un archivo JSON previamente exportado

### Ventajas de AlaSQL

- **Persistencia real**: Los datos se guardan en localStorage como JSON
- **Sin archivos WASM**: Funciona directamente en el navegador sin necesidad de archivos WebAssembly
- **SQL completo**: Puedes hacer consultas complejas si necesitas
- **Funciona en el navegador**: No requiere servidor ni configuración
- **Gratis**: AlaSQL es completamente gratis y open source

### Estructura de la base de datos

- **runes**: Datos de runas obtenidos de la API de DofusDB
- **rune_prices**: Precios actuales de las runas
- **price_history**: Historial de cambios de precios
- **broken_items**: Items rotos registrados

## Tecnologías

- **Next.js 16**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS 4**: Estilos
- **Lucide React**: Iconos
- **AlaSQL**: Base de datos SQL en el navegador
- **DofusDB API**: Datos de runas del juego

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx          # Layout principal con Header
│   ├── page.tsx            # Página principal (items rotos)
│   ├── precios/
│   │   ├── page.tsx        # Página de precios de runas
│   │   └── historicos/
│   │       └── page.tsx    # Página de históricos de precios
│   └── globals.css         # Estilos globales
├── components/
│   └── Header.tsx          # Componente de navegación
├── lib/
│   ├── db.ts               # Configuración de AlaSQL
│   ├── dofus-api.ts        # Servicio para API de DofusDB
│   ├── storage-sql.ts      # Sistema de persistencia AlaSQL
│   └── migrate.ts          # Lógica de migración (eliminado)
└── types/
    └── dofus.ts            # Types e interfaces
```

## Notas

- Los datos se guardan en localStorage como JSON (clave: `dofus.db`). Si borras el localStorage, perderás todos los datos.
- La aplicación necesita conexión a internet para obtener la lista de runas de la API de DofusDB.
- Los precios están en kamas (moneda del juego).
- AlaSQL funciona completamente en el navegador sin necesidad de archivos WASM ni configuración de servidor.

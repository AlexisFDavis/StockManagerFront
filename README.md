# Stock Manager Frontend

Sistema de gestión de stock y alquileres para productos de construcción. Demo frontend desarrollada con Next.js y Tremor.

## Características

- ✅ Autenticación simulada (login dummy)
- ✅ Dashboard con métricas, KPIs y gráficos
- ✅ Gestión completa de inventario (CRUD)
- ✅ Sistema de alquileres con cálculo automático de precios
- ✅ **Devolución parcial** de productos alquilados
- ✅ **Edición de fecha de devolución** en alquileres activos
- ✅ Gestión de clientes con historial de alquileres
- ✅ Control de stock automático al alquilar/devolver productos
- ✅ **Sección de Reportes** con KPIs y análisis detallado
- ✅ Interfaz moderna y profesional con Tremor UI

## Tecnologías

- **Next.js 14** (App Router)
- **TypeScript**
- **Tremor** (Componentes UI y gráficos)
- **Zustand** (Estado global)
- **Tailwind CSS**
- **date-fns** (Manejo de fechas)

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en modo desarrollo:

```bash
npm run dev
```

3. Abrir [http://localhost:3000](http://localhost:3000) en el navegador

## Estructura del Proyecto

```
├── app/
│   ├── dashboard/        # Dashboard principal con KPIs
│   ├── inventario/       # Gestión de productos (cards)
│   ├── alquileres/       # Gestión de alquileres
│   ├── clientes/         # Gestión de clientes
│   ├── reportes/         # Reportes y análisis
│   ├── login/            # Página de login
│   └── layout.tsx        # Layout principal
├── components/
│   └── Sidebar.tsx       # Barra lateral de navegación
├── store/
│   └── store.ts          # Estado global (Zustand)
├── types/
│   └── index.ts          # Tipos TypeScript
└── package.json
```

## Funcionalidades por Sección

### Dashboard
- KPIs principales: alquileres activos, ingresos, stock, clientes
- Alertas de stock bajo y productos agotados
- Gráfico de productos más alquilados
- Gráfico de ingresos por cliente
- Distribución de stock (donut chart)
- Lista de alquileres activos con días restantes

### Inventario
- Vista en tarjetas (cards) de productos
- KPIs: productos totales, stock, valor total, alertas
- Agregar, editar y eliminar productos
- Indicadores visuales de stock (verde/amarillo/rojo)
- Valor calculado del inventario

### Alquileres
- KPIs: activos, ingresos totales, próximos a vencer
- Crear nuevos alquileres con selección de productos
- Validación de stock disponible
- Cálculo automático con sobrescritura manual del total
- **Devolución completa** de alquileres
- **Devolución parcial** de productos específicos
- **Editar fecha de devolución** para extender o acortar
- Historial de alquileres devueltos

### Clientes
- KPIs: total, con alquileres activos, ingresos, promedio
- Lista interactiva de clientes con estadísticas
- Vista detallada con historial completo
- Top 5 clientes por ingresos
- CRUD completo de clientes

### Reportes
- **KPIs generales** del sistema completo
- **Ticket promedio** por alquiler
- **Valor promedio** por cliente
- **Tasa de retención** de alquileres
- Gráficos de barras de stock por producto
- Distribución del valor en stock (donut)
- Top clientes por ingresos y por cantidad
- Estado de alquileres (activos vs devueltos)
- Salud del stock (saludable/bajo/agotado)
- Rendimiento de productos (alquileres e ingresos)
- Tabla de próximas devoluciones

## Datos Mock

La aplicación incluye datos de ejemplo:
- 5 productos predefinidos
- 3 clientes de ejemplo
- 2 alquileres activos

## Preparado para Backend

El código está estructurado para conectarse fácilmente con un backend real:

- **Store centralizado** con Zustand - fácil de reemplazar con llamadas API
- **Tipos TypeScript** definidos para todas las entidades
- **Funciones separadas** para cada operación CRUD
- **Componentes preparados** para recibir datos de APIs REST/GraphQL

### Ejemplo de integración con API:

```typescript
// Reemplazar en store.ts
addProduct: async (product) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  const newProduct = await response.json();
  set((state) => ({
    products: [...state.products, newProduct],
  }));
},
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Características de UX

- **Diseño responsivo** - Funciona en desktop y tablet
- **Indicadores visuales** - Badges de colores para estados
- **Confirmaciones** - Diálogos antes de eliminar
- **Feedback inmediato** - Cambios reflejados al instante
- **Navegación fluida** - Sin recargas de página

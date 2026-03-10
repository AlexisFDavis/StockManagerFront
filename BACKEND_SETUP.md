# Guía de Implementación del Backend

## 📋 Resumen

Esta aplicación usa **Next.js API Routes** con **PostgreSQL** y **Prisma** como ORM. Esta arquitectura es ideal porque:

- ✅ Ya estás usando Next.js, así que no necesitas un backend separado
- ✅ Type-safe con TypeScript y Prisma
- ✅ Escalable y robusto
- ✅ Fácil de mantener y desarrollar

## 🚀 Pasos de Implementación

### 1. Instalar Dependencias

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Configurar Base de Datos

#### Opción A: PostgreSQL Local
1. Instala PostgreSQL en tu máquina
2. Crea una base de datos:
```sql
CREATE DATABASE stockmanager;
```

#### Opción B: PostgreSQL en la Nube (Recomendado)
- **Supabase** (gratis hasta 500MB): https://supabase.com
- **Neon** (gratis): https://neon.tech
- **Railway** (gratis con límites): https://railway.app
- **Vercel Postgres** (si despliegas en Vercel)

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/stockmanager?schema=public"
```

### 4. Inicializar Prisma

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas en la base de datos
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio para ver los datos
npx prisma studio
```

### 5. Migrar Datos Existentes (Opcional)

Si tienes datos en el store de Zustand, puedes crear un script de migración:

```typescript
// scripts/migrate-data.ts
import { prisma } from '@/lib/prisma'
import { useStore } from '@/store/store'

async function migrate() {
  const store = useStore.getState()
  
  // Migrar productos
  for (const product of store.products) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        stockTotal: product.stockTotal,
        stockActual: product.stockActual,
        price: product.price,
        notes: product.notes,
        lowStockThreshold: product.lowStockThreshold || 20,
        stockAddHistory: {
          create: (product.addHistory || []).map(h => ({
            id: h.id,
            quantity: h.quantity,
            date: new Date(h.date),
            notes: h.notes
          }))
        }
      }
    })
  }
  
  // Similar para clients, obras, rentals...
}

migrate()
```

## 📁 Estructura de Archivos

```
app/
  api/
    products/
      route.ts          # GET, POST /api/products
      [id]/
        route.ts        # GET, PUT, DELETE /api/products/[id]
    clients/
      route.ts          # GET, POST /api/clients
      [id]/
        route.ts        # GET, PUT, DELETE /api/clients/[id]
    obras/
      route.ts          # GET, POST /api/obras
      [id]/
        route.ts        # GET, PUT, DELETE /api/obras/[id]
    rentals/
      route.ts          # GET, POST /api/rentals
      [id]/
        route.ts        # GET, PUT, DELETE /api/rentals/[id]
      [id]/payments/
        route.ts        # POST /api/rentals/[id]/payments
    stock-movements/
      route.ts          # GET /api/stock-movements?obraId=...
lib/
  prisma.ts             # Cliente de Prisma (singleton)
prisma/
  schema.prisma         # Esquema de la base de datos
```

## 🔄 Integración con Zustand

Modifica tu store para que sincronice con el backend:

```typescript
// store/store.ts
import { useStore as useZustandStore } from 'zustand'

// Función helper para hacer fetch
async function fetchFromAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`)
  }
  
  return response.json()
}

// Ejemplo: addProduct
addProduct: async (product) => {
  try {
    const newProduct = await fetchFromAPI<Product>('products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
    
    set((state) => ({
      products: [...state.products, newProduct],
    }))
  } catch (error) {
    console.error('Error adding product:', error)
    throw error
  }
},
```

## 📝 API Routes Pendientes

Necesitas crear estos endpoints adicionales:

1. **Obras**
   - `app/api/obras/[id]/route.ts` - GET, PUT, DELETE
   - `app/api/obras/[id]/finish/route.ts` - POST (finalizar obra)
   - `app/api/obras/[id]/pause/route.ts` - POST (pausar obra)

2. **Rentals**
   - `app/api/rentals/[id]/route.ts` - GET, PUT, DELETE
   - `app/api/rentals/[id]/items/route.ts` - PUT (actualizar items)
   - `app/api/rentals/[id]/payments/route.ts` - POST (registrar pago)
   - `app/api/rentals/[id]/return/route.ts` - POST (devolver alquiler)
   - `app/api/rentals/[id]/transfer/route.ts` - POST (trasladar stock)

3. **Stock Movements**
   - `app/api/stock-movements/route.ts` - GET con filtros

## 🔐 Autenticación (Opcional)

Si quieres agregar autenticación, puedes usar NextAuth.js:

```bash
npm install next-auth
```

Luego configura en `app/api/auth/[...nextauth]/route.ts`

## 🚢 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Agrega la variable `DATABASE_URL` en la configuración
3. Vercel ejecutará automáticamente `prisma migrate deploy` en producción

### Otras Plataformas
- **Railway**: Similar a Vercel, con PostgreSQL incluido
- **Render**: Soporta Next.js y PostgreSQL
- **AWS/GCP/Azure**: Requiere más configuración

## 🧪 Testing

Puedes probar los endpoints con:

```bash
# Obtener productos
curl http://localhost:3000/api/products

# Crear producto
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100,"stockTotal":10}'
```

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/)

## ⚠️ Notas Importantes

1. **IDs**: Prisma usa UUIDs por defecto. Si necesitas mantener los IDs actuales, puedes usar `@default(uuid())` o cambiar a `@id @default(cuid())`

2. **Fechas**: Prisma maneja fechas como `DateTime`. Asegúrate de convertir strings ISO a Date cuando sea necesario.

3. **Relaciones**: Las relaciones en Prisma son automáticas. Cuando eliminas un registro padre, los hijos se eliminan en cascada (si configuraste `onDelete: Cascade`).

4. **Transacciones**: Para operaciones complejas (como transferir stock), usa transacciones de Prisma:

```typescript
await prisma.$transaction(async (tx) => {
  // Múltiples operaciones atómicas
})
```


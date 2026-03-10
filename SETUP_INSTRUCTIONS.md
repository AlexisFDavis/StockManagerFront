# 🚀 Instrucciones de Configuración del Backend

## ⚠️ Error Actual: `Cannot find module '@prisma/client'`

Este error es **normal y esperado** hasta que ejecutes los siguientes pasos.

## 📋 Pasos para Resolver el Error

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Base de Datos

Crea un archivo `.env` en la raíz del proyecto con:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/stockmanager?schema=public"
```

**Opciones de Base de Datos:**
- **Local**: Instala PostgreSQL y crea una base de datos
- **Supabase** (Recomendado - Gratis): https://supabase.com
- **Neon** (Gratis): https://neon.tech
- **Railway** (Gratis con límites): https://railway.app

### 3. Generar el Cliente de Prisma

Este comando **resolverá el error de TypeScript**:

```bash
npx prisma generate
```

### 4. Crear las Tablas en la Base de Datos

```bash
npx prisma migrate dev --name init
```

### 5. (Opcional) Ver los Datos con Prisma Studio

```bash
npx prisma studio
```

## ✅ Verificación

Después de ejecutar `npx prisma generate`, el error en `lib/prisma.ts` debería desaparecer.

## 🔍 Si el Error Persiste

1. **Verifica que las dependencias estén instaladas:**
   ```bash
   npm list @prisma/client
   ```

2. **Reinstala las dependencias:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npx prisma generate
   ```

3. **Verifica que el archivo `prisma/schema.prisma` existe y está correcto**

4. **Reinicia el servidor de TypeScript en VS Code:**
   - Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
   - Escribe "TypeScript: Restart TS Server"
   - Presiona Enter

## 📚 Próximos Pasos

Una vez resuelto el error, puedes:
- Probar los endpoints de la API
- Integrar el store de Zustand con el backend
- Migrar datos existentes (si los tienes)


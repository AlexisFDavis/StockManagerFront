import { cookies } from 'next/headers'
import { prisma } from './prisma'

export interface UserSession {
  id: string
  name: string
  username: string
}

const SESSION_COOKIE_NAME = 'stock-manager-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

// Crear sesión
export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

// Obtener usuario actual desde la sesión
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    
    if (!userId) return null
    
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        isActive: true 
      },
      select: { 
        id: true, 
        name: true, 
        username: true 
      }
    })
    
    return user
  } catch (error) {
    return null
  }
}

// Cerrar sesión
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Verificar autenticación (lanzar error si no está autenticado)
export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('No autenticado')
  }
  
  return user
}


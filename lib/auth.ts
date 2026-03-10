import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Tipos
export interface UserSession {
  id: string
  name: string
  username: string
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Obtener usuario desde el token/sesión
export async function getCurrentUser(request: NextRequest): Promise<UserSession | null> {
  // Por ahora, obtenemos el usuario desde el header
  // En producción, usarías cookies/JWT
  const userId = request.headers.get('x-user-id')
  
  if (!userId) return null
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true }
    })
    
    return user
  } catch (error) {
    return null
  }
}

// Middleware para verificar autenticación
export async function requireAuth(request: NextRequest): Promise<UserSession> {
  const user = await getCurrentUser(request)
  
  if (!user) {
    throw new Error('No autenticado')
  }
  
  return user
}


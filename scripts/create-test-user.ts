/**
 * Script para crear un usuario de prueba
 * Ejecutar con: npx ts-node scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const username = 'admin'
    const password = 'admin123'
    const name = 'Usuario Administrador'
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser) {
      console.log('❌ El usuario ya existe')
      return
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        isActive: true
      }
    })
    
    console.log('✅ Usuario creado exitosamente:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.name}`)
    console.log(`   Usuario: ${user.username}`)
    console.log(`   Contraseña: ${password}`)
    console.log('\n⚠️  Guarda esta información de forma segura')
    
  } catch (error) {
    console.error('❌ Error al crear usuario:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// GET /api/clients - Obtener todos los clientes
export async function GET() {
  try {
    await requireAuth()
    
    const clients = await prisma.client.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(clients)
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Crear un nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, email, phone, address, notes } = body
    
    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        createdById: user.id,
        updatedById: user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      }
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}


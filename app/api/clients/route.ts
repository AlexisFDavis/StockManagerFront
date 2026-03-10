import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/clients - Obtener todos los clientes
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(clients)
  } catch (error) {
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
    const body = await request.json()
    const { name, email, phone, address, notes } = body
    
    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null
      }
    })
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}


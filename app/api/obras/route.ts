import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// GET /api/obras
export async function GET() {
  try {
    await requireAuth()
    
    const obras = await prisma.obra.findMany({
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transformar para incluir clientName
    const obrasWithClientName = obras.map((obra: any) => ({
      ...obra,
      clientName: obra.client.name
    }))
    
    return NextResponse.json(obrasWithClientName)
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching obras:', error)
    return NextResponse.json(
      { error: 'Error al obtener obras' },
      { status: 500 }
    )
  }
}

// POST /api/obras
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { clientId, name, description, address } = body
    
    const obra = await prisma.obra.create({
      data: {
        clientId,
        name,
        description: description || null,
        address: address || null,
        status: 'active',
        createdById: user.id,
        updatedById: user.id
      },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      }
    })
    
    return NextResponse.json({
      ...obra,
      clientName: obra.client.name
    }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error creating obra:', error)
    return NextResponse.json(
      { error: 'Error al crear obra' },
      { status: 500 }
    )
  }
}


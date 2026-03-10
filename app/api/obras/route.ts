import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/obras
export async function GET() {
  try {
    const obras = await prisma.obra.findMany({
      include: {
        client: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transformar para incluir clientName
    const obrasWithClientName = obras.map((obra: any) => ({
      ...obra,
      clientName: obra.client.name
    }))
    
    return NextResponse.json(obrasWithClientName)
  } catch (error) {
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
    const body = await request.json()
    const { clientId, name, description, address } = body
    
    const obra = await prisma.obra.create({
      data: {
        clientId,
        name,
        description: description || null,
        address: address || null,
        status: 'active'
      },
      include: {
        client: true
      }
    })
    
    return NextResponse.json({
      ...obra,
      clientName: obra.client.name
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating obra:', error)
    return NextResponse.json(
      { error: 'Error al crear obra' },
      { status: 500 }
    )
  }
}


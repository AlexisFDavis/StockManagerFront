import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// GET /api/obras/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const obra = await prisma.obra.findUnique({
      where: { id: params.id },
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
    
    if (!obra) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      ...obra,
      clientName: obra.client.name
    })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching obra:', error)
    return NextResponse.json(
      { error: 'Error al obtener obra' },
      { status: 500 }
    )
  }
}

// PUT /api/obras/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { clientId, name, description, address, status, pagado } = body
    
    // Obtener obra actual para calcular totalPrice
    const existingObra = await prisma.obra.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          select: {
            totalPrice: true
          }
        }
      }
    })
    
    if (!existingObra) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
    }
    
    // Calcular totalPrice desde rentals
    const totalPrice = existingObra.rentals.reduce((sum: number, rental: any) => {
      return sum + (rental.totalPrice || 0)
    }, 0)
    
    const newPagado = pagado !== undefined ? pagado : existingObra.pagado
    const resto = totalPrice - newPagado
    
    const updateData: any = {
      updatedById: user.id
    }
    
    if (clientId !== undefined) updateData.clientId = clientId
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (address !== undefined) updateData.address = address
    if (status !== undefined) updateData.status = status
    if (pagado !== undefined) {
      updateData.pagado = newPagado
      updateData.resto = resto
    }
    
    const obra = await prisma.obra.update({
      where: { id: params.id },
      data: updateData,
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
      clientName: obra.client.name,
      totalPrice,
      resto
    })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error updating obra:', error)
    return NextResponse.json(
      { error: 'Error al actualizar obra' },
      { status: 500 }
    )
  }
}

// DELETE /api/obras/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    // Verificar que no tenga rentals activos
    const obra = await prisma.obra.findUnique({
      where: { id: params.id },
      include: {
        rentals: {
          where: { status: 'iniciado' }
        }
      }
    })
    
    if (!obra) {
      return NextResponse.json(
        { error: 'Obra no encontrada' },
        { status: 404 }
      )
    }
    
    if (obra.rentals.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una obra con alquileres activos' },
        { status: 400 }
      )
    }
    
    await prisma.obra.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Obra eliminada' })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error deleting obra:', error)
    return NextResponse.json(
      { error: 'Error al eliminar obra' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { recalcRentalTotals } from '@/lib/rental-totals'

// GET /api/rentals/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: {
        obra: {
          include: {
            client: true
          }
        },
        client: true,
        items: {
          include: {
            product: true
          }
        },
        paymentHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Alquiler no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      ...rental,
      workName: rental.obra.name,
      clientName: rental.client.name,
      items: rental.items.map((item: any) => ({
        ...item,
        productName: item.product.name
      }))
    })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching rental:', error)
    return NextResponse.json(
      { error: 'Error al obtener alquiler' },
      { status: 500 }
    )
  }
}

// PUT /api/rentals/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { items, status, pagado, notes, returnDate } = body
    
    const existingRental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    })
    
    if (!existingRental) {
      return NextResponse.json(
        { error: 'Alquiler no encontrado' },
        { status: 404 }
      )
    }
    
    const updateData: any = {
      updatedById: user.id
    }
    
    // Los totales se recalculan al final (recalcRentalTotals) según ítems + fecha de devolución
    if (items !== undefined) {
      // Eliminar items antiguos
      await prisma.rentalItem.deleteMany({
        where: { rentalId: params.id }
      })
      
      // Crear nuevos items
      await prisma.rentalItem.createMany({
        data: items.map((item: any) => ({
          rentalId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          dailyPrice: item.dailyPrice || item.unitPrice,
          totalPrice: 0, // lo calcula recalcRentalTotals
          addedDate: new Date(item.addedDate || new Date())
        }))
      })
    }
    
    if (status !== undefined) updateData.status = status
    if (pagado !== undefined) updateData.pagado = pagado
    if (notes !== undefined) updateData.notes = notes
    if (returnDate !== undefined) updateData.returnDate = new Date(returnDate)
    
    await prisma.rental.update({ where: { id: params.id }, data: updateData })
    await recalcRentalTotals(prisma, params.id)

    const rental = await prisma.rental.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        obra: {
          include: {
            client: true
          }
        },
        client: true,
        items: {
          include: {
            product: true
          }
        },
        paymentHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    return NextResponse.json({
      ...rental,
      workName: rental.obra.name,
      clientName: rental.client.name,
      items: rental.items.map((item: any) => ({
        ...item,
        productName: item.product.name
      }))
    })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error updating rental:', error)
    return NextResponse.json(
      { error: 'Error al actualizar alquiler' },
      { status: 500 }
    )
  }
}

// DELETE /api/rentals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    })
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Alquiler no encontrado' },
        { status: 404 }
      )
    }
    
    // Al crear un alquiler siempre se descuenta stock; al eliminar hay que
    // devolver las cantidades actuales de cada ítem (p. ej. tras devoluciones parciales).
    for (const item of rental.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockActual: {
            increment: item.quantity
          }
        }
      })
    }

    await prisma.rental.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Alquiler eliminado' })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error deleting rental:', error)
    return NextResponse.json(
      { error: 'Error al eliminar alquiler' },
      { status: 500 }
    )
  }
}


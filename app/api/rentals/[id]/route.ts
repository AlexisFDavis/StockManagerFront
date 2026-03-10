import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

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
    
    // Si se actualizan items, recalcular totalPrice
    if (items !== undefined) {
      // Eliminar items antiguos
      await prisma.rentalItem.deleteMany({
        where: { rentalId: params.id }
      })
      
      // Crear nuevos items
      const totalPrice = items.reduce((sum: number, item: any) => {
        return sum + (item.totalPrice || item.quantity * item.unitPrice)
      }, 0)
      
      await prisma.rentalItem.createMany({
        data: items.map((item: any) => ({
          rentalId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          dailyPrice: item.dailyPrice || item.unitPrice,
          totalPrice: item.totalPrice || item.quantity * item.unitPrice,
          addedDate: new Date(item.addedDate || new Date())
        }))
      })
      
      updateData.totalPrice = totalPrice
      updateData.resto = totalPrice - (existingRental.pagado || 0)
    }
    
    if (status !== undefined) updateData.status = status
    if (pagado !== undefined) {
      updateData.pagado = pagado
      updateData.resto = (updateData.totalPrice || existingRental.totalPrice) - pagado
    }
    if (notes !== undefined) updateData.notes = notes
    if (returnDate !== undefined) updateData.returnDate = new Date(returnDate)
    
    const rental = await prisma.rental.update({
      where: { id: params.id },
      data: updateData,
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
    
    // Si está activo, devolver stock
    if (rental.status === 'iniciado') {
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


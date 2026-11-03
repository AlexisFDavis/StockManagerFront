import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { recalcRentalTotals } from '@/lib/rental-totals'

// POST /api/rentals/[id]/partial-return
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { itemsToReturn } = body
    
    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Alquiler no encontrado' },
        { status: 404 }
      )
    }
    
    if (rental.status === 'finalizado') {
      return NextResponse.json(
        { error: 'El alquiler ya está finalizado' },
        { status: 400 }
      )
    }
    
    // Devolver stock de productos
    for (const returnItem of itemsToReturn) {
      await prisma.product.update({
        where: { id: returnItem.productId },
        data: {
          stockActual: {
            increment: returnItem.quantity
          }
        }
      })
      
      // Crear movimiento de stock
      await prisma.stockMovement.create({
        data: {
          obraId: rental.workId,
          productId: returnItem.productId,
          quantity: returnItem.quantity,
          type: 'entrada',
          reason: 'Devolución parcial de alquiler',
          rentalId: params.id,
          createdById: user.id
        }
      })
    }
    
    // Actualizar items del rental
    const updatedItems = rental.items.map((item: any) => {
      const returnItem = itemsToReturn.find((i: any) => i.productId === item.productId)
      if (returnItem) {
        const newQuantity = item.quantity - returnItem.quantity
        if (newQuantity <= 0) return null
        return {
          ...item,
          quantity: newQuantity
        }
      }
      return item
    }).filter(Boolean)
    
    // Eliminar items antiguos y crear nuevos
    await prisma.rentalItem.deleteMany({
      where: { rentalId: params.id }
    })
    
    if (updatedItems.length > 0) {
      await prisma.rentalItem.createMany({
        data: updatedItems.map((item: any) => ({
          rentalId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          dailyPrice: item.dailyPrice || item.unitPrice,
          totalPrice: item.totalPrice,
          addedDate: item.addedDate || new Date()
        }))
      })
    }
    
    const newStatus = updatedItems.length === 0 ? 'finalizado' : 'iniciado'

    await prisma.rental.update({
      where: { id: params.id },
      data: { status: newStatus, updatedById: user.id }
    })
    await recalcRentalTotals(prisma, params.id)

    const updatedRental = await prisma.rental.findUniqueOrThrow({
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
        }
      }
    })
    
    return NextResponse.json({
      ...updatedRental,
      workName: updatedRental.obra.name,
      clientName: updatedRental.client.name,
      items: updatedRental.items.map((item: any) => ({
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
    console.error('Error processing partial return:', error)
    return NextResponse.json(
      { error: 'Error al procesar devolución parcial' },
      { status: 500 }
    )
  }
}


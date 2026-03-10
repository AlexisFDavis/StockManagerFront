import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// POST /api/rentals/[id]/payments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { amount, periodFrom, periodTo, notes } = body
    
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
    
    // Crear registro de pago
    const payment = await prisma.paymentHistory.create({
      data: {
        rentalId: params.id,
        amount,
        date: new Date(),
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
        notes: notes || null
      }
    })
    
    // Actualizar fecha de devolución (extender un mes)
    const currentReturnDate = new Date(rental.returnDate)
    const nextMonth = new Date(currentReturnDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // Consolidar items y resetear fecha de adición
    const newAddedDate = new Date(periodTo)
    const itemsByProduct: Record<string, any[]> = {}
    
    rental.items.forEach((item: any) => {
      if (!itemsByProduct[item.productId]) {
        itemsByProduct[item.productId] = []
      }
      itemsByProduct[item.productId].push(item)
    })
    
    // Eliminar items antiguos y crear consolidados
    await prisma.rentalItem.deleteMany({
      where: { rentalId: params.id }
    })
    
    const consolidatedItems = []
    for (const [productId, items] of Object.entries(itemsByProduct)) {
      const firstItem = items[0]
      const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      
      consolidatedItems.push({
        rentalId: params.id,
        productId,
        quantity: totalQuantity,
        unitPrice: firstItem.unitPrice,
        dailyPrice: firstItem.dailyPrice || firstItem.unitPrice,
        totalPrice: totalQuantity * firstItem.unitPrice,
        addedDate: newAddedDate
      })
    }
    
    await prisma.rentalItem.createMany({
      data: consolidatedItems
    })
    
    // Recalcular totalPrice
    const newTotalPrice = consolidatedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    const newPagado = (rental.pagado || 0) + amount
    const newResto = Math.max(0, newTotalPrice - newPagado)
    
    // Actualizar rental
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        totalPrice: newTotalPrice,
        pagado: newPagado,
        resto: newResto,
        returnDate: nextMonth,
        updatedById: user.id
      },
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
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { recalcRentalTotals } from '@/lib/rental-totals'

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
    
    // Próximo vencimiento: mismo día del mes siguiente (18/11 → 18/12).
    // Las fechas se guardan a medianoche UTC → operar en UTC para no depender del TZ del server.
    // Si el día no existe en el mes siguiente (31/01 → feb), se ajusta al último día del mes.
    const current = new Date(rental.returnDate)
    const y = current.getUTCFullYear()
    const m = current.getUTCMonth() + 1
    const lastDayNext = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const nextMonth = new Date(Date.UTC(y, m, Math.min(current.getUTCDate(), lastDayNext)))

    // Consolidar items: el próximo período arranca donde terminó el cobrado (periodTo = 'YYYY-MM-DD')
    const newAddedDate = new Date(periodTo)
    // Agrupar por producto + precio: si el mismo producto se cargó a dos precios distintos, no perder ninguno
    const itemsByProduct: Record<string, any[]> = {}

    rental.items.forEach((item: any) => {
      const key = `${item.productId}|${item.dailyPrice || item.unitPrice}`
      if (!itemsByProduct[key]) {
        itemsByProduct[key] = []
      }
      itemsByProduct[key].push(item)
    })
    
    // Eliminar items antiguos y crear consolidados
    await prisma.rentalItem.deleteMany({
      where: { rentalId: params.id }
    })
    
    const consolidatedItems = []
    for (const items of Object.values(itemsByProduct)) {
      const firstItem = items[0]
      const productId = firstItem.productId
      const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      
      consolidatedItems.push({
        rentalId: params.id,
        productId,
        quantity: totalQuantity,
        unitPrice: firstItem.unitPrice,
        dailyPrice: firstItem.dailyPrice || firstItem.unitPrice,
        totalPrice: 0, // lo calcula recalcRentalTotals
        addedDate: newAddedDate
      })
    }
    
    await prisma.rentalItem.createMany({
      data: consolidatedItems
    })
    
    // Total = lo ya cobrado (incluye este cobro) + presupuesto del período nuevo
    await prisma.rental.update({
      where: { id: params.id },
      data: {
        pagado: (rental.pagado || 0) + amount,
        returnDate: nextMonth,
        updatedById: user.id
      }
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


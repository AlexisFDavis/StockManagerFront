import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rentals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (workId) where.workId = workId
    if (status) where.status = status
    
    const rentals = await prisma.rental.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transformar para incluir nombres
    const rentalsWithNames = rentals.map(rental => ({
      ...rental,
      workName: rental.obra.name,
      clientName: rental.client.name,
      items: rental.items.map(item => ({
        ...item,
        productName: item.product.name
      }))
    }))
    
    return NextResponse.json(rentalsWithNames)
  } catch (error) {
    console.error('Error fetching rentals:', error)
    return NextResponse.json(
      { error: 'Error al obtener alquileres' },
      { status: 500 }
    )
  }
}

// POST /api/rentals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workId, clientId, items, returnDate, notes } = body
    
    // Calcular totalPrice
    const totalPrice = items.reduce((sum: number, item: any) => {
      return sum + (item.totalPrice || 0)
    }, 0)
    
    const rental = await prisma.rental.create({
      data: {
        workId,
        clientId,
        returnDate: new Date(returnDate),
        totalPrice,
        pagado: 0,
        resto: totalPrice,
        status: 'sin presupuestar',
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            dailyPrice: item.dailyPrice,
            totalPrice: item.totalPrice,
            addedDate: new Date(item.addedDate)
          }))
        }
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
        }
      }
    })
    
    // Actualizar stock de productos
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockActual: {
            decrement: item.quantity
          }
        }
      })
    }
    
    return NextResponse.json({
      ...rental,
      workName: rental.obra.name,
      clientName: rental.client.name,
      items: rental.items.map(item => ({
        ...item,
        productName: item.product.name
      }))
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating rental:', error)
    return NextResponse.json(
      { error: 'Error al crear alquiler' },
      { status: 500 }
    )
  }
}


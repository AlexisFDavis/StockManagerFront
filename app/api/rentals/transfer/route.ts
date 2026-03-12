import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// POST /api/rentals/transfer
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { fromObraId, toObraId, items } = body
    
    // Obtener alquiler activo de la obra origen (requerido)
    const fromRental = await prisma.rental.findFirst({
      where: {
        workId: fromObraId,
        status: 'iniciado'
      },
      include: {
        items: true,
        obra: {
          include: {
            client: true
          }
        },
        client: true
      }
    })
    
    if (!fromRental) {
      return NextResponse.json(
        { error: 'La obra origen no tiene un alquiler activo' },
        { status: 400 }
      )
    }
    
    // Obtener o crear alquiler activo de la obra destino
    let toRental = await prisma.rental.findFirst({
      where: {
        workId: toObraId,
        status: 'iniciado'
      },
      include: {
        items: true,
        obra: {
          include: {
            client: true
          }
        },
        client: true
      }
    })
    
    // Si no existe alquiler activo en la obra destino, crear uno nuevo
    if (!toRental) {
      // Obtener información de la obra destino
      const toObra = await prisma.obra.findUnique({
        where: { id: toObraId },
        include: { client: true }
      })
      
      if (!toObra) {
        return NextResponse.json(
          { error: 'La obra destino no existe' },
          { status: 400 }
        )
      }
      
      // Crear nuevo alquiler para la obra destino
      toRental = await prisma.rental.create({
        data: {
          workId: toObraId,
          clientId: toObra.clientId,
          returnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
          totalPrice: 0,
          pagado: 0,
          resto: 0,
          status: 'iniciado',
          notes: `Alquiler creado automáticamente por transferencia desde obra: ${fromRental.obra.name}`,
          createdById: user.id,
          updatedById: user.id,
          items: {
            create: []
          }
        },
        include: {
          items: true,
          obra: {
            include: {
              client: true
            }
          },
          client: true
        }
      })
    }
    
    // Validar que hay suficiente stock en el alquiler origen
    for (const transferItem of items) {
      const fromItem = fromRental.items.find((item: any) => item.productId === transferItem.productId)
      if (!fromItem || fromItem.quantity < transferItem.quantity) {
        return NextResponse.json(
          { error: `No hay suficiente cantidad de producto ${transferItem.productId} en la obra origen` },
          { status: 400 }
        )
      }
    }
    
    // Actualizar items del alquiler origen (reducir cantidad)
    for (const transferItem of items) {
      const fromItem = fromRental.items.find((item: any) => item.productId === transferItem.productId)
      if (fromItem) {
        const newQuantity = fromItem.quantity - transferItem.quantity
        if (newQuantity <= 0) {
          // Eliminar item si la cantidad llega a 0
          await prisma.rentalItem.delete({
            where: { id: fromItem.id }
          })
        } else {
          // Actualizar cantidad
          await prisma.rentalItem.update({
            where: { id: fromItem.id },
            data: {
              quantity: newQuantity,
              totalPrice: newQuantity * fromItem.unitPrice
            }
          })
        }
      }
    }
    
    // Actualizar items del alquiler destino (agregar cantidad)
    for (const transferItem of items) {
      const toItem = toRental.items.find((item: any) => item.productId === transferItem.productId)
      const product = await prisma.product.findUnique({
        where: { id: transferItem.productId }
      })
      
      if (!product) continue
      
      if (toItem) {
        // Actualizar cantidad existente
        await prisma.rentalItem.update({
          where: { id: toItem.id },
          data: {
            quantity: toItem.quantity + transferItem.quantity,
            totalPrice: (toItem.quantity + transferItem.quantity) * toItem.unitPrice
          }
        })
      } else {
        // Crear nuevo item
        await prisma.rentalItem.create({
          data: {
            rentalId: toRental.id,
            productId: transferItem.productId,
            quantity: transferItem.quantity,
            unitPrice: product.price,
            dailyPrice: product.price,
            totalPrice: transferItem.quantity * product.price,
            addedDate: new Date()
          }
        })
      }
    }
    
    // Crear movimientos de stock
    const obras = await prisma.obra.findMany({
      where: {
        id: { in: [fromObraId, toObraId] }
      }
    })
    
    const fromObra = obras.find((o: any) => o.id === fromObraId)
    const toObra = obras.find((o: any) => o.id === toObraId)
    
    for (const transferItem of items) {
      // Movimiento de salida
      await prisma.stockMovement.create({
        data: {
          obraId: fromObraId,
          productId: transferItem.productId,
          quantity: transferItem.quantity,
          type: 'salida',
          reason: `Traslado a obra: ${toObra?.name || toObraId}`,
          createdById: user.id
        }
      })
      
      // Movimiento de entrada
      await prisma.stockMovement.create({
        data: {
          obraId: toObraId,
          productId: transferItem.productId,
          quantity: transferItem.quantity,
          type: 'entrada',
          reason: `Traslado desde obra: ${fromObra?.name || fromObraId}`,
          createdById: user.id
        }
      })
    }
    
    // Recalcular totalPrice de ambos rentals
    const updatedFromRental = await prisma.rental.findUnique({
      where: { id: fromRental.id },
      include: { items: true }
    })
    
    const updatedToRental = await prisma.rental.findUnique({
      where: { id: toRental.id },
      include: { items: true }
    })
    
    const fromTotalPrice = updatedFromRental?.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
    const toTotalPrice = updatedToRental?.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
    
    await prisma.rental.update({
      where: { id: fromRental.id },
      data: {
        totalPrice: fromTotalPrice,
        resto: fromTotalPrice - (fromRental.pagado || 0),
        updatedById: user.id
      }
    })
    
    await prisma.rental.update({
      where: { id: toRental.id },
      data: {
        totalPrice: toTotalPrice,
        resto: toTotalPrice - (toRental.pagado || 0),
        updatedById: user.id
      }
    })
    
    return NextResponse.json({ message: 'Transferencia completada' })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error transferring stock:', error)
    return NextResponse.json(
      { error: 'Error al transferir stock' },
      { status: 500 }
    )
  }
}


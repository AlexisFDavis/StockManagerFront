import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id] - Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stockAddHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, stockTotal, price, notes, lowStockThreshold } = body
    
    // Obtener producto actual
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    
    // Calcular diferencia de stock
    const oldStockTotal = existingProduct.stockTotal
    const newStockTotal = stockTotal !== undefined ? stockTotal : oldStockTotal
    const stockDifference = newStockTotal - oldStockTotal
    
    // Calcular stock actual (considerando productos alquilados)
    const activeRentals = await prisma.rental.findMany({
      where: { status: 'iniciado' },
      include: {
        items: {
          where: { productId: params.id }
        }
      }
    })
    
    const productRented = activeRentals.reduce((sum: number, rental: any) => {
      return sum + rental.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0)
    }, 0)
    
    const newStockActual = Math.max(0, newStockTotal - productRented)
    
    // Preparar datos de actualización
    const updateData: any = {
      name,
      description: description !== undefined ? description : existingProduct.description,
      stockTotal: newStockTotal,
      stockActual: newStockActual,
      price: price !== undefined ? price : existingProduct.price,
      notes: notes !== undefined ? notes : existingProduct.notes,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : existingProduct.lowStockThreshold,
    }
    
    // Si hay cambio en stock, agregar al historial
    if (stockDifference !== 0) {
      updateData.stockAddHistory = {
        create: {
          quantity: stockDifference,
          date: new Date(),
          notes: stockDifference > 0 ? 'Stock aumentado' : 'Stock reducido'
        }
      }
    }
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        stockAddHistory: {
          orderBy: { date: 'desc' }
        }
      }
    })
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}


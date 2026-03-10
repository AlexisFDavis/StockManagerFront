import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Obtener todos los productos
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        stockAddHistory: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST /api/products - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, stockTotal, price, notes, lowStockThreshold } = body
    
    // Crear producto con historial inicial
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        stockTotal: stockTotal || 0,
        stockActual: stockTotal || 0,
        price,
        notes: notes || null,
        lowStockThreshold: lowStockThreshold || 20,
        stockAddHistory: stockTotal > 0 ? {
          create: {
            quantity: stockTotal,
            date: new Date(),
            notes: 'Producto creado'
          }
        } : undefined
      },
      include: {
        stockAddHistory: true
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}


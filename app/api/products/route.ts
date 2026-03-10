import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// GET /api/products - Obtener todos los productos
export async function GET() {
  try {
    // Verificar autenticación
    await requireAuth()
    
    const products = await prisma.product.findMany({
      include: {
        stockAddHistory: {
          orderBy: { date: 'desc' }
        },
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(products)
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
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
    // Verificar autenticación
    const user = await requireAuth()
    
    const body = await request.json()
    const { name, description, stockTotal, price, notes, lowStockThreshold } = body
    
    // Crear producto con historial inicial y auditoría
    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        stockTotal: stockTotal || 0,
        stockActual: stockTotal || 0,
        price,
        notes: notes || null,
        lowStockThreshold: lowStockThreshold || 20,
        createdById: user.id,
        updatedById: user.id,
        stockAddHistory: stockTotal > 0 ? {
          create: {
            quantity: stockTotal,
            date: new Date(),
            notes: `Producto creado por ${user.name}`
          }
        } : undefined
      },
      include: {
        stockAddHistory: true,
        createdBy: {
          select: { id: true, name: true, username: true }
        },
        updatedBy: {
          select: { id: true, name: true, username: true }
        }
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}


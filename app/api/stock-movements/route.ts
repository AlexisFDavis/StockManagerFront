import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

// GET /api/stock-movements
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const obraId = searchParams.get('obraId')
    
    const where: any = {}
    if (obraId) where.obraId = obraId
    
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        obra: {
          select: {
            id: true,
            name: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })
    
    // Transformar para incluir nombres
    const movementsWithNames = movements.map((movement: any) => ({
      id: movement.id,
      obraId: movement.obraId,
      obraName: movement.obra?.name || '',
      productId: movement.productId,
      productName: movement.product?.name || '',
      quantity: movement.quantity,
      type: movement.type,
      reason: movement.reason,
      timestamp: movement.timestamp,
      rentalId: movement.rentalId
    }))
    
    return NextResponse.json(movementsWithNames)
  } catch (error: any) {
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos de stock' },
      { status: 500 }
    )
  }
}


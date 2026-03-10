export interface StockAddHistory {
  id: string;
  quantity: number;
  date: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  stockTotal: number;
  stockActual: number;
  price: number;
  notes?: string;
  lowStockThreshold?: number; // Umbral de stock bajo (por defecto 20)
  addHistory?: StockAddHistory[]; // Historial de añadidos de stock
}

export interface RentalItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  dailyPrice: number;
  totalPrice: number;
  addedDate: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  periodFrom: string;
  periodTo: string;
  notes?: string;
}

export interface Rental {
  id: string;
  workId: string;
  workName: string;
  clientId: string;
  clientName: string;
  items: RentalItem[];
  totalPrice: number;
  pagado: number;
  resto: number;
  returnDate: string;
  createdAt: string;
  status: 'sin presupuestar' | 'presupuestado' | 'iniciado' | 'finalizado';
  notes?: string;
  paymentHistory?: PaymentHistory[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Obra {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description?: string;
  address?: string;
  totalPrice: number;
  pagado: number;
  resto: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface StockMovement {
  id: string;
  obraId: string;
  obraName: string;
  rentalId?: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'salida' | 'entrada';
  reason: string;
  timestamp: string;
}

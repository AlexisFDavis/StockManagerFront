export interface Product {
  id: string;
  name: string;
  description: string;
  stockTotal: number;
  stockActual: number;
  price: number;
  notes?: string;
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

export interface Product {
  id: string;
  name: string;
  description: string;
  stockTotal: number;
  stockActual: number;
  price: number;
}

export interface RentalItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  status: 'active' | 'returned';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
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


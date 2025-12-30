export interface Product {
  id: string;
  name: string;
  description: string;
  stock: number;
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
  workId: string; // ID de la obra
  workName: string; // Nombre de la obra
  clientId: string; // ID del cliente (para referencia rápida)
  clientName: string; // Nombre del cliente (para referencia rápida)
  items: RentalItem[];
  totalPrice: number;
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
  clientName: string; // Para referencia rápida
  name: string;
  description?: string;
  address?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}


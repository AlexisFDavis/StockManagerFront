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
  clientId: string;
  clientName: string;
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


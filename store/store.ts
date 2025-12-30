import { create } from 'zustand';
import { Product, Rental, Client, RentalItem, Obra } from '@/types';

interface StoreState {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, quantity: number) => void;
  
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  obras: Obra[];
  addObra: (obra: Omit<Obra, 'id' | 'createdAt'>) => void;
  updateObra: (id: string, obra: Partial<Obra>) => void;
  deleteObra: (id: string) => void;
  
  rentals: Rental[];
  addRental: (rental: Omit<Rental, 'id' | 'createdAt'>) => void;
  updateRental: (id: string, rental: Partial<Rental>) => void;
  returnRental: (id: string) => void;
  partialReturn: (rentalId: string, itemsToReturn: { productId: string; quantity: number }[]) => void;
  
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
}

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Martillo de construcción',
    description: 'Martillo profesional para construcción, mango de fibra de vidrio',
    stock: 50,
    price: 200,
  },
  {
    id: '2',
    name: 'Taladro eléctrico',
    description: 'Taladro percutor 750W con maletín y accesorios',
    stock: 30,
    price: 500,
  },
  {
    id: '3',
    name: 'Andamio modular',
    description: 'Andamio de 2x1 metros, altura ajustable',
    stock: 15,
    price: 1200,
  },
  {
    id: '4',
    name: 'Carretilla',
    description: 'Carretilla de construcción, capacidad 100L',
    stock: 25,
    price: 350,
  },
  {
    id: '5',
    name: 'Nivel láser',
    description: 'Nivel láser rotativo profesional, alcance 50m',
    stock: 8,
    price: 800,
  },
];

const initialClients: Client[] = [
  {
    id: '1',
    name: 'Constructora ABC S.A.',
    email: 'contacto@constructoraabc.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, CABA',
  },
  {
    id: '2',
    name: 'Obras y Proyectos SRL',
    email: 'info@obrasyproyectos.com',
    phone: '+54 11 9876-5432',
    address: 'Av. Santa Fe 5678, CABA',
  },
  {
    id: '3',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+54 11 5555-1234',
    address: 'Calle Falsa 123, Buenos Aires',
  },
];

const initialObras: Obra[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Constructora ABC S.A.',
    name: 'Edificio Residencial Palermo',
    description: 'Construcción de edificio residencial de 12 pisos',
    address: 'Av. Santa Fe 2000, Palermo, CABA',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    clientId: '1',
    clientName: 'Constructora ABC S.A.',
    name: 'Obra Comercial Microcentro',
    description: 'Remodelación de local comercial',
    address: 'Av. Corrientes 1500, Microcentro, CABA',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    clientId: '2',
    clientName: 'Obras y Proyectos SRL',
    name: 'Casa Individual San Isidro',
    description: 'Construcción de casa individual',
    address: 'Av. del Libertador 3000, San Isidro',
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    clientId: '3',
    clientName: 'Juan Pérez',
    name: 'Reforma Cocina',
    description: 'Reforma integral de cocina',
    address: 'Calle Falsa 123, Buenos Aires',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialRentals: Rental[] = [
  {
    id: '1',
    workId: '1',
    workName: 'Edificio Residencial Palermo',
    clientId: '1',
    clientName: 'Constructora ABC S.A.',
    items: [
      {
        productId: '1',
        productName: 'Martillo de construcción',
        quantity: 20,
        unitPrice: 200,
        totalPrice: 4000,
      },
      {
        productId: '2',
        productName: 'Taladro eléctrico',
        quantity: 5,
        unitPrice: 500,
        totalPrice: 2500,
      },
    ],
    totalPrice: 6500,
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    id: '2',
    workId: '3',
    workName: 'Casa Individual San Isidro',
    clientId: '2',
    clientName: 'Obras y Proyectos SRL',
    items: [
      {
        productId: '3',
        productName: 'Andamio modular',
        quantity: 3,
        unitPrice: 1200,
        totalPrice: 3600,
      },
    ],
    totalPrice: 3600,
    returnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
];

export const useStore = create<StoreState>((set: any) => ({
  products: initialProducts,
  clients: initialClients,
  obras: initialObras,
  rentals: initialRentals,
  isAuthenticated: false,
  
  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    set((state: any) => ({
      products: [...state.products, newProduct],
    }));
  },
  
  updateProduct: (id, product) => {
    set((state: any) => ({
      products: state.products.map((p: any) =>
        p.id === id ? { ...p, ...product } : p
      ),
    }));
  },
  
  deleteProduct: (id) => {
    set((state: any) => ({
      products: state.products.filter((p: any) => p.id !== id),
    }));
  },
  
  updateStock: (id, quantity) => {
    set((state: any) => ({
      products: state.products.map((p: any) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + quantity) } : p
      ),
    }));
  },
  
  addClient: (client) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
    };
    set((state: any) => ({
      clients: [...state.clients, newClient],
    }));
  },
  
  updateClient: (id, client) => {
    set((state: any) => ({
      clients: state.clients.map((c: any) =>
        c.id === id ? { ...c, ...client } : c
      ),
    }));
  },
  
  deleteClient: (id) => {
    set((state: any) => ({
      clients: state.clients.filter((c: any) => c.id !== id),
    }));
  },
  
  addObra: (obra) => {
    set((state: any) => {
      const client = state.clients.find((c: any) => c.id === obra.clientId);
      const newObra: Obra = {
        ...obra,
        clientName: client?.name || '',
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      return {
        obras: [...state.obras, newObra],
      };
    });
  },
  
  updateObra: (id, obra) => {
    set((state: any) => {
      const updatedObras = state.obras.map((o: any) => {
        if (o.id === id) {
          const updated = { ...o, ...obra };
          if (obra.clientId) {
            const client = state.clients.find((c: any) => c.id === obra.clientId);
            if (client) {
              updated.clientName = client.name;
            }
          }
          return updated;
        }
        return o;
      });
      return { obras: updatedObras };
    });
  },
  
  deleteObra: (id) => {
    set((state: any) => ({
      obras: state.obras.filter((o: any) => o.id !== id),
    }));
  },
  
  addRental: (rental) => {
    set((state: any) => {
      const obra = state.obras.find((o: any) => o.id === rental.workId);
      if (!obra) return state;
      
      const newRental: Rental = {
        ...rental,
        clientId: obra.clientId,
        clientName: obra.clientName,
        workName: obra.name,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          return {
            ...product,
            stock: Math.max(0, product.stock - item.quantity),
          };
        }
        return product;
      });
      
      return {
        rentals: [...state.rentals, newRental],
        products: updatedProducts,
      };
    });
  },
  
  updateRental: (id, rental) => {
    set((state: any) => ({
      rentals: state.rentals.map((r: any) =>
        r.id === id ? { ...r, ...rental } : r
      ),
    }));
  },
  
  returnRental: (id) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental || rental.status === 'returned') return state;
      
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          return {
            ...product,
            stock: product.stock + item.quantity,
          };
        }
        return product;
      });
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === id ? { ...r, status: 'returned' as const } : r
        ),
        products: updatedProducts,
      };
    });
  },
  
  partialReturn: (rentalId, itemsToReturn) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === rentalId);
      if (!rental || rental.status === 'returned') return state;
      
      const updatedProducts = state.products.map((product: any) => {
        const returnItem = itemsToReturn.find((i) => i.productId === product.id);
        if (returnItem) {
          return {
            ...product,
            stock: product.stock + returnItem.quantity,
          };
        }
        return product;
      });
      
      const updatedItems = rental.items
        .map((item: RentalItem) => {
          const returnItem = itemsToReturn.find((i) => i.productId === item.productId);
          if (returnItem) {
            const newQuantity = item.quantity - returnItem.quantity;
            if (newQuantity <= 0) return null;
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as RentalItem[];
      
      const newStatus = updatedItems.length === 0 ? 'returned' : 'active';
      const newTotalPrice = updatedItems.reduce((sum: number, item: RentalItem) => sum + item.totalPrice, 0);
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === rentalId
            ? { ...r, items: updatedItems, totalPrice: newTotalPrice, status: newStatus }
            : r
        ),
        products: updatedProducts,
      };
    });
  },
  
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
  
  isSidebarOpen: true,
  toggleSidebar: () => set((state: any) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),
  setIsSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
}));

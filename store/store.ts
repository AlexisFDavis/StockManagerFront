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
  addObra: (obra: Omit<Obra, 'id' | 'createdAt' | 'totalPrice' | 'pagado' | 'resto'>) => void;
  updateObra: (id: string, obra: Partial<Obra>) => void;
  updateObraPayment: (id: string, pagado: number) => void;
  finishObra: (id: string) => void;
  pauseObra: (id: string) => void;
  reactivateObra: (id: string) => void;
  deleteObra: (id: string) => void;
  
  rentals: Rental[];
  addRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'totalPrice' | 'pagado' | 'resto'>) => void;
  updateRental: (id: string, rental: Partial<Rental>) => void;
  updateRentalItems: (id: string, items: RentalItem[]) => void;
  updateRentalPayment: (id: string, pagado: number) => void;
  returnRental: (id: string) => void;
  reactivateRental: (id: string) => void;
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
    stockTotal: 50,
    stockActual: 30,
    price: 200,
  },
  {
    id: '2',
    name: 'Taladro eléctrico',
    description: 'Taladro percutor 750W con maletín y accesorios',
    stockTotal: 30,
    stockActual: 25,
    price: 500,
  },
  {
    id: '3',
    name: 'Andamio modular',
    description: 'Andamio de 2x1 metros, altura ajustable',
    stockTotal: 15,
    stockActual: 12,
    price: 1200,
  },
  {
    id: '4',
    name: 'Carretilla',
    description: 'Carretilla de construcción, capacidad 100L',
    stockTotal: 25,
    stockActual: 25,
    price: 350,
  },
  {
    id: '5',
    name: 'Nivel láser',
    description: 'Nivel láser rotativo profesional, alcance 50m',
    stockTotal: 8,
    stockActual: 8,
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
    totalPrice: 6500,
    pagado: 3000,
    resto: 3500,
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
    totalPrice: 0,
    pagado: 0,
    resto: 0,
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
    totalPrice: 3600,
    pagado: 0,
    resto: 3600,
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
    totalPrice: 0,
    pagado: 0,
    resto: 0,
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
    pagado: 3000,
    resto: 3500,
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
    pagado: 0,
    resto: 3600,
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
      stockActual: product.stockTotal || 0,
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
    set((state: any) => {
      const activeRentals = state.rentals.filter((r: any) => r.status === 'active');
      const productRented = activeRentals.reduce((sum: number, rental: any) => {
        const item = rental.items.find((i: any) => i.productId === id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      
      return {
        products: state.products.map((p: any) => {
          if (p.id === id) {
            const newStockTotal = Math.max(0, p.stockTotal + quantity);
            const newStockActual = Math.max(0, newStockTotal - productRented);
            return { ...p, stockTotal: newStockTotal, stockActual: newStockActual };
          }
          return p;
        }),
      };
    });
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
        totalPrice: 0,
        pagado: 0,
        resto: 0,
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

  updateObraPayment: (id, pagado) => {
    set((state: any) => ({
      obras: state.obras.map((o: any) => {
        if (o.id === id) {
          return {
            ...o,
            pagado: Math.max(0, Math.min(o.totalPrice, pagado)),
            resto: o.totalPrice - Math.max(0, Math.min(o.totalPrice, pagado)),
          };
        }
        return o;
      }),
    }));
  },

  finishObra: (id) => {
    set((state: any) => {
      const obra = state.obras.find((o: any) => o.id === id);
      if (!obra) return state;

      const obraRentals = state.rentals.filter((r: any) => r.workId === id && r.status === 'active');
      
      const updatedProducts = state.products.map((product: any) => {
        let stockToReturn = 0;
        obraRentals.forEach((rental: any) => {
          const item = rental.items.find((i: any) => i.productId === product.id);
          if (item) {
            stockToReturn += item.quantity;
          }
        });
        if (stockToReturn > 0) {
          return {
            ...product,
            stockActual: Math.min(product.stockTotal, product.stockActual + stockToReturn),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) => {
        if (r.workId === id && r.status === 'active') {
          return { ...r, status: 'returned' as const, pagado: r.totalPrice, resto: 0 };
        }
        return r;
      });

      const obraTotalPrice = obraRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const obraPagado = obraTotalPrice;
      const obraResto = 0;

      return {
        obras: state.obras.map((o: any) =>
          o.id === id
            ? { ...o, status: 'completed' as const, totalPrice: obraTotalPrice, pagado: obraPagado, resto: obraResto }
            : o
        ),
        rentals: updatedRentals,
        products: updatedProducts,
      };
    });
  },

  pauseObra: (id) => {
    set((state: any) => ({
      obras: state.obras.map((o: any) =>
        o.id === id ? { ...o, status: 'paused' as const } : o
      ),
    }));
  },

  reactivateObra: (id) => {
    set((state: any) => {
      const obra = state.obras.find((o: any) => o.id === id);
      if (!obra || obra.status === 'active') return state;

      const obraRentals = state.rentals.filter((r: any) => r.workId === id);
      
      const updatedProducts = state.products.map((product: any) => {
        let stockNeeded = 0;
        obraRentals.forEach((rental: any) => {
          const item = rental.items.find((i: any) => i.productId === product.id);
          if (item) {
            stockNeeded += item.quantity;
          }
        });
        if (stockNeeded > 0) {
          return {
            ...product,
            stockActual: Math.max(0, product.stockActual - stockNeeded),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) => {
        if (r.workId === id && r.status === 'returned') {
          return { ...r, status: 'active' as const };
        }
        return r;
      });

      return {
        obras: state.obras.map((o: any) =>
          o.id === id ? { ...o, status: 'active' as const } : o
        ),
        rentals: updatedRentals,
        products: updatedProducts,
      };
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
      
      const calculatedTotal = rental.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const pagado = 0;
      const resto = calculatedTotal;
      
      const newRental: Rental = {
        ...rental,
        clientId: obra.clientId,
        clientName: obra.clientName,
        workName: obra.name,
        totalPrice: calculatedTotal,
        pagado: pagado,
        resto: resto,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          return {
            ...product,
            stockActual: Math.max(0, product.stockActual - item.quantity),
          };
        }
        return product;
      });

      const obraRentals = [...state.rentals.filter((r: any) => r.workId === rental.workId), newRental];
      const obraTotalPrice = obraRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const obraResto = obraTotalPrice - obra.pagado;
      
      return {
        rentals: [...state.rentals, newRental],
        products: updatedProducts,
        obras: state.obras.map((o: any) =>
          o.id === rental.workId
            ? { ...o, totalPrice: obraTotalPrice, resto: obraResto }
            : o
        ),
      };
    });
  },
  
  updateRental: (id, rental) => {
    set((state: any) => ({
      rentals: state.rentals.map((r: any) => {
        if (r.id === id) {
          const updated = { ...r, ...rental };
          if (rental.pagado !== undefined) {
            updated.resto = updated.totalPrice - updated.pagado;
          }
          return updated;
        }
        return r;
      }),
    }));
  },

  updateRentalItems: (id, items) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental) return state;

      const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const resto = Math.max(0, calculatedTotal - rental.pagado);

      const updatedProducts = state.products.map((product: any) => {
        const oldItem = rental.items.find((i: any) => i.productId === product.id);
        const newItem = items.find((i: any) => i.productId === product.id);
        
        let stockChange = 0;
        if (oldItem && newItem) {
          stockChange = oldItem.quantity - newItem.quantity;
        } else if (oldItem) {
          stockChange = oldItem.quantity;
        } else if (newItem) {
          stockChange = -newItem.quantity;
        }

        if (stockChange !== 0) {
          return {
            ...product,
            stockActual: Math.max(0, Math.min(product.stockTotal, product.stockActual + stockChange)),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) =>
        r.id === id
          ? { ...r, items, totalPrice: calculatedTotal, resto }
          : r
      );

      const obraRentals = updatedRentals.filter((r: any) => r.workId === rental.workId);
      const obraTotalPrice = obraRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const obra = state.obras.find((o: any) => o.id === rental.workId);
      const obraResto = obra ? obraTotalPrice - obra.pagado : 0;

      return {
        rentals: updatedRentals,
        products: updatedProducts,
        obras: state.obras.map((o: any) =>
          o.id === rental.workId
            ? { ...o, totalPrice: obraTotalPrice, resto: obraResto }
            : o
        ),
      };
    });
  },

  updateRentalPayment: (id, pagado) => {
    set((state: any) => ({
      rentals: state.rentals.map((r: any) => {
        if (r.id === id) {
          return {
            ...r,
            pagado: Math.max(0, Math.min(r.totalPrice, pagado)),
            resto: r.totalPrice - Math.max(0, Math.min(r.totalPrice, pagado)),
          };
        }
        return r;
      }),
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
            stockActual: Math.min(product.stockTotal, product.stockActual + item.quantity),
          };
        }
        return product;
      });
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === id 
            ? { ...r, status: 'returned' as const, pagado: r.totalPrice, resto: 0 }
            : r
        ),
        products: updatedProducts,
      };
    });
  },

  reactivateRental: (id) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental || rental.status === 'active') return state;
      
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          return {
            ...product,
            stockActual: Math.max(0, product.stockActual - item.quantity),
          };
        }
        return product;
      });
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === id 
            ? { ...r, status: 'active' as const }
            : r
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
            stockActual: Math.min(product.stockTotal, product.stockActual + returnItem.quantity),
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
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === rentalId
            ? { ...r, items: updatedItems, status: newStatus }
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

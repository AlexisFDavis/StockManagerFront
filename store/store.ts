import { create } from 'zustand';
import { Product, Rental, Client, RentalItem, Obra, StockMovement, PaymentHistory, StockAddHistory } from '@/types';

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
  addRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'totalPrice' | 'pagado' | 'resto' | 'status'>) => void;
  updateRental: (id: string, rental: Partial<Rental>) => void;
  updateRentalItems: (id: string, items: RentalItem[]) => void;
  updateRentalPayment: (id: string, pagado: number) => void;
  recordRentalPayment: (id: string, amount: number, periodFrom: string, periodTo: string, notes?: string) => void;
  updateRentalStatus: (id: string, status: Rental['status']) => void;
  updateRentalNotes: (id: string, notes: string) => void;
  returnRental: (id: string) => void;
  reactivateRental: (id: string) => void;
  partialReturn: (rentalId: string, itemsToReturn: { productId: string; quantity: number }[]) => void;
  
  stockMovements: StockMovement[];
  getStockMovementsByObra: (obraId: string) => StockMovement[];
  transferStockBetweenObras: (fromObraId: string, toObraId: string, items: { productId: string; quantity: number }[]) => void;
  
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
    lowStockThreshold: 20,
    addHistory: [{
      id: '1-initial',
      quantity: 50,
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Producto creado',
    }],
  },
  {
    id: '2',
    name: 'Taladro eléctrico',
    description: 'Taladro percutor 750W con maletín y accesorios',
    stockTotal: 30,
    stockActual: 25,
    price: 500,
    lowStockThreshold: 20,
    addHistory: [{
      id: '2-initial',
      quantity: 30,
      date: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Producto creado',
    }],
  },
  {
    id: '3',
    name: 'Andamio modular',
    description: 'Andamio de 2x1 metros, altura ajustable',
    stockTotal: 15,
    stockActual: 12,
    price: 1200,
    lowStockThreshold: 20,
    addHistory: [{
      id: '3-initial',
      quantity: 15,
      date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Producto creado',
    }],
  },
  {
    id: '4',
    name: 'Carretilla',
    description: 'Carretilla de construcción, capacidad 100L',
    stockTotal: 25,
    stockActual: 25,
    price: 350,
    lowStockThreshold: 20,
    addHistory: [{
      id: '4-initial',
      quantity: 25,
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Producto creado',
    }],
  },
  {
    id: '5',
    name: 'Nivel láser',
    description: 'Nivel láser rotativo profesional, alcance 50m',
    stockTotal: 8,
    stockActual: 8,
    price: 800,
    lowStockThreshold: 20,
    addHistory: [{
      id: '5-initial',
      quantity: 8,
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Producto creado',
    }],
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
        dailyPrice: 200,
        totalPrice: 4000,
        addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        productId: '2',
        productName: 'Taladro eléctrico',
        quantity: 5,
        unitPrice: 500,
        dailyPrice: 500,
        totalPrice: 2500,
        addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    totalPrice: 6500,
    pagado: 3000,
    resto: 3500,
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'iniciado',
    notes: '',
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
        dailyPrice: 1200,
        totalPrice: 3600,
        addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    totalPrice: 3600,
    pagado: 0,
    resto: 3600,
    returnDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'iniciado',
    notes: '',
  },
];

export const useStore = create<StoreState>((set: any, get: any) => ({
  products: initialProducts,
  clients: initialClients,
  obras: initialObras,
  rentals: initialRentals,
  stockMovements: [] as StockMovement[],
  isAuthenticated: false,
  
  getStockMovementsByObra: (obraId: string) => {
    return get().stockMovements.filter((m: StockMovement) => m.obraId === obraId);
  },

  transferStockBetweenObras: (fromObraId, toObraId, items) => {
    set((state: any) => {
      const fromObra = state.obras.find((o: any) => o.id === fromObraId);
      const toObra = state.obras.find((o: any) => o.id === toObraId);
      if (!fromObra || !toObra) return state;

      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];

      // Encontrar alquileres activos de ambas obras
      const fromRental = state.rentals.find((r: any) => r.workId === fromObraId && r.status === 'iniciado');
      const toRental = state.rentals.find((r: any) => r.workId === toObraId && r.status === 'iniciado');

      // Actualizar productos y crear movimientos
      const updatedProducts = state.products.map((product: any) => {
        const transferItem = items.find((item: any) => item.productId === product.id);
        if (!transferItem || transferItem.quantity <= 0) return product;

        // Movimiento de salida de obra origen
        newMovements.push({
          id: `${fromObraId}-${toObraId}-${product.id}-${Date.now()}-salida`,
          obraId: fromObraId,
          obraName: fromObra.name,
          productId: product.id,
          productName: product.name,
          quantity: transferItem.quantity,
          type: 'salida',
          reason: `Traslado a obra: ${toObra.name}`,
          timestamp: now,
        });

        // Movimiento de entrada a obra destino
        newMovements.push({
          id: `${fromObraId}-${toObraId}-${product.id}-${Date.now()}-entrada`,
          obraId: toObraId,
          obraName: toObra.name,
          productId: product.id,
          productName: product.name,
          quantity: transferItem.quantity,
          type: 'entrada',
          reason: `Traslado desde obra: ${fromObra.name}`,
          timestamp: now,
        });

        return product;
      });

      // Actualizar alquileres
      const updatedRentals = state.rentals.map((rental: any) => {
        // Quitar productos del alquiler de origen
        if (rental.id === fromRental?.id) {
          const updatedItems = rental.items.map((item: any) => {
            const transferItem = items.find((i: any) => i.productId === item.productId);
            if (transferItem) {
              const newQuantity = Math.max(0, item.quantity - transferItem.quantity);
              if (newQuantity === 0) {
                return null; // Eliminar el ítem
              }
              return {
                ...item,
                quantity: newQuantity,
                totalPrice: newQuantity * item.unitPrice,
              };
            }
            return item;
          }).filter((item: any) => item !== null);

          return {
            ...rental,
            items: updatedItems,
            totalPrice: updatedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
          };
        }

        // Agregar productos al alquiler de destino
        if (rental.id === toRental?.id) {
          const updatedItems = [...rental.items];
          items.forEach((transferItem: any) => {
            const existingItem = updatedItems.find((item: any) => item.productId === transferItem.productId);
            const product = state.products.find((p: any) => p.id === transferItem.productId);
            if (existingItem) {
              existingItem.quantity += transferItem.quantity;
              existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
            } else if (product) {
              updatedItems.push({
                productId: product.id,
                productName: product.name,
                quantity: transferItem.quantity,
                unitPrice: product.price,
                dailyPrice: product.price,
                totalPrice: transferItem.quantity * product.price,
                addedDate: now,
              });
            }
          });

          return {
            ...rental,
            items: updatedItems,
            totalPrice: updatedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
          };
        }

        return rental;
      });

      return {
        products: updatedProducts,
        rentals: updatedRentals,
        stockMovements: [...state.stockMovements, ...newMovements],
      };
    });
  },
  
  addProduct: (product) => {
    const productId = Date.now().toString();
    const initialStock = product.stockTotal || 0;
    const initialAddHistory: StockAddHistory = {
      id: `${productId}-initial`,
      quantity: initialStock,
      date: new Date().toISOString(),
      notes: 'Producto creado',
    };
    
    const newProduct: Product = {
      ...product,
      id: productId,
      stockActual: initialStock,
      lowStockThreshold: product.lowStockThreshold ?? 20,
      addHistory: initialStock > 0 ? [initialAddHistory] : [],
    };
    set((state: any) => ({
      products: [...state.products, newProduct],
    }));
  },
  
  updateProduct: (id, product) => {
    set((state: any) => {
      const existingProduct = state.products.find((p: any) => p.id === id);
      if (!existingProduct) return state;

      // Detectar cambio en stockTotal
      const oldStockTotal = existingProduct.stockTotal || 0;
      const newStockTotal = product.stockTotal !== undefined ? product.stockTotal : oldStockTotal;
      const stockDifference = newStockTotal - oldStockTotal;

      // Calcular nuevo stockActual considerando productos alquilados
      const activeRentals = state.rentals.filter((r: any) => r.status === 'iniciado');
      const productRented = activeRentals.reduce((sum: number, rental: any) => {
        const item = rental.items.find((i: any) => i.productId === id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      const newStockActual = Math.max(0, newStockTotal - productRented);

      // Si hay cambio en el stock, registrar en el historial
      let updatedHistory = existingProduct.addHistory || [];
      if (stockDifference !== 0) {
        const newAddEntry: StockAddHistory = {
          id: `${id}-${Date.now()}`,
          quantity: Math.abs(stockDifference),
          date: new Date().toISOString(),
          notes: stockDifference > 0 
            ? `Añadido ${stockDifference} unidades (edición)` 
            : `Reducido ${Math.abs(stockDifference)} unidades (edición)`,
        };
        updatedHistory = [...updatedHistory, newAddEntry];
      }

      return {
        products: state.products.map((p: any) =>
          p.id === id 
            ? { 
                ...p, 
                ...product, 
                stockActual: newStockActual,
                addHistory: updatedHistory,
              } 
            : p
        ),
      };
    });
  },
  
  deleteProduct: (id) => {
    set((state: any) => ({
      products: state.products.filter((p: any) => p.id !== id),
    }));
  },
  
  updateStock: (id, quantity) => {
    set((state: any) => {
      const activeRentals = state.rentals.filter((r: any) => r.status === 'iniciado');
      const productRented = activeRentals.reduce((sum: number, rental: any) => {
        const item = rental.items.find((i: any) => i.productId === id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      
      return {
        products: state.products.map((p: any) => {
          if (p.id === id) {
            const newStockTotal = Math.max(0, p.stockTotal + quantity);
            const newStockActual = Math.max(0, newStockTotal - productRented);
            
            // Si se añade stock (quantity > 0), registrar en el historial
            let updatedHistory = p.addHistory || [];
            if (quantity > 0) {
              const newAddEntry: StockAddHistory = {
                id: `${id}-${Date.now()}`,
                quantity: quantity,
                date: new Date().toISOString(),
                notes: `Añadido ${quantity} unidades`,
              };
              updatedHistory = [...updatedHistory, newAddEntry];
            }
            
            return { 
              ...p, 
              stockTotal: newStockTotal, 
              stockActual: newStockActual,
              addHistory: updatedHistory,
            };
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

      const obraRentals = state.rentals.filter((r: any) => r.workId === id && r.status === 'iniciado');
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];
      
      const updatedProducts = state.products.map((product: any) => {
        let stockToReturn = 0;
        obraRentals.forEach((rental: any) => {
          const item = rental.items.find((i: any) => i.productId === product.id);
          if (item) {
            stockToReturn += item.quantity;
          }
        });
        if (stockToReturn > 0) {
          newMovements.push({
            id: Date.now().toString() + '-' + product.id + '-entrada',
            obraId: id,
            obraName: obra.name,
            productId: product.id,
            productName: product.name,
            quantity: stockToReturn,
            type: 'entrada',
            reason: 'Obra finalizada - Devolución de productos',
            timestamp: now,
          });
          return {
            ...product,
            stockActual: Math.min(product.stockTotal, product.stockActual + stockToReturn),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) => {
        if (r.workId === id && r.status === 'iniciado') {
          return { ...r, status: 'finalizado' as const, pagado: r.totalPrice, resto: 0 };
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
        stockMovements: [...state.stockMovements, ...newMovements],
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
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];
      
      const updatedProducts = state.products.map((product: any) => {
        let stockNeeded = 0;
        obraRentals.forEach((rental: any) => {
          const item = rental.items.find((i: any) => i.productId === product.id);
          if (item) {
            stockNeeded += item.quantity;
          }
        });
        if (stockNeeded > 0) {
          newMovements.push({
            id: Date.now().toString() + '-' + product.id + '-salida',
            obraId: id,
            obraName: obra.name,
            productId: product.id,
            productName: product.name,
            quantity: stockNeeded,
            type: 'salida',
            reason: 'Obra reactivada - Reasignación de productos',
            timestamp: now,
          });
          return {
            ...product,
            stockActual: Math.max(0, product.stockActual - stockNeeded),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) => {
        if (r.workId === id && r.status === 'finalizado') {
          return { ...r, status: 'iniciado' as const };
        }
        return r;
      });

      return {
        obras: state.obras.map((o: any) =>
          o.id === id ? { ...o, status: 'active' as const } : o
        ),
        rentals: updatedRentals,
        products: updatedProducts,
        stockMovements: [...state.stockMovements, ...newMovements],
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
      
      const now = new Date().toISOString();
      const itemsWithDates = rental.items.map((item: any) => ({
        ...item,
        addedDate: item.addedDate || now,
        dailyPrice: item.dailyPrice || item.unitPrice,
      }));
      
      const calculatedTotal = itemsWithDates.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const pagado = 0;
      const resto = calculatedTotal;
      
      const newRental: Rental = {
        ...rental,
        items: itemsWithDates,
        clientId: obra.clientId,
        clientName: obra.clientName,
        workName: obra.name,
        totalPrice: calculatedTotal,
        pagado: pagado,
        resto: resto,
        id: Date.now().toString(),
        createdAt: now,
        status: 'sin presupuestar',
        notes: rental.notes || '',
      };
      
      const newMovements: StockMovement[] = [];
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          newMovements.push({
            id: Date.now().toString() + '-' + product.id,
            obraId: rental.workId,
            obraName: obra.name,
            rentalId: newRental.id,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            type: 'salida',
            reason: 'Alquiler creado',
            timestamp: now,
          });
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
        stockMovements: [...state.stockMovements, ...newMovements],
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

      const now = new Date().toISOString();
      
      // Procesar items: consolidar solo si tienen el mismo productId Y la misma fecha
      // Si tienen diferentes fechas, mantenerlos separados
      const processedItems: any[] = [];
      const itemsByProductAndDate: Record<string, any[]> = {};

      items.forEach((item: any) => {
        const addedDate = item.addedDate || now;
        const key = `${item.productId}-${addedDate}`;
        if (!itemsByProductAndDate[key]) {
          itemsByProductAndDate[key] = [];
        }
        itemsByProductAndDate[key].push({
          ...item,
          addedDate: addedDate,
          dailyPrice: item.dailyPrice || item.unitPrice,
        });
      });

      // Consolidar items con el mismo productId y fecha
      Object.keys(itemsByProductAndDate).forEach((key: string) => {
        const itemsGroup = itemsByProductAndDate[key];
        if (itemsGroup.length === 1) {
          processedItems.push(itemsGroup[0]);
        } else {
          // Consolidar items del mismo producto y fecha
          const firstItem = itemsGroup[0];
          const totalQuantity = itemsGroup.reduce((sum: number, item: any) => sum + item.quantity, 0);
          processedItems.push({
            ...firstItem,
            quantity: totalQuantity,
            totalPrice: totalQuantity * firstItem.unitPrice,
          });
        }
      });

      const calculatedTotal = processedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const resto = Math.max(0, calculatedTotal - rental.pagado);

      // Calcular cambios de stock comparando items antiguos vs nuevos
      const newMovements: StockMovement[] = [];
      const oldItemsByProduct = rental.items.reduce((acc: any, item: any) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {});
      
      const newItemsByProduct = processedItems.reduce((acc: any, item: any) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {});

      const updatedProducts = state.products.map((product: any) => {
        const oldQty = oldItemsByProduct[product.id] || 0;
        const newQty = newItemsByProduct[product.id] || 0;
        const stockChange = oldQty - newQty;

        if (stockChange !== 0) {
          const obra = state.obras.find((o: any) => o.id === rental.workId);
          if (stockChange > 0) {
            newMovements.push({
              id: Date.now().toString() + '-' + product.id + '-entrada',
              obraId: rental.workId,
              obraName: obra?.name || rental.workName,
              rentalId: rental.id,
              productId: product.id,
              productName: product.name,
              quantity: stockChange,
              type: 'entrada',
              reason: 'Productos editados en alquiler',
              timestamp: now,
            });
          } else {
            newMovements.push({
              id: Date.now().toString() + '-' + product.id + '-salida',
              obraId: rental.workId,
              obraName: obra?.name || rental.workName,
              rentalId: rental.id,
              productId: product.id,
              productName: product.name,
              quantity: Math.abs(stockChange),
              type: 'salida',
              reason: 'Productos editados en alquiler',
              timestamp: now,
            });
          }
          return {
            ...product,
            stockActual: Math.max(0, Math.min(product.stockTotal, product.stockActual + stockChange)),
          };
        }
        return product;
      });

      const updatedRentals = state.rentals.map((r: any) =>
        r.id === id
          ? { ...r, items: processedItems, totalPrice: calculatedTotal, resto }
          : r
      );

      const obraRentals = updatedRentals.filter((r: any) => r.workId === rental.workId);
      const obraTotalPrice = obraRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const obra = state.obras.find((o: any) => o.id === rental.workId);
      const obraResto = obra ? obraTotalPrice - obra.pagado : 0;

      return {
        rentals: updatedRentals,
        products: updatedProducts,
        stockMovements: [...state.stockMovements, ...newMovements],
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

  recordRentalPayment: (id, amount, periodFrom, periodTo, notes) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental) return state;

      // Crear nuevo registro de pago
      const newPayment: PaymentHistory = {
        id: Date.now().toString(),
        amount,
        date: new Date().toISOString(),
        periodFrom,
        periodTo,
        notes,
      };

      // Actualizar fecha de devolución a un mes después de la fecha de devolución actual
      const currentReturnDate = new Date(rental.returnDate);
      const nextMonth = new Date(currentReturnDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const newReturnDate = nextMonth.toISOString();

      // Resetear fecha de adición de todos los items a la fecha hasta (periodTo)
      // y consolidar items con el mismo nombre de producto
      const newAddedDate = new Date(periodTo).toISOString();
      const consolidatedItems: any[] = [];
      const itemsByProduct: Record<string, any[]> = {};

      // Agrupar items por productId
      rental.items.forEach((item: any) => {
        if (!itemsByProduct[item.productId]) {
          itemsByProduct[item.productId] = [];
        }
        itemsByProduct[item.productId].push(item);
      });

      // Consolidar items del mismo producto
      Object.keys(itemsByProduct).forEach((productId: string) => {
        const items = itemsByProduct[productId];
        const firstItem = items[0];
        const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const unitPrice = firstItem.unitPrice;
        const dailyPrice = firstItem.dailyPrice || firstItem.unitPrice;

        consolidatedItems.push({
          ...firstItem,
          quantity: totalQuantity,
          totalPrice: totalQuantity * unitPrice,
          addedDate: newAddedDate,
          dailyPrice: dailyPrice,
        });
      });

      // Recalcular totalPrice basado en items consolidados
      const newTotalPrice = consolidatedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      // Actualizar total pagado
      const newPagado = (rental.pagado || 0) + amount;
      const newResto = Math.max(0, newTotalPrice - newPagado);

      return {
        rentals: state.rentals.map((r: any) => {
          if (r.id === id) {
            return {
              ...r,
              items: consolidatedItems,
              totalPrice: newTotalPrice,
              pagado: newPagado,
              resto: newResto,
              returnDate: newReturnDate,
              paymentHistory: [...(r.paymentHistory || []), newPayment],
            };
          }
          return r;
        }),
      };
    });
  },
  
  updateRentalStatus: (id, status) => {
    set((state: any) => ({
      rentals: state.rentals.map((r: any) =>
        r.id === id ? { ...r, status } : r
      ),
    }));
  },

  updateRentalNotes: (id, notes) => {
    set((state: any) => ({
      rentals: state.rentals.map((r: any) =>
        r.id === id ? { ...r, notes } : r
      ),
    }));
  },

  returnRental: (id) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental || rental.status === 'finalizado') return state;
      
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          const obra = state.obras.find((o: any) => o.id === rental.workId);
          newMovements.push({
            id: Date.now().toString() + '-' + product.id + '-entrada',
            obraId: rental.workId,
            obraName: obra?.name || rental.workName,
            rentalId: rental.id,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            type: 'entrada',
            reason: 'Devolución completa de alquiler',
            timestamp: now,
          });
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
            ? { ...r, status: 'finalizado' as const, pagado: r.totalPrice, resto: 0 }
            : r
        ),
        products: updatedProducts,
        stockMovements: [...state.stockMovements, ...newMovements],
      };
    });
  },

  reactivateRental: (id) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === id);
      if (!rental || rental.status === 'iniciado') return state;
      
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];
      const updatedProducts = state.products.map((product: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        if (item) {
          const obra = state.obras.find((o: any) => o.id === rental.workId);
          newMovements.push({
            id: Date.now().toString() + '-' + product.id + '-salida',
            obraId: rental.workId,
            obraName: obra?.name || rental.workName,
            rentalId: rental.id,
            productId: product.id,
            productName: product.name,
            quantity: item.quantity,
            type: 'salida',
            reason: 'Reactivación de alquiler',
            timestamp: now,
          });
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
            ? { ...r, status: 'iniciado' as const }
            : r
        ),
        products: updatedProducts,
        stockMovements: [...state.stockMovements, ...newMovements],
      };
    });
  },
  
  partialReturn: (rentalId, itemsToReturn) => {
    set((state: any) => {
      const rental = state.rentals.find((r: any) => r.id === rentalId);
      if (!rental || rental.status === 'finalizado') return state;
      
      const now = new Date().toISOString();
      const newMovements: StockMovement[] = [];
      const updatedProducts = state.products.map((product: any) => {
        const returnItem = itemsToReturn.find((i) => i.productId === product.id);
        if (returnItem) {
          const obra = state.obras.find((o: any) => o.id === rental.workId);
          newMovements.push({
            id: Date.now().toString() + '-' + product.id + '-entrada',
            obraId: rental.workId,
            obraName: obra?.name || rental.workName,
            rentalId: rental.id,
            productId: product.id,
            productName: product.name,
            quantity: returnItem.quantity,
            type: 'entrada',
            reason: 'Devolución parcial de alquiler',
            timestamp: now,
          });
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
      
      const newStatus = updatedItems.length === 0 ? 'finalizado' : 'iniciado';
      
      return {
        rentals: state.rentals.map((r: any) =>
          r.id === rentalId
            ? { ...r, items: updatedItems, status: newStatus }
            : r
        ),
        products: updatedProducts,
        stockMovements: [...state.stockMovements, ...newMovements],
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

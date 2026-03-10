import { create } from 'zustand';
import { Product, Rental, Client, RentalItem, Obra, StockMovement, PaymentHistory, StockAddHistory } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

interface StoreState {
  // Estado
  products: Product[];
  clients: Client[];
  obras: Obra[];
  rentals: Rental[];
  stockMovements: StockMovement[];
  currentUser: { id: string; name: string; username: string } | null;
  
  // Carga de datos
  loadProducts: () => Promise<void>;
  loadClients: () => Promise<void>;
  loadObras: () => Promise<void>;
  loadRentals: () => Promise<void>;
  loadStockMovements: (obraId?: string) => Promise<void>;
  
  // Productos
  addProduct: (product: Omit<Product, 'id' | 'addHistory'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<void>;
  
  // Clientes
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Obras
  addObra: (obra: Omit<Obra, 'id' | 'createdAt' | 'totalPrice' | 'pagado' | 'resto' | 'clientName'>) => Promise<void>;
  updateObra: (id: string, obra: Partial<Obra>) => Promise<void>;
  updateObraPayment: (id: string, pagado: number) => Promise<void>;
  finishObra: (id: string) => Promise<void>;
  pauseObra: (id: string) => Promise<void>;
  reactivateObra: (id: string) => Promise<void>;
  deleteObra: (id: string) => Promise<void>;
  
  // Alquileres
  addRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'totalPrice' | 'pagado' | 'resto' | 'status' | 'workName' | 'clientName'>) => Promise<void>;
  updateRental: (id: string, rental: Partial<Rental>) => Promise<void>;
  updateRentalItems: (id: string, items: RentalItem[]) => Promise<void>;
  updateRentalPayment: (id: string, pagado: number) => Promise<void>;
  recordRentalPayment: (id: string, amount: number, periodFrom: string, periodTo: string, notes?: string) => Promise<void>;
  updateRentalStatus: (id: string, status: Rental['status']) => Promise<void>;
  updateRentalNotes: (id: string, notes: string) => Promise<void>;
  returnRental: (id: string) => Promise<void>;
  reactivateRental: (id: string) => Promise<void>;
  partialReturn: (rentalId: string, itemsToReturn: { productId: string; quantity: number }[]) => Promise<void>;
  transferStockBetweenObras: (fromObraId: string, toObraId: string, items: { productId: string; quantity: number }[]) => Promise<void>;
  
  // Utilidades
  getStockMovementsByObra: (obraId: string) => StockMovement[];
  setUser: (user: { id: string; name: string; username: string } | null) => void;
  logout: () => Promise<void>;
  
  // UI
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
}

export const useStore = create<StoreState>((set: any, get: any) => ({
  // Estado inicial vacío
  products: [],
  clients: [],
  obras: [],
  rentals: [],
  stockMovements: [],
  currentUser: null,
  isSidebarOpen: true,
  
  // Carga de datos desde la API
  loadProducts: async () => {
    try {
      const products = await apiGet<Product[]>('products');
      set({ products });
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  },
  
  loadClients: async () => {
    try {
      const clients = await apiGet<Client[]>('clients');
      set({ clients });
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      throw error;
    }
  },
  
  loadObras: async () => {
    try {
      const obras = await apiGet<Obra[]>('obras');
      set({ obras });
    } catch (error) {
      console.error('Error al cargar obras:', error);
      throw error;
    }
  },
  
  loadRentals: async () => {
    try {
      const rentals = await apiGet<Rental[]>('rentals');
      set({ rentals });
    } catch (error) {
      console.error('Error al cargar alquileres:', error);
      throw error;
    }
  },
  
  loadStockMovements: async (obraId?: string) => {
    try {
      const endpoint = obraId ? `stock-movements?obraId=${obraId}` : 'stock-movements';
      const movements = await apiGet<StockMovement[]>(endpoint);
      set({ stockMovements: movements });
    } catch (error) {
      console.error('Error al cargar movimientos de stock:', error);
      throw error;
    }
  },
  
  // Productos
  addProduct: async (product) => {
    try {
      const newProduct = await apiPost<Product>('products', product);
      set((state: any) => ({
        products: [...state.products, newProduct]
      }));
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },
  
  updateProduct: async (id, product) => {
    try {
      const updatedProduct = await apiPut<Product>(`products/${id}`, product);
      set((state: any) => ({
        products: state.products.map((p: Product) => 
          p.id === id ? updatedProduct : p
        )
      }));
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    try {
      await apiDelete(`products/${id}`);
      set((state: any) => ({
        products: state.products.filter((p: Product) => p.id !== id)
      }));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },
  
  updateStock: async (id, quantity) => {
    try {
      const product = get().products.find((p: Product) => p.id === id);
      if (!product) throw new Error('Producto no encontrado');
      
      await apiPut(`products/${id}`, {
        stockTotal: quantity,
        stockActual: quantity - (product.stockTotal - product.stockActual)
      });
      
      // Recargar productos para obtener el estado actualizado
      await get().loadProducts();
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw error;
    }
  },
  
  // Clientes
  addClient: async (client) => {
    try {
      const newClient = await apiPost<Client>('clients', client);
      set((state: any) => ({
        clients: [...state.clients, newClient]
      }));
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },
  
  updateClient: async (id, client) => {
    try {
      const updatedClient = await apiPut<Client>(`clients/${id}`, client);
      set((state: any) => ({
        clients: state.clients.map((c: Client) => 
          c.id === id ? updatedClient : c
        )
      }));
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      await apiDelete(`clients/${id}`);
      set((state: any) => ({
        clients: state.clients.filter((c: Client) => c.id !== id)
      }));
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },
  
  // Obras
  addObra: async (obra) => {
    try {
      const newObra = await apiPost<Obra>('obras', obra);
      set((state: any) => ({
        obras: [...state.obras, newObra]
      }));
    } catch (error) {
      console.error('Error al crear obra:', error);
      throw error;
    }
  },
  
  updateObra: async (id, obra) => {
    try {
      const updatedObra = await apiPut<Obra>(`obras/${id}`, obra);
      set((state: any) => ({
        obras: state.obras.map((o: Obra) => 
          o.id === id ? updatedObra : o
        )
      }));
    } catch (error) {
      console.error('Error al actualizar obra:', error);
      throw error;
    }
  },
  
  updateObraPayment: async (id, pagado) => {
    try {
      await apiPut(`obras/${id}`, { pagado });
      await get().loadObras();
    } catch (error) {
      console.error('Error al actualizar pago de obra:', error);
      throw error;
    }
  },
  
  finishObra: async (id) => {
    try {
      await apiPut(`obras/${id}`, { status: 'completed' });
      await get().loadObras();
      await get().loadRentals();
      await get().loadProducts();
    } catch (error) {
      console.error('Error al finalizar obra:', error);
      throw error;
    }
  },
  
  pauseObra: async (id) => {
    try {
      await apiPut(`obras/${id}`, { status: 'paused' });
      await get().loadObras();
    } catch (error) {
      console.error('Error al pausar obra:', error);
      throw error;
    }
  },
  
  reactivateObra: async (id) => {
    try {
      await apiPut(`obras/${id}`, { status: 'active' });
      await get().loadObras();
    } catch (error) {
      console.error('Error al reactivar obra:', error);
      throw error;
    }
  },
  
  deleteObra: async (id) => {
    try {
      await apiDelete(`obras/${id}`);
      set((state: any) => ({
        obras: state.obras.filter((o: Obra) => o.id !== id)
      }));
    } catch (error) {
      console.error('Error al eliminar obra:', error);
      throw error;
    }
  },
  
  // Alquileres
  addRental: async (rental) => {
    try {
      const newRental = await apiPost<Rental>('rentals', rental);
      set((state: any) => ({
        rentals: [...state.rentals, newRental]
      }));
      // Recargar productos porque el stock cambió
      await get().loadProducts();
      await get().loadObras();
    } catch (error) {
      console.error('Error al crear alquiler:', error);
      throw error;
    }
  },
  
  updateRental: async (id, rental) => {
    try {
      const updatedRental = await apiPut<Rental>(`rentals/${id}`, rental);
      set((state: any) => ({
        rentals: state.rentals.map((r: Rental) => 
          r.id === id ? updatedRental : r
        )
      }));
    } catch (error) {
      console.error('Error al actualizar alquiler:', error);
      throw error;
    }
  },
  
  updateRentalItems: async (id, items) => {
    try {
      await apiPut(`rentals/${id}`, { items });
      await get().loadRentals();
      await get().loadProducts();
      await get().loadObras();
    } catch (error) {
      console.error('Error al actualizar items del alquiler:', error);
      throw error;
    }
  },
  
  updateRentalPayment: async (id, pagado) => {
    try {
      await apiPut(`rentals/${id}`, { pagado });
      await get().loadRentals();
    } catch (error) {
      console.error('Error al actualizar pago del alquiler:', error);
      throw error;
    }
  },
  
  recordRentalPayment: async (id, amount, periodFrom, periodTo, notes) => {
    try {
      await apiPost(`rentals/${id}/payments`, {
        amount,
        periodFrom,
        periodTo,
        notes
      });
      await get().loadRentals();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      throw error;
    }
  },
  
  updateRentalStatus: async (id, status) => {
    try {
      await apiPut(`rentals/${id}`, { status });
      await get().loadRentals();
      await get().loadProducts();
    } catch (error) {
      console.error('Error al actualizar estado del alquiler:', error);
      throw error;
    }
  },
  
  updateRentalNotes: async (id, notes) => {
    try {
      await apiPut(`rentals/${id}`, { notes });
      await get().loadRentals();
    } catch (error) {
      console.error('Error al actualizar notas del alquiler:', error);
      throw error;
    }
  },
  
  returnRental: async (id) => {
    try {
      await apiPut(`rentals/${id}`, { status: 'finalizado' });
      await get().loadRentals();
      await get().loadProducts();
    } catch (error) {
      console.error('Error al devolver alquiler:', error);
      throw error;
    }
  },
  
  reactivateRental: async (id) => {
    try {
      await apiPut(`rentals/${id}`, { status: 'iniciado' });
      await get().loadRentals();
      await get().loadProducts();
    } catch (error) {
      console.error('Error al reactivar alquiler:', error);
      throw error;
    }
  },
  
  partialReturn: async (rentalId, itemsToReturn) => {
    try {
      await apiPost(`rentals/${rentalId}/partial-return`, { itemsToReturn });
      await get().loadRentals();
      await get().loadProducts();
    } catch (error) {
      console.error('Error al hacer devolución parcial:', error);
      throw error;
    }
  },
  
  transferStockBetweenObras: async (fromObraId, toObraId, items) => {
    try {
      await apiPost('rentals/transfer', {
        fromObraId,
        toObraId,
        items
      });
      await get().loadRentals();
      await get().loadProducts();
      await get().loadStockMovements();
    } catch (error) {
      console.error('Error al transferir stock:', error);
      throw error;
    }
  },
  
  // Utilidades
  getStockMovementsByObra: (obraId: string) => {
    return get().stockMovements.filter((m: StockMovement) => m.obraId === obraId);
  },
  
  setUser: (user) => set({ currentUser: user }),
  
  logout: async () => {
    try {
      await apiPost('auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    set({ currentUser: null });
  },
  
  // UI
  toggleSidebar: () => set((state: any) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),
  setIsSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
}));

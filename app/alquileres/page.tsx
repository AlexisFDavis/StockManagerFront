'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  TextInput,
  Badge,
  Select,
  SelectItem,
  Metric,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@tremor/react';
import { RentalItem } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { generarRemito, generarRecibo, descargarPDF, RemitoData, ReciboData } from '@/app/utils/pdfGenerator';

export default function AlquileresPage() {
  const products = useStore((state: any) => state.products);
  const clients = useStore((state: any) => state.clients);
  const obras = useStore((state: any) => state.obras);
  const rentals = useStore((state: any) => state.rentals);
  const addRental = useStore((state: any) => state.addRental);
  const returnRental = useStore((state: any) => state.returnRental);
  const reactivateRental = useStore((state: any) => state.reactivateRental);
  const updateProduct = useStore((state: any) => state.updateProduct);
  const partialReturn = useStore((state: any) => state.partialReturn);
  const updateRental = useStore((state: any) => state.updateRental);
  const updateRentalItems = useStore((state: any) => state.updateRentalItems);
  const updateRentalPayment = useStore((state: any) => state.updateRentalPayment);
  const recordRentalPayment = useStore((state: any) => state.recordRentalPayment);
  const updateRentalStatus = useStore((state: any) => state.updateRentalStatus);
  const updateRentalNotes = useStore((state: any) => state.updateRentalNotes);
  const transferStockBetweenObras = useStore((state: any) => state.transferStockBetweenObras);
  const loadProducts = useStore((state: any) => state.loadProducts);
  const loadClients = useStore((state: any) => state.loadClients);
  const loadObras = useStore((state: any) => state.loadObras);
  const loadRentals = useStore((state: any) => state.loadRentals);

  useEffect(() => {
    loadProducts();
    loadClients();
    loadObras();
    loadRentals();
  }, [loadProducts, loadClients, loadObras, loadRentals]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPartialReturnOpen, setIsPartialReturnOpen] = useState(false);
  const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
  const [isEditItemsOpen, setIsEditItemsOpen] = useState(false);
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFromObra, setTransferFromObra] = useState('');
  const [transferToObra, setTransferToObra] = useState('');
  const [transferItems, setTransferItems] = useState<{ productId: string; productName: string; quantity: number }[]>([]);

  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [editField, setEditField] = useState<{ field: string; value: any }>({ field: '', value: '' });
  const [partialReturnItems, setPartialReturnItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [missingProducts, setMissingProducts] = useState<{ productId: string; productName: string; needed: number; current: number; missing: number }[]>([]);
  
  // New rental form
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [editingRentalItems, setEditingRentalItems] = useState<RentalItem[]>([]);
  const [returnDate, setReturnDate] = useState('');
  const [pagado, setPagado] = useState(0);
  const [newRentalNotes, setNewRentalNotes] = useState('');

  // Details modal
  const [detailsNotes, setDetailsNotes] = useState('');

  // Billing modal
  const [billingDateFrom, setBillingDateFrom] = useState('');
  const [billingDateTo, setBillingDateTo] = useState('');
  const [billingMode, setBillingMode] = useState<'custom' | 'month' | 'todate' | 'vencimiento'>('vencimiento');
  const [discountType, setDiscountType] = useState<'item' | 'total' | 'none'>('none');
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, { type: 'percent' | 'amount'; value: number }>>({});
  const [totalDiscount, setTotalDiscount] = useState<{ type: 'percent' | 'amount'; value: number }>({ type: 'percent', value: 0 });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredRentals = useMemo(() => {
    return rentals.filter((rental: any) => {
      const matchesSearch = searchText === '' || 
        rental.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
        rental.workName.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(rental.returnDate) >= new Date(dateFrom);
      }
      if (dateTo && matchesDate) {
        matchesDate = new Date(rental.returnDate) <= new Date(dateTo);
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rentals, searchText, statusFilter, dateFrom, dateTo]);

  const availableProducts = useMemo(
    () => products.filter((p: any) => p.stockActual > 0),
    [products]
  );

  const activeRentals = useMemo(
    () => rentals.filter((r: any) => r.status === 'iniciado'),
    [rentals]
  );

  const presupuestados = useMemo(
    () => rentals.filter((r: any) => r.status === 'presupuestado'),
    [rentals]
  );

  const sinPresupuestar = useMemo(
    () => rentals.filter((r: any) => r.status === 'sin presupuestar'),
    [rentals]
  );

  const totalActiveRentals = activeRentals.length;
  const totalRevenue = rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  const upcomingReturns = activeRentals.filter((r: any) => {
    const daysUntil = Math.ceil((new Date(r.returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0;
  }).length;

  // ========== Calculation helpers ==========
  
  const calculateDailyTotal = (rental: any) => {
    return rental.items.reduce((sum: number, item: any) => {
      return sum + (item.dailyPrice || item.unitPrice) * item.quantity;
    }, 0);
  };

  const calculateBillingForItem = (item: any, fromDate: Date, toDate: Date) => {
    const itemAddedDate = new Date(item.addedDate);
    const effectiveFrom = itemAddedDate > fromDate ? itemAddedDate : fromDate;
    const days = Math.max(0, differenceInDays(toDate, effectiveFrom) + 1);
    const dailyRate = (item.dailyPrice || item.unitPrice) * item.quantity;
    return { days, dailyRate, total: days * dailyRate };
  };

  const calculateBillingTotal = (rental: any, fromDate: Date, toDate: Date) => {
    return rental.items.reduce((sum: number, item: any) => {
      const billing = calculateBillingForItem(item, fromDate, toDate);
      return sum + billing.total;
    }, 0);
  };

  const calculateToDateBilling = (rental: any) => {
    const now = new Date();
    // Normalizar fecha actual a medianoche para cálculo preciso
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return rental.items.reduce((sum: number, item: any) => {
      const addedDate = new Date(item.addedDate);
      // Normalizar fecha de adición a medianoche
      const addedDateNormalized = new Date(addedDate.getFullYear(), addedDate.getMonth(), addedDate.getDate());
      
      // Calcular días transcurridos (incluyendo el día de adición)
      const days = Math.max(1, differenceInDays(today, addedDateNormalized) + 1);
      const dailyRate = (item.dailyPrice || item.unitPrice) * item.quantity;
      return sum + (days * dailyRate);
    }, 0);
  };

  // ========== Dialog openers ==========

  const openAddDialog = () => {
    setSelectedWorkId('');
    setRentalItems([]);
    setReturnDate('');
    setPagado(0);
    setNewRentalNotes('');
    setIsDialogOpen(true);
  };

  const openDetailsDialog = (rental: any) => {
    setSelectedRental(rental);
    setDetailsNotes(rental.notes || '');
    setIsDetailsOpen(true);
  };

  const openBillingDialog = (rental: any) => {
    setSelectedRental(rental);
    setBillingMode('vencimiento');
    // Para modo vencimiento, desde la fecha de devolución actual
    const returnDate = new Date(rental.returnDate);
    const nextMonth = new Date(returnDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setBillingDateFrom(rental.returnDate.split('T')[0]);
    setBillingDateTo(nextMonth.toISOString().split('T')[0]);
    setDiscountType('none');
    setItemDiscounts({});
    setTotalDiscount({ type: 'percent', value: 0 });
    setIsBillingOpen(true);
  };

  const openEditItemsDialog = (rental: any) => {
    setSelectedRental(rental);
    setEditingRentalItems(rental.items.map((item: any) => ({ ...item })));
    setIsEditItemsOpen(true);
  };

  const openEditPaymentDialog = (rental: any) => {
    setSelectedRental(rental);
    setPagado(rental.pagado || 0);
    setIsEditPaymentOpen(true);
  };

  const openPartialReturn = (rental: any) => {
    setSelectedRental(rental);
    setPartialReturnItems(rental.items.map((item: any) => ({ productId: item.productId, quantity: 0 })));
    setIsPartialReturnOpen(true);
  };

  const openEditField = (rental: any, field: string, value: any) => {
    setSelectedRental(rental);
    setEditField({ field, value });
    setIsEditFieldOpen(true);
  };

  // ========== Handlers ==========

  const handleSaveDetailsNotes = () => {
    if (selectedRental) {
      updateRentalNotes(selectedRental.id, detailsNotes);
      setSelectedRental({ ...selectedRental, notes: detailsNotes });
    }
  };

  const handleStatusChange = (rentalId: string, newStatus: string) => {
    updateRentalStatus(rentalId, newStatus as any);
  };

  const handlePartialReturn = () => {
    const itemsToReturn = partialReturnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) return;
    partialReturn(selectedRental.id, itemsToReturn);
    setIsPartialReturnOpen(false);
  };

  const handleEditField = () => {
    if (editField.field === 'returnDate') {
      updateRental(selectedRental.id, { returnDate: editField.value });
    }
    setIsEditFieldOpen(false);
  };

  const addItemToRental = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    const existingItem = rentalItems.find((item) => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity < product.stockActual) {
        const newQuantity = existingItem.quantity + 1;
        setRentalItems(
          rentalItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
              : item
          )
        );
      }
    } else {
      if (product.stockActual > 0) {
        setRentalItems([...rentalItems, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          dailyPrice: product.price,
          totalPrice: product.price,
          addedDate: new Date().toISOString(),
        }]);
      }
    }
  };

  const removeItemFromRental = (productId: string) => {
    setRentalItems(rentalItems.filter((item) => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product || quantity < 1 || quantity > product.stockActual) return;
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      )
    );
  };

  const updateItemDailyPrice = (productId: string, dailyPrice: number) => {
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, dailyPrice: Math.max(0, dailyPrice) }
          : item
      )
    );
  };

  const updateItemAddedDate = (productId: string, addedDate: string) => {
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, addedDate: new Date(addedDate).toISOString() }
          : item
      )
    );
  };

  const calculatedTotal = useMemo(() => rentalItems.reduce((sum, item) => sum + item.totalPrice, 0), [rentalItems]);
  const calculatedDailyTotal = useMemo(() => rentalItems.reduce((sum, item) => sum + (item.dailyPrice || item.unitPrice) * item.quantity, 0), [rentalItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId || rentalItems.length === 0 || !returnDate) return;
    const selectedObra = obras.find((o: any) => o.id === selectedWorkId);
    if (!selectedObra) {
      console.error('Obra no encontrada');
      return;
    }
    
    addRental({
      workId: selectedWorkId,
      clientId: selectedObra.clientId,
      items: rentalItems,
      returnDate,
      notes: newRentalNotes,
    } as any);
    setIsDialogOpen(false);
  };

  const handleUpdateItems = () => {
    if (!selectedRental) return;
    updateRentalItems(selectedRental.id, editingRentalItems);
    setIsEditItemsOpen(false);
  };

  const handleUpdatePayment = () => {
    if (!selectedRental) return;
    updateRentalPayment(selectedRental.id, pagado);
    setIsEditPaymentOpen(false);
  };

  const addItemToEditingRental = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    // Verificar stock total disponible (sumando todos los items del mismo producto)
    const totalQuantityInRental = editingRentalItems
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (totalQuantityInRental < product.stockActual) {
      // Siempre crear un nuevo item, incluso si ya existe uno del mismo producto
      // Esto permite tener items del mismo producto con diferentes fechas de adición
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // Solo la fecha, sin hora
      
      setEditingRentalItems([...editingRentalItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        dailyPrice: product.price,
        totalPrice: product.price,
        addedDate: new Date(todayStr).toISOString(), // Fecha actual como fecha de adición
      }]);
    }
  };

  const removeItemFromEditingRental = (itemIndex: number) => {
    setEditingRentalItems(editingRentalItems.filter((_, index) => index !== itemIndex));
  };

  const updateEditingItemQuantity = (itemIndex: number, quantity: number) => {
    const item = editingRentalItems[itemIndex];
    if (!item || quantity < 1) return;
    
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) return;
    
    // Verificar stock total disponible (sumando todos los items del mismo producto excepto el actual)
    const totalQuantityInRental = editingRentalItems
      .filter((i, idx) => i.productId === item.productId && idx !== itemIndex)
      .reduce((sum, i) => sum + i.quantity, 0);
    
    if (quantity + totalQuantityInRental > product.stockActual) return;
    
    setEditingRentalItems(
      editingRentalItems.map((i, idx) =>
        idx === itemIndex
          ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
          : i
      )
    );
  };

  const updateEditingItemDailyPrice = (itemIndex: number, dailyPrice: number) => {
    setEditingRentalItems(
      editingRentalItems.map((item, idx) =>
        idx === itemIndex
          ? { ...item, dailyPrice: Math.max(0, dailyPrice) }
          : item
      )
    );
  };

  const updateEditingItemAddedDate = (itemIndex: number, addedDate: string) => {
    setEditingRentalItems(
      editingRentalItems.map((item, idx) =>
        idx === itemIndex
          ? { ...item, addedDate: new Date(addedDate).toISOString() }
          : item
      )
    );
  };

  const handleFullReturn = (rentalId: string) => {
    if (confirm('¿Confirmar devolución completa?')) returnRental(rentalId);
  };

  const checkStockForReactivation = (rental: any) => {
    const missing: { productId: string; productName: string; needed: number; current: number; missing: number }[] = [];
    rental.items.forEach((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      if (product) {
        const needed = item.quantity;
        const current = product.stockActual;
        if (current < needed) {
          missing.push({ productId: item.productId, productName: item.productName, needed, current, missing: needed - current });
        }
      }
    });
    return missing;
  };

  const handleReactivate = (rentalId: string) => {
    const rental = rentals.find((r: any) => r.id === rentalId);
    if (!rental) return;
    const missing = checkStockForReactivation(rental);
    if (missing.length > 0) {
      setSelectedRental(rental);
      setMissingProducts(missing);
      setIsReactivateOpen(true);
    } else {
      if (confirm('¿Reactivar este alquiler? Los productos volverán a estar alquilados.')) {
        reactivateRental(rentalId);
      }
    }
  };

  const handleAddMissingProducts = () => {
    if (!selectedRental) return;
    missingProducts.forEach((missing) => {
      const product = products.find((p: any) => p.id === missing.productId);
      if (product) {
        updateProduct(missing.productId, {
          stockTotal: product.stockTotal + missing.missing,
          stockActual: product.stockActual + missing.missing,
        });
      }
    });
    reactivateRental(selectedRental.id);
    setIsReactivateOpen(false);
    setMissingProducts([]);
  };

  const getDaysUntilReturn = (returnDateStr: string) => {
    return Math.ceil((new Date(returnDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (rental: any) => {
    const daysUntil = getDaysUntilReturn(rental.returnDate);
    switch (rental.status) {
      case 'sin presupuestar':
        return <Badge color="gray">Sin presupuestar</Badge>;
      case 'presupuestado':
        return <Badge color="blue">Presupuestado</Badge>;
      case 'iniciado':
        return (
          <Badge color={daysUntil < 0 ? 'red' : daysUntil <= 3 ? 'orange' : 'green'}>
            {daysUntil < 0 ? 'Vencido' : daysUntil === 0 ? 'Hoy' : `Iniciado (${daysUntil}d)`}
          </Badge>
        );
      case 'finalizado':
        return <Badge color="gray">Finalizado</Badge>;
      default:
        return <Badge color="gray">{rental.status}</Badge>;
    }
  };

  const getNextStatusAction = (rental: any) => {
    switch (rental.status) {
      case 'sin presupuestar':
        return { label: 'Presupuestar', nextStatus: 'presupuestado', color: 'blue' };
      case 'presupuestado':
        return { label: 'Iniciar', nextStatus: 'iniciado', color: 'green' }; // Permite iniciar manualmente antes de la fecha
      case 'iniciado':
        return null; // se finaliza con "Devolver"
      default:
        return null;
    }
  };

  // Auto-iniciar alquileres presupuestados cuando llegue la fecha de creación
  useEffect(() => {
    const checkAutoStart = () => {
      rentals.forEach((rental: any) => {
        if (rental.status === 'presupuestado') {
          const createdAt = new Date(rental.createdAt);
          const now = new Date();
          // Comparar solo las fechas (sin horas)
          const createdAtDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          // Si la fecha de creación es hoy o ya pasó, iniciar automáticamente
          if (nowDate >= createdAtDate) {
            updateRentalStatus(rental.id, 'iniciado');
          }
        }
      });
    };

    checkAutoStart();
    // Verificar cada minuto
    const interval = setInterval(checkAutoStart, 60000);
    return () => clearInterval(interval);
  }, [rentals, updateRentalStatus]);


  const handleGenerarRemito = async (rental: any) => {
    try {
      const cliente = clients.find((c: any) => c.id === rental.clientId);
      const obra = obras.find((o: any) => o.id === rental.workId);
      const remitoData: RemitoData = {
        fecha: format(new Date(), 'dd/MM/yyyy'),
        cliente: cliente?.name || rental.clientName,
        direccion: cliente?.address || '',
        localidad: obra?.address || '',
        items: rental.items.map((item: any) => ({ cantidad: item.quantity, descripcion: item.productName })),
        transportista: '',
        Domicilio: '',
      };
      const pdfBytes = await generarRemito(remitoData);
      descargarPDF(pdfBytes, `remito-${rental.id.slice(-6)}.pdf`);
    } catch (error) {
      console.error('Error al generar remito:', error);
      alert('Error al generar el remito. Verifica que el template esté disponible.');
    }
  };

  const handleGenerarRecibo = async (rental: any) => {
    try {
      const cliente = clients.find((c: any) => c.id === rental.clientId);
      const reciboData: ReciboData = {
        fecha: format(new Date(), 'dd/MM/yyyy'),
        cliente: cliente?.name || rental.clientName,
        direccion: cliente?.address || '',
        localidad: cliente?.address || '',
        concepto: `Alquiler de equipos - Obra: ${rental.workName}`,
        total: rental.totalPrice,
        formaPago: 'Efectivo',
      };
      const pdfBytes = await generarRecibo(reciboData);
      descargarPDF(pdfBytes, `recibo-${rental.id.slice(-6)}.pdf`);
    } catch (error) {
      console.error('Error al generar recibo:', error);
      alert('Error al generar el recibo. Verifica que el template esté disponible.');
    }
  };

  // ========== Billing calculation for modal ==========
  const billingDetails = useMemo(() => {
    if (!selectedRental || !isBillingOpen) return null;
    
    let fromDate: Date;
    let toDate: Date;
    
    if (billingMode === 'vencimiento') {
      // Desde la fecha de devolución actual hasta un mes después
      const returnDate = new Date(selectedRental.returnDate);
      fromDate = new Date(returnDate);
      const nextMonth = new Date(returnDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      toDate = nextMonth;
    } else if (billingMode === 'todate') {
      fromDate = new Date(selectedRental.createdAt);
      toDate = new Date();
    } else if (billingMode === 'month') {
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      fromDate = billingDateFrom ? new Date(billingDateFrom) : new Date(selectedRental.createdAt);
      toDate = billingDateTo ? new Date(billingDateTo) : new Date();
    }

    const items = selectedRental.items.map((item: any) => {
      const billing = calculateBillingForItem(item, fromDate, toDate);
      let subtotal = billing.total;
      let discount = 0;
      
      // Aplicar descuento por ítem si está activo
      if (discountType === 'item' && itemDiscounts[item.productId]) {
        const itemDiscount = itemDiscounts[item.productId];
        if (itemDiscount.type === 'percent') {
          discount = subtotal * (itemDiscount.value / 100);
        } else {
          discount = Math.min(itemDiscount.value, subtotal);
        }
        subtotal = subtotal - discount;
      }
      
      return { 
        ...item, 
        ...billing, 
        subtotal: billing.total,
        discount,
        total: subtotal
      };
    });

    let subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    let totalDiscountAmount = items.reduce((sum: number, item: any) => sum + item.discount, 0);
    let grandTotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    
    // Aplicar descuento sobre el total si está activo
    if (discountType === 'total' && totalDiscount.value > 0) {
      if (totalDiscount.type === 'percent') {
        totalDiscountAmount = subtotal * (totalDiscount.value / 100);
      } else {
        totalDiscountAmount = Math.min(totalDiscount.value, subtotal);
      }
      grandTotal = subtotal - totalDiscountAmount;
    }

    return { 
      items, 
      subtotal,
      totalDiscount: discountType === 'total' ? totalDiscountAmount : items.reduce((sum: number, item: any) => sum + item.discount, 0),
      grandTotal, 
      fromDate, 
      toDate 
    };
  }, [selectedRental, isBillingOpen, billingMode, billingDateFrom, billingDateTo, discountType, itemDiscounts, totalDiscount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div></div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            <span className="text-lg">🔄</span>
            Traslado
          </button>
        <button
          onClick={openAddDialog}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <span className="text-lg">+</span>
          Nuevo Alquiler
        </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-xs">Activos</Text>
          <Metric className="text-xl">{totalActiveRentals}</Metric>
          <Text className="text-xs text-gray-400">${activeRentals.reduce((s: number, r: any) => s + r.totalPrice, 0).toLocaleString()}</Text>
        </Card>
        <Card decoration="top" decorationColor="gray" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-xs">Sin presupuestar</Text>
          <Metric className="text-xl">{sinPresupuestar.length}</Metric>
          <Text className="text-xs text-gray-400">${sinPresupuestar.reduce((s: number, r: any) => s + r.totalPrice, 0).toLocaleString()}</Text>
        </Card>
        <Card decoration="top" decorationColor="orange" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-xs">Vencen en 3 días</Text>
          <Metric className="text-xl">{upcomingReturns}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-xs">Ingresos Totales</Text>
          <Metric className="text-xl">${totalRevenue.toLocaleString()}</Metric>
          <Text className="text-xs text-gray-400">{rentals.length} alquileres</Text>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <div className="mb-3">
          <Text className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente / Obra</label>
            <TextInput
              placeholder="Buscar por cliente u obra..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Todos</option>
              <option value="sin presupuestar">Sin presupuestar</option>
              <option value="presupuestado">Presupuestado</option>
              <option value="iniciado">Iniciado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </Card>

      {/* Rental List */}
      <Card className="shadow-md rounded-2xl">
        <Title className="text-lg font-bold mb-4">Lista de Alquileres</Title>
        {filteredRentals.length === 0 ? (
          <div className="text-center py-12">
            <Text className="text-gray-400 text-4xl mb-3">📋</Text>
            <Text className="text-gray-500">No se encontraron alquileres</Text>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="text-left">Obra</TableHeaderCell>
                <TableHeaderCell className="text-left">Cliente</TableHeaderCell>
                <TableHeaderCell className="text-left">Productos</TableHeaderCell>
                    <TableHeaderCell className="text-left">Precio/Día</TableHeaderCell>
                    <TableHeaderCell className="text-left">F. Devolución</TableHeaderCell>
                <TableHeaderCell className="text-left">Total</TableHeaderCell>
                <TableHeaderCell className="text-left">Pagado</TableHeaderCell>
                <TableHeaderCell className="text-left">Resto</TableHeaderCell>
                <TableHeaderCell className="text-left">Estado</TableHeaderCell>
                <TableHeaderCell className="text-left">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>
                <TableBody>
                  {filteredRentals.map((rental: any) => {
                    const dailyTotal = calculateDailyTotal(rental);
                    const toDateTotal = calculateToDateBilling(rental);
                    const nextAction = getNextStatusAction(rental);
                    return (
                  <TableRow key={rental.id}>
                        <TableCell className="font-medium text-sm">{rental.workName}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{rental.clientName}</TableCell>
                    <TableCell>
                          <div className="space-y-1">
                            {rental.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600">
                                <span className="font-medium">{item.productName}</span> ×{item.quantity}
                                <span className="text-gray-400 ml-1">
                                  (desde {format(new Date(item.addedDate), 'dd/MM')})
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-semibold text-blue-600">${dailyTotal.toLocaleString()}/día</span>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Acumulado: ${toDateTotal.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{format(new Date(rental.returnDate), 'dd/MM/yyyy')}</span>
                            {(rental.status === 'iniciado' || rental.status === 'presupuestado' || rental.status === 'sin presupuestar') && (
                              <button
                                onClick={() => openEditField(rental, 'returnDate', rental.returnDate)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar fecha"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm">${(rental.totalPrice || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-green-600 text-sm">${(rental.pagado || 0).toLocaleString()}</span>
                            <button
                              onClick={() => openEditPaymentDialog(rental)}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Editar pago"
                            >
                              ✏️
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-orange-600 text-sm">${(rental.resto || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(rental)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {/* Botón de avance de estado */}
                            {nextAction && (
                              <button
                                onClick={() => handleStatusChange(rental.id, nextAction.nextStatus)}
                                className={`px-2 py-1 text-xs font-medium text-white rounded-xl transition-all shadow-sm hover:shadow-md ${
                                  nextAction.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {nextAction.label}
                              </button>
                            )}
                            
                            {/* Botón Detalles */}
                            <button
                              onClick={() => openDetailsDialog(rental)}
                              className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                              title="Ver detalles"
                            >
                              🔍 Detalles
                            </button>

                            {/* Botón Cobrar */}
                            {(rental.status === 'iniciado' || rental.status === 'presupuestado') && (
                              <button
                                onClick={() => openBillingDialog(rental)}
                                className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
                                title="Calcular cobro"
                              >
                                💲 Cobrar
                              </button>
                            )}

                            {rental.status === 'iniciado' && (
                              <>
                                <button
                                  onClick={() => openEditItemsDialog(rental)}
                                  className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all"
                                  title="Editar productos"
                                >
                                  ✏️ Productos
                                </button>
                                <button
                                  onClick={() => openPartialReturn(rental)}
                                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                  title="Devolución parcial"
                                >
                                  Parcial
                                </button>
                                <button
                                  onClick={() => handleFullReturn(rental.id)}
                                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm"
                                  title="Devolver todo"
                                >
                                  Devolver
                                </button>
                              </>
                            )}
                            {rental.status === 'finalizado' && (
                              <button
                                onClick={() => handleReactivate(rental.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                                title="Reactivar alquiler"
                              >
                                🔄 Reactivar
                              </button>
                            )}
                            <button
                              onClick={() => handleGenerarRemito(rental)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                              title="Generar remito"
                            >
                              📄 Remito
                            </button>
                            <button
                              onClick={() => handleGenerarRecibo(rental)}
                              className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all"
                              title="Generar recibo"
                            >
                              💰 Recibo
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-4">
              {filteredRentals.map((rental: any) => {
                const dailyTotal = calculateDailyTotal(rental);
                const toDateTotal = calculateToDateBilling(rental);
                const nextAction = getNextStatusAction(rental);
                return (
                  <div key={rental.id} className="border border-gray-200 rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Text className="font-semibold text-gray-900">{rental.workName}</Text>
                        <Text className="text-sm text-gray-600 mt-0.5">{rental.clientName}</Text>
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(rental)}
                      </div>
                    </div>

                    {/* Productos con fecha de adición */}
                    <div className="space-y-1 pt-2 border-t border-gray-100">
                      <Text className="text-xs font-semibold text-gray-500 uppercase">Productos</Text>
                          {rental.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.productName} ×{item.quantity}</span>
                          <span className="text-gray-400 text-xs">desde {format(new Date(item.addedDate), 'dd/MM/yy')}</span>
                        </div>
                          ))}
                        </div>

                    {/* Precio por día */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <Text className="text-xs text-gray-500">Precio/Día</Text>
                        <Text className="text-sm font-semibold text-blue-600">${dailyTotal.toLocaleString()}/día</Text>
                      </div>
                      <div className="text-right">
                        <Text className="text-xs text-gray-500">Acumulado</Text>
                        <Text className="text-sm font-semibold text-amber-600">${toDateTotal.toLocaleString()}</Text>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm text-gray-600">Devolución:</Text>
                        <span className="text-sm font-medium">{format(new Date(rental.returnDate), 'dd/MM/yyyy')}</span>
                        {(rental.status !== 'finalizado') && (
                          <button
                            onClick={() => openEditField(rental, 'returnDate', rental.returnDate)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      <div>
                        <Text className="text-xs text-gray-500">Total</Text>
                        <Text className="text-sm font-semibold">${(rental.totalPrice || 0).toLocaleString()}</Text>
                      </div>
                      <div>
                        <Text className="text-xs text-gray-500">Pagado</Text>
                        <div className="flex items-center gap-1">
                          <Text className="text-sm font-medium text-green-600">${(rental.pagado || 0).toLocaleString()}</Text>
                          <button onClick={() => openEditPaymentDialog(rental)} className="p-0.5 text-gray-400 hover:text-green-600">✏️</button>
                        </div>
                      </div>
                      <div>
                        <Text className="text-xs text-gray-500">Resto</Text>
                        <Text className="text-sm font-medium text-orange-600">${(rental.resto || 0).toLocaleString()}</Text>
                      </div>
                    </div>

                    {/* Notas preview */}
                    {rental.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <Text className="text-xs text-gray-500">Notas:</Text>
                        <Text className="text-sm text-gray-600 truncate">{rental.notes}</Text>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                          <button
                          onClick={() => openDetailsDialog(rental)}
                          className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                          >
                          🔍 Detalles
                          </button>
                        {(rental.status === 'iniciado' || rental.status === 'presupuestado') && (
                          <button
                            onClick={() => openBillingDialog(rental)}
                            className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
                          >
                            💲 Cobrar
                          </button>
                        )}
                      </div>
                      {nextAction && (
                          <button
                          onClick={() => handleStatusChange(rental.id, nextAction.nextStatus)}
                          className={`w-full px-3 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-sm ${
                            nextAction.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {nextAction.label}
                        </button>
                      )}
                      {rental.status === 'iniciado' && (
                        <>
                          <button onClick={() => openEditItemsDialog(rental)} className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all">
                            ✏️ Editar Productos
                          </button>
                          <button onClick={() => openPartialReturn(rental)} className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                            Devolución Parcial
                          </button>
                          <button onClick={() => handleFullReturn(rental.id)} className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm">
                            Devolver Todo
                          </button>
                        </>
                      )}
                      {rental.status === 'finalizado' && (
                        <button onClick={() => handleReactivate(rental.id)} className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm">
                          🔄 Reactivar Alquiler
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleGenerarRemito(rental)} className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all">
                          📄 Remito
                        </button>
                        <button onClick={() => handleGenerarRecibo(rental)} className="px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all">
                          💰 Recibo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* ============ MODAL: Nuevo Alquiler ============ */}
      {isDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsDialogOpen(false); }}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <Title className="text-xl font-bold mb-6">Nuevo Alquiler</Title>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
              <select
                value={selectedWorkId}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                required
              >
                <option value="">Seleccionar obra...</option>
                {obras.filter((o: any) => o.status === 'active').map((obra: any) => (
                    <option key={obra.id} value={obra.id}>{obra.name} - {obra.clientName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Productos Disponibles</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                {availableProducts.map((product: any) => (
                  <div key={product.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                    <div>
                      <Text className="font-medium text-sm">{product.name}</Text>
                        <Text className="text-xs text-gray-500">Stock: {product.stockActual} | ${product.price}/día</Text>
                    </div>
                      <button type="button" onClick={() => addItemToRental(product.id)} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {rentalItems.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionados</label>
                <div className="border border-gray-200 rounded-lg divide-y">
                  {rentalItems.map((item: any) => {
                    const product = products.find((p: any) => p.id === item.productId);
                    return (
                        <div key={item.productId} className="p-3 bg-blue-50 space-y-2">
                          <div className="flex items-center justify-between">
                          <Text className="font-medium text-sm">{item.productName}</Text>
                            <button type="button" onClick={() => removeItemFromRental(item.productId)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded">Quitar</button>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Cant:</span>
                            <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">-</button>
                            <input
                                type="number" min="1" max={product?.stockActual || 0} value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, Math.max(1, Math.min(product?.stockActual || 0, parseInt(e.target.value) || 1)))}
                                className="w-14 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none"
                            />
                            <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= (product?.stockActual || 0)} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">+</button>
                          </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">$/día:</span>
                              <input
                                type="number" min="0" value={item.dailyPrice}
                                onChange={(e) => updateItemDailyPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-20 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                        </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Fecha adición:</span>
                              <input
                                type="date"
                                value={item.addedDate ? new Date(item.addedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => updateItemAddedDate(item.productId, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <Text className="text-xs text-gray-500">Total: ${item.totalPrice.toLocaleString()}</Text>
                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Devolución</label>
              <input
                  type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} required
                className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={newRentalNotes} onChange={(e) => setNewRentalNotes(e.target.value)}
                  placeholder="Agregar notas o comentarios..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <Text className="font-medium text-gray-700">Total (presupuesto)</Text>
              <Text className="text-xl font-bold">${calculatedTotal.toLocaleString()}</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-500">Precio diario total</Text>
                  <Text className="text-sm font-semibold text-blue-600">${calculatedDailyTotal.toLocaleString()}/día</Text>
                </div>
                {returnDate && (
                  <div className="flex justify-between items-center">
                    <Text className="text-sm text-gray-500">Días hasta vencimiento</Text>
                    <Text className="text-sm font-semibold">{getDaysUntilReturn(returnDate)} días</Text>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm">Cancelar</button>
                <button type="submit" disabled={!selectedWorkId || rentalItems.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md disabled:opacity-50">Crear Alquiler</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Detalles ============ */}
      {isDetailsOpen && selectedRental && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsOpen(false); }}
        >
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <Title className="text-xl font-bold">Detalles del Alquiler</Title>
                <Text className="text-gray-500">{selectedRental.workName} - {selectedRental.clientName}</Text>
              </div>
              {getStatusBadge(selectedRental)}
            </div>

            <div className="space-y-5">
              {/* Info general */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-xs text-gray-500">Creado</Text>
                  <Text className="font-semibold text-sm">{format(new Date(selectedRental.createdAt), 'dd/MM/yyyy')}</Text>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-xs text-gray-500">Devolución</Text>
                  <Text className="font-semibold text-sm">{format(new Date(selectedRental.returnDate), 'dd/MM/yyyy')}</Text>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-xs text-gray-500">Días restantes</Text>
                  <Text className="font-semibold text-sm">{getDaysUntilReturn(selectedRental.returnDate)} días</Text>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-xs text-gray-500">Estado</Text>
                  <Text className="font-semibold text-sm capitalize">{selectedRental.status}</Text>
                </div>
              </div>

              {/* Montos */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Text className="text-xs text-blue-600">Total</Text>
                  <Text className="font-bold text-lg text-blue-700">${(selectedRental.totalPrice || 0).toLocaleString()}</Text>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Text className="text-xs text-green-600">Pagado</Text>
                  <Text className="font-bold text-lg text-green-700">${(selectedRental.pagado || 0).toLocaleString()}</Text>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <Text className="text-xs text-orange-600">Resto</Text>
                  <Text className="font-bold text-lg text-orange-700">${(selectedRental.resto || 0).toLocaleString()}</Text>
                </div>
              </div>

              {/* Precio diario y acumulado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <Text className="text-xs text-indigo-600">Precio/Día</Text>
                  <Text className="font-bold text-lg text-indigo-700">${calculateDailyTotal(selectedRental).toLocaleString()}/día</Text>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Text className="text-xs text-amber-600">Valor acumulado a hoy</Text>
                  <Text className="font-bold text-lg text-amber-700">${calculateToDateBilling(selectedRental).toLocaleString()}</Text>
                </div>
              </div>

              {/* Productos con detalle */}
              <div>
                <Text className="font-semibold text-gray-700 mb-2">Productos del Alquiler</Text>
                <div className="border border-gray-200 rounded-xl divide-y overflow-hidden">
                  {selectedRental.items.map((item: any, idx: number) => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const addedDate = new Date(item.addedDate);
                    const addedDateNormalized = new Date(addedDate.getFullYear(), addedDate.getMonth(), addedDate.getDate());
                    const daysSinceAdded = Math.max(1, differenceInDays(today, addedDateNormalized) + 1);
                    const dailyRate = (item.dailyPrice || item.unitPrice) * item.quantity;
                    const accumulated = daysSinceAdded * dailyRate;
                    return (
                      <div key={idx} className="p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <Text className="font-semibold text-sm">{item.productName}</Text>
                            <Text className="text-xs text-gray-500">Cantidad: {item.quantity} | Precio unitario: ${item.unitPrice.toLocaleString()}</Text>
                          </div>
                          <Badge color="blue" size="sm">${item.totalPrice.toLocaleString()}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          <div className="text-xs">
                            <span className="text-gray-400">Agregado:</span>
                            <span className="ml-1 font-medium">{format(new Date(item.addedDate), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">Días:</span>
                            <span className="ml-1 font-medium">{daysSinceAdded}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">$/día:</span>
                            <span className="ml-1 font-medium text-blue-600">${(item.dailyPrice || item.unitPrice).toLocaleString()} × {item.quantity} = ${dailyRate.toLocaleString()}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">Acumulado:</span>
                            <span className="ml-1 font-bold text-amber-600">${accumulated.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historial de Cobranzas */}
              <div>
                <Text className="font-semibold text-gray-700 mb-3">Historial de Cobranzas</Text>
                {selectedRental.paymentHistory && selectedRental.paymentHistory.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl divide-y overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 p-3 bg-gray-100 text-xs font-semibold text-gray-600">
                      <span className="col-span-1">Fecha</span>
                      <span className="text-center">Período</span>
                      <span className="text-center">Monto</span>
                      <span className="text-center">Notas</span>
                      <span className="text-right">Acción</span>
                    </div>
                    {selectedRental.paymentHistory.map((payment: any) => (
                      <div key={payment.id} className="grid grid-cols-5 gap-2 p-3 items-center text-sm">
                        <span className="col-span-1 text-gray-700">{format(new Date(payment.date), 'dd/MM/yyyy')}</span>
                        <span className="text-center text-gray-600 text-xs">
                          {format(new Date(payment.periodFrom), 'dd/MM/yyyy')} - {format(new Date(payment.periodTo), 'dd/MM/yyyy')}
                        </span>
                        <span className="text-center font-semibold text-green-600">${payment.amount.toLocaleString()}</span>
                        <span className="text-center text-gray-500 text-xs">{payment.notes || '-'}</span>
                        <span className="text-right">
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este registro de cobranza?')) {
                                // TODO: Implementar eliminación de pago
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Eliminar
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 border border-gray-200 rounded-xl">
                    <Text>No hay registros de cobranza</Text>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <Text className="font-semibold text-gray-700 mb-2">Notas</Text>
                <textarea
                  value={detailsNotes}
                  onChange={(e) => setDetailsNotes(e.target.value)}
                  placeholder="Agregar notas del alquiler..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveDetailsNotes}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                  >
                    Guardar Notas
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Cobrar / Calcular por fechas ============ */}
      {isBillingOpen && selectedRental && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsBillingOpen(false); }}
        >
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <Title className="text-xl font-bold mb-2">Calcular Cobro</Title>
            <Text className="text-gray-500 mb-6">{selectedRental.workName} - {selectedRental.clientName}</Text>

            <div className="space-y-5">
              {/* Modo de cálculo */}
              <div>
                <Text className="font-semibold text-gray-700 mb-2">Modo de Cálculo</Text>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      setBillingMode('vencimiento');
                      const returnDate = new Date(selectedRental.returnDate);
                      const nextMonth = new Date(returnDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setBillingDateFrom(selectedRental.returnDate.split('T')[0]);
                      setBillingDateTo(nextMonth.toISOString().split('T')[0]);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${billingMode === 'vencimiento' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Vencimiento
                  </button>
                  <button
                    onClick={() => setBillingMode('todate')}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${billingMode === 'todate' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Hasta hoy
                  </button>
                  <button
                    onClick={() => {
                      setBillingMode('month');
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${billingMode === 'month' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Mes actual
                  </button>
                  <button
                    onClick={() => setBillingMode('custom')}
                    className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${billingMode === 'custom' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {billingMode === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date" value={billingDateFrom} onChange={(e) => setBillingDateFrom(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date" value={billingDateTo} onChange={(e) => setBillingDateTo(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              )}

              {billingDetails && (
                <>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Período: {format(billingDetails.fromDate, 'dd/MM/yyyy')} - {format(billingDetails.toDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>

                  {/* Selector de tipo de descuento */}
                  <div>
                    <Text className="font-semibold text-gray-700 mb-2">Descuentos</Text>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setDiscountType('none');
                          setItemDiscounts({});
                          setTotalDiscount({ type: 'percent', value: 0 });
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${discountType === 'none' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Sin descuento
                      </button>
                      <button
                        onClick={() => setDiscountType('item')}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${discountType === 'item' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Por ítem
                      </button>
                      <button
                        onClick={() => setDiscountType('total')}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${discountType === 'total' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Sobre el total
                      </button>
                    </div>
                  </div>

                  {/* Detalle por producto */}
                  <div className="border border-gray-200 rounded-xl divide-y overflow-hidden">
                    <div className={`grid gap-2 p-3 bg-gray-100 text-xs font-semibold text-gray-600 ${discountType === 'item' ? 'grid-cols-7' : 'grid-cols-5'}`}>
                      <span className="col-span-1">Producto</span>
                      <span className="text-center">Cant.</span>
                      <span className="text-center">Precio/día</span>
                      <span className="text-center">Días</span>
                      {discountType === 'item' && (
                        <>
                          <span className="text-center">Descuento</span>
                          <span className="text-right">Subtotal</span>
                        </>
                      )}
                      <span className="text-right">Total</span>
                    </div>
                    {billingDetails.items.map((item: any, idx: number) => {
                      const unitDailyPrice = item.dailyPrice || item.unitPrice;
                      const totalDailyPrice = unitDailyPrice * item.quantity;
                      const itemDiscount = itemDiscounts[item.productId] || { type: 'percent', value: 0 };
                      
                      return (
                        <div key={idx} className={`grid gap-2 p-3 items-center text-sm ${discountType === 'item' ? 'grid-cols-7' : 'grid-cols-5'}`}>
                          <span className="col-span-1 font-medium text-gray-800 truncate">{item.productName}</span>
                          <span className="text-center text-gray-600">{item.quantity}</span>
                          <span className="text-center text-blue-600 text-xs">
                            <div>${unitDailyPrice.toLocaleString()}/un</div>
                            <div className="font-semibold">${totalDailyPrice.toLocaleString()}/día</div>
                          </span>
                          <span className="text-center text-gray-600">{item.days}</span>
                          {discountType === 'item' && (
                            <div className="flex gap-1 items-center">
                              <select
                                value={itemDiscount.type}
                                onChange={(e) => {
                                  setItemDiscounts({
                                    ...itemDiscounts,
                                    [item.productId]: { ...itemDiscount, type: e.target.value as 'percent' | 'amount' }
                                  });
                                }}
                                className="w-16 text-xs rounded border border-gray-300 px-1 py-1"
                              >
                                <option value="percent">%</option>
                                <option value="amount">$</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                max={itemDiscount.type === 'percent' ? 100 : item.subtotal}
                                step={itemDiscount.type === 'percent' ? 1 : 0.01}
                                value={itemDiscount.value || 0}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setItemDiscounts({
                                    ...itemDiscounts,
                                    [item.productId]: { ...itemDiscount, value }
                                  });
                                }}
                                className="w-20 text-xs rounded border border-gray-300 px-2 py-1"
                                placeholder="0"
                              />
                            </div>
                          )}
                          {discountType === 'item' && (
                            <span className="text-right text-sm text-gray-600">
                              ${item.subtotal.toLocaleString()}
                              {item.discount > 0 && (
                                <span className="block text-xs text-red-600">-${item.discount.toLocaleString()}</span>
                              )}
                            </span>
                          )}
                          <span className="text-right font-semibold text-gray-900">
                            ${item.total.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Descuento sobre el total */}
                  {discountType === 'total' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <Text className="font-semibold text-gray-700 mb-3">Descuento sobre el Total</Text>
                      <div className="flex gap-3 items-center">
                        <select
                          value={totalDiscount.type}
                          onChange={(e) => {
                            setTotalDiscount({ ...totalDiscount, type: e.target.value as 'percent' | 'amount' });
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="percent">Porcentaje (%)</option>
                          <option value="amount">Monto fijo ($)</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max={totalDiscount.type === 'percent' ? 100 : billingDetails.subtotal}
                          step={totalDiscount.type === 'percent' ? 1 : 0.01}
                          value={totalDiscount.value || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setTotalDiscount({ ...totalDiscount, value });
                          }}
                          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          placeholder={totalDiscount.type === 'percent' ? '0%' : '$0'}
                        />
                      </div>
                      {billingDetails.totalDiscount > 0 && (
                        <div className="mt-3 pt-3 border-t border-yellow-300">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">${billingDetails.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Descuento:</span>
                            <span className="font-semibold">-${billingDetails.totalDiscount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Text className="font-bold text-lg text-blue-900">Total a Cobrar</Text>
                        <Text className="text-xs text-blue-600">
                          {discountType === 'none' 
                            ? '(Precio unitario/día × cantidad × días transcurridos desde adición de cada producto)'
                            : discountType === 'item'
                            ? '(Subtotal con descuentos por ítem aplicados)'
                            : '(Subtotal con descuento sobre el total aplicado)'}
                        </Text>
                      </div>
                      <div className="text-right">
                        {billingDetails.subtotal !== billingDetails.grandTotal && (
                          <Text className="text-sm text-gray-500 line-through">
                            ${billingDetails.subtotal.toLocaleString()}
                          </Text>
                        )}
                        <Text className="text-2xl font-bold text-blue-700">${billingDetails.grandTotal.toLocaleString()}</Text>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-sm">
                      <span className="text-blue-700">Ya pagado: ${(selectedRental.pagado || 0).toLocaleString()}</span>
                      <span className="font-semibold text-blue-900">
                        Pendiente: ${Math.max(0, billingDetails.grandTotal - (selectedRental.pagado || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setIsBillingOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  Cerrar
                </button>
                {billingDetails && (
                  <button
                    onClick={() => {
                      recordRentalPayment(
                        selectedRental.id,
                        billingDetails.grandTotal,
                        billingDetails.fromDate.toISOString(),
                        billingDetails.toDate.toISOString()
                      );
                      setIsBillingOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md"
                  >
                    Registrar Cobro Total (${billingDetails.grandTotal.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Devolución Parcial ============ */}
      {isPartialReturnOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsPartialReturnOpen(false); }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-6">Devolución Parcial</Title>
          {selectedRental && (
            <div className="space-y-4">
              <Text className="text-gray-600 text-sm">Cantidad a devolver:</Text>
              <div className="space-y-2">
                {selectedRental.items.map((item: any, idx: number) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Text className="font-medium text-sm">{item.productName}</Text>
                      <Text className="text-xs text-gray-500">Alquilado: {item.quantity}</Text>
                    </div>
                    <input
                        type="number" min="0" max={item.quantity}
                      value={partialReturnItems[idx]?.quantity || 0}
                      onChange={(e) => {
                        const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                        setPartialReturnItems(prev => prev.map((p, i) => i === idx ? { ...p, quantity: val } : p));
                      }}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                  <button onClick={() => setIsPartialReturnOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                  <button onClick={handlePartialReturn} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md">Confirmar</button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ============ MODAL: Editar Fecha ============ */}
      {isEditFieldOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditFieldOpen(false); }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-4">Editar fecha de devolución</Title>
            <div className="space-y-4">
              <input
                type="date" value={editField.value} onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
              />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setIsEditFieldOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                <button onClick={handleEditField} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Editar Productos ============ */}
      {isEditItemsOpen && selectedRental && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditItemsOpen(false); }}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <Title className="text-xl font-bold mb-6">Editar Productos - {selectedRental.workName}</Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Productos Disponibles</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                  {availableProducts.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                      <div>
                        <Text className="font-medium text-sm">{product.name}</Text>
                        <Text className="text-xs text-gray-500">Stock: {product.stockActual} | ${product.price}/día</Text>
                      </div>
                      <button type="button" onClick={() => addItemToEditingRental(product.id)} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {editingRentalItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Productos del Alquiler</label>
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {editingRentalItems.map((item: any, itemIndex: number) => {
                      const product = products.find((p: any) => p.id === item.productId);
                      // Calcular stock disponible para este producto (total stock - cantidad ya en otros items del mismo producto)
                      const totalQuantityInRental = editingRentalItems
                        .filter((i, idx) => i.productId === item.productId && idx !== itemIndex)
                        .reduce((sum, i) => sum + i.quantity, 0);
                      const availableStock = (product?.stockActual || 0) - totalQuantityInRental;
                      
                      return (
                        <div key={`${item.productId}-${itemIndex}-${item.addedDate}`} className="p-3 bg-blue-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <Text className="font-medium text-sm">{item.productName}</Text>
                            <button type="button" onClick={() => removeItemFromEditingRental(itemIndex)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded">Quitar</button>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Cant:</span>
                              <button type="button" onClick={() => updateEditingItemQuantity(itemIndex, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">-</button>
                              <input
                                type="number" min="1" max={availableStock + item.quantity} value={item.quantity}
                                onChange={(e) => updateEditingItemQuantity(itemIndex, Math.max(1, Math.min(availableStock + item.quantity, parseInt(e.target.value) || 1)))}
                                className="w-14 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                              <button type="button" onClick={() => updateEditingItemQuantity(itemIndex, item.quantity + 1)} disabled={item.quantity >= (availableStock + item.quantity)} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">+</button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">$/día:</span>
                              <input
                                type="number" min="0" value={item.dailyPrice || item.unitPrice}
                                onChange={(e) => updateEditingItemDailyPrice(itemIndex, parseFloat(e.target.value) || 0)}
                                className="w-20 text-sm text-center border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                          </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Fecha adición:</span>
                              <input
                                type="date"
                                value={item.addedDate ? new Date(item.addedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => updateEditingItemAddedDate(itemIndex, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <Text className="text-xs text-gray-500">Total: ${item.totalPrice.toLocaleString()}</Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <Text className="font-medium text-gray-700">Total</Text>
                <Text className="text-xl font-bold">${editingRentalItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0).toLocaleString()}</Text>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsEditItemsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                <button type="button" onClick={handleUpdateItems} disabled={editingRentalItems.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md disabled:opacity-50">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Editar Pago ============ */}
      {isEditPaymentOpen && selectedRental && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditPaymentOpen(false); }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-4">Editar Pago - {selectedRental.workName}</Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total del Alquiler</label>
                <Text className="text-lg font-bold">${(selectedRental.totalPrice || 0).toLocaleString()}</Text>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pagado</label>
                <TextInput
                  type="number" min="0" max={selectedRental.totalPrice || 0}
                  value={pagado.toString()}
                  onChange={(e) => setPagado(Math.max(0, Math.min(selectedRental.totalPrice || 0, parseFloat(e.target.value) || 0)))}
                  className="pl-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resto</label>
                <Text className="text-lg font-semibold text-orange-600">${((selectedRental.totalPrice || 0) - pagado).toLocaleString()}</Text>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setIsEditPaymentOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                <button onClick={handleUpdatePayment} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Reactivar ============ */}
      {isReactivateOpen && selectedRental && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsReactivateOpen(false); }}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-auto">
            <Title className="text-xl font-bold mb-4">Stock Insuficiente - {selectedRental.workName}</Title>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <Text className="text-yellow-800 text-sm font-medium">
                  No hay stock suficiente para reactivar este alquiler. Se agregarán los siguientes productos:
                </Text>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos a Agregar</label>
                <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
                  {missingProducts.map((missing) => (
                    <div key={missing.productId} className="p-3 bg-blue-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text className="font-medium text-sm">{missing.productName}</Text>
                          <Text className="text-xs text-gray-500">Necesario: {missing.needed} | Actual: {missing.current} | Faltante: {missing.missing}</Text>
                        </div>
                        <Badge color="blue" size="sm">+{missing.missing}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button onClick={() => setIsReactivateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">Cancelar</button>
                <button onClick={handleAddMissingProducts} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md">Agregar Productos y Reactivar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Traslado entre Obras ============ */}
      {isTransferOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ minHeight: '100vh', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsTransferOpen(false); }}
        >
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
            <Title className="text-xl font-bold mb-4">Traslado entre Obras</Title>
            
            <div className="space-y-5">
              {/* Selección de obras */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Obra Origen</label>
                  <select
                    value={transferFromObra}
                    onChange={(e) => {
                      setTransferFromObra(e.target.value);
                      setTransferItems([]);
                    }}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar obra...</option>
                    {obras.filter((o: any) => o.status === 'active').map((obra: any) => (
                      <option key={obra.id} value={obra.id}>{obra.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Obra Destino</label>
                  <select
                    value={transferToObra}
                    onChange={(e) => setTransferToObra(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccionar obra...</option>
                    {obras.filter((o: any) => o.status === 'active' && o.id !== transferFromObra).map((obra: any) => (
                      <option key={obra.id} value={obra.id}>{obra.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Productos disponibles en obra origen */}
              {transferFromObra && (
                <div>
                  <Text className="font-semibold text-gray-700 mb-3">Productos Disponibles en Obra Origen</Text>
                  {(() => {
                    const fromRental = rentals.find((r: any) => r.workId === transferFromObra && r.status === 'iniciado');
                    if (!fromRental || fromRental.items.length === 0) {
                      return <Text className="text-gray-500 text-sm">No hay productos en esta obra</Text>;
                    }
                    return (
                      <div className="border border-gray-200 rounded-xl divide-y max-h-60 overflow-y-auto">
                        {fromRental.items.map((item: any) => {
                          const existingTransfer = transferItems.find((ti: any) => ti.productId === item.productId);
                          const currentTransferQty = existingTransfer?.quantity || 0;
                          const availableQuantity = item.quantity; // Cantidad total disponible
                          const remainingQuantity = availableQuantity - currentTransferQty;
                          return (
                            <div key={item.productId} className="p-3 flex justify-between items-center">
                              <div className="flex-1">
                                <Text className="font-medium text-sm">{item.productName}</Text>
                          <Text className="text-xs text-gray-500">
                                  Total: {availableQuantity} | Trasladando: {currentTransferQty} | Disponible: {remainingQuantity}
                          </Text>
                        </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={availableQuantity}
                                  value={currentTransferQty}
                                  onChange={(e) => {
                                    const qty = Math.max(0, Math.min(availableQuantity, parseInt(e.target.value) || 0));
                                    if (qty === 0) {
                                      setTransferItems(transferItems.filter((ti: any) => ti.productId !== item.productId));
                                    } else {
                                      const existing = transferItems.find((ti: any) => ti.productId === item.productId);
                                      if (existing) {
                                        setTransferItems(transferItems.map((ti: any) => 
                                          ti.productId === item.productId ? { ...ti, quantity: qty } : ti
                                        ));
                                      } else {
                                        setTransferItems([...transferItems, {
                                          productId: item.productId,
                                          productName: item.productName,
                                          quantity: qty,
                                        }]);
                                      }
                                    }
                                  }}
                                  className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center"
                                />
                                <span className="text-xs text-gray-500">uds</span>
                      </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Resumen del traslado */}
              {transferItems.length > 0 && transferFromObra && transferToObra && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <Text className="font-semibold text-blue-900 mb-2">Resumen del Traslado</Text>
                  <div className="space-y-2">
                    {transferItems.map((item: any) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{item.productName}</span>
                        <span className="font-semibold">{item.quantity} unidades</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsTransferOpen(false);
                    setTransferFromObra('');
                    setTransferToObra('');
                    setTransferItems([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                {transferFromObra && transferToObra && transferItems.length > 0 && (
                <button
                    onClick={async () => {
                      try {
                        // Validar que no se trasladen más productos de los disponibles
                        const fromRental = rentals.find((r: any) => r.workId === transferFromObra && r.status === 'iniciado');
                        if (!fromRental) {
                          alert('No se encontró el alquiler de la obra origen');
                          return;
                        }

                        const invalidItems = transferItems.filter((transferItem: any) => {
                          const rentalItem = fromRental.items.find((item: any) => item.productId === transferItem.productId);
                          if (!rentalItem) return true;
                          return transferItem.quantity > rentalItem.quantity;
                        });

                        if (invalidItems.length > 0) {
                          alert(`No se pueden trasladar más productos de los disponibles:\n${invalidItems.map((item: any) => `- ${item.productName}: cantidad solicitada excede lo disponible`).join('\n')}`);
                          return;
                        }

                        // Realizar el traslado
                        transferStockBetweenObras(transferFromObra, transferToObra, transferItems);

                        // Obtener datos de las obras
                        const fromObra = obras.find((o: any) => o.id === transferFromObra);
                        const toObra = obras.find((o: any) => o.id === transferToObra);
                        const fromClient = clients.find((c: any) => c.id === fromObra?.clientId);
                        const toClient = clients.find((c: any) => c.id === toObra?.clientId);

                        // Generar remito de entrega (obra origen)
                        const remitoEntrega: RemitoData = {
                          fecha: format(new Date(), 'dd/MM/yyyy'),
                          cliente: fromClient?.name || fromObra?.clientName || '',
                          direccion: fromClient?.address || fromObra?.address || '',
                          localidad: fromObra?.address || '',
                          items: transferItems.map((item: any) => ({
                            cantidad: item.quantity,
                            descripcion: item.productName,
                          })),
                          transportista: toObra?.name || '',
                          Domicilio: toObra?.address || '',
                        };
                        const pdfEntrega = await generarRemito(remitoEntrega);
                        descargarPDF(pdfEntrega, `remito-entrega-${fromObra?.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);

                        // Generar remito de recepción (obra destino)
                        const remitoRecepcion: RemitoData = {
                          fecha: format(new Date(), 'dd/MM/yyyy'),
                          cliente: toClient?.name || toObra?.clientName || '',
                          direccion: toClient?.address || toObra?.address || '',
                          localidad: toObra?.address || '',
                          items: transferItems.map((item: any) => ({
                            cantidad: item.quantity,
                            descripcion: item.productName,
                          })),
                          transportista: fromObra?.name || '',
                          Domicilio: fromObra?.address || '',
                        };
                        const pdfRecepcion = await generarRemito(remitoRecepcion);
                        descargarPDF(pdfRecepcion, `remito-recepcion-${toObra?.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);

                        // Cerrar modal y limpiar
                        setIsTransferOpen(false);
                        setTransferFromObra('');
                        setTransferToObra('');
                        setTransferItems([]);
                        alert('Traslado realizado exitosamente. Los remitos se han descargado.');
                      } catch (error) {
                        console.error('Error al realizar traslado:', error);
                        alert('Error al realizar el traslado. Verifica los datos.');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md"
                  >
                    Realizar Traslado y Generar Remitos
                </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

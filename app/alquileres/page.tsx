'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { format, addMonths } from 'date-fns';
import {
  billItem,
  billItemToDate,
  dailyFromMonthly,
  dayKey,
  dayToIso,
  formatPeriod,
  monthlyFromDaily,
  periodStart,
  toDay,
  todayKey,
} from '@/lib/rental-billing';
import { generarRemito, generarRecibo, descargarPDF, RemitoData, ReciboData } from '@/app/utils/pdfGenerator';
import { itemBudget } from '@/lib/rental-totals';
import { ActionButton, ActionMenu, IconButton, Icons, RowAction } from '@/components/rentals/RentalActions';

/** Quitar flechas nativas de input[type=number] en navegadores WebKit. */
const hideNumberSpinners =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

/** Inputs numéricos sin flechas del navegador; edición libre con validación al perder foco / enviar. */
const freeIntInputCls =
  `min-w-[4.5rem] w-24 text-sm text-center border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none ${hideNumberSpinners}`;
const freeDecimalInputCls =
  `min-w-[5rem] w-28 text-sm text-center border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none ${hideNumberSpinners}`;

/** Solo dígitos, permite vacío */
const isLooseIntString = (s: string) => /^\d*$/.test(s);
/** Decimal parcial para edición cómoda */
const isLooseDecimalString = (s: string) => /^-?\d*[.,]?\d*$/.test(s);

const fmtMoney = (n: number) => (n === 0 ? '' : String(Math.round(n * 100) / 100));

/** Input de precio con borrador propio: edición libre, se confirma al perder foco. */
function MoneyInput({ value, onCommit, title }: { value: number; onCommit: (n: number) => void; title?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      title={title}
      value={draft ?? fmtMoney(value)}
      onChange={(e) => {
        if (isLooseDecimalString(e.target.value)) setDraft(e.target.value);
      }}
      onBlur={() => {
        if (draft === null) return;
        const n = parseFloat(draft.trim().replace(',', '.'));
        onCommit(Number.isNaN(n) ? 0 : Math.max(0, n));
        setDraft(null);
      }}
      className={freeDecimalInputCls}
    />
  );
}

/** Par $/mes ↔ $/día: el cliente cotiza por mes; el diario se deriva (mes / 30) y viceversa. */
function PricePairInputs({ dailyPrice, onDailyChange }: { dailyPrice: number; onDailyChange: (d: number) => void }) {
  return (
    <>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">$/mes:</span>
        <MoneyInput
          value={monthlyFromDaily(dailyPrice)}
          onCommit={(m) => onDailyChange(dailyFromMonthly(m))}
          title="Precio mensual por unidad"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">$/día:</span>
        <MoneyInput value={dailyPrice} onCommit={onDailyChange} title="Precio diario por unidad (mes / 30)" />
      </div>
    </>
  );
}

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
  const deleteRental = useStore((state: any) => state.deleteRental);
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
  const [pagadoInputStr, setPagadoInputStr] = useState('');
  const [newRentalNotes, setNewRentalNotes] = useState('');
  /** Borradores para mostrar '' mientras se edita (nuevo alquiler, por productId) */
  const [newRentalQtyDraft, setNewRentalQtyDraft] = useState<Record<string, string>>({});
  const [editingQtyStrs, setEditingQtyStrs] = useState<string[]>([]);
  const [partialReturnQtyStrs, setPartialReturnQtyStrs] = useState<string[]>([]);
  const [transferQtyDraft, setTransferQtyDraft] = useState<Record<string, string>>({});
  const [billingItemDiscountStr, setBillingItemDiscountStr] = useState<Record<string, string>>({});
  const [billingTotalDiscountStr, setBillingTotalDiscountStr] = useState('');
  const [rentalToDelete, setRentalToDelete] = useState<any>(null);
  const [deletePhraseInput, setDeletePhraseInput] = useState('');
  const [deleteRentalLoading, setDeleteRentalLoading] = useState(false);

  // Details modal
  const [detailsNotes, setDetailsNotes] = useState('');
  const autoStartedRef = useRef<Set<string>>(new Set());

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
        matchesDate = toDay(rental.returnDate) >= toDay(dateFrom);
      }
      if (dateTo && matchesDate) {
        matchesDate = toDay(rental.returnDate) <= toDay(dateTo);
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
    const daysUntil = Math.round((toDay(r.returnDate).getTime() - toDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0;
  }).length;

  // ========== Calculation helpers ==========
  
  const calculateDailyTotal = (rental: any) => {
    return rental.items.reduce((sum: number, item: any) => {
      return sum + (item.dailyPrice || item.unitPrice) * item.quantity;
    }, 0);
  };

  const calculateToDateBilling = (rental: any) =>
    rental.items.reduce((sum: number, item: any) => sum + billItemToDate(item).total, 0);

  /** Período "Vencimiento": desde la adición más antigua hasta la fecha de devolución que cargó el usuario. */
  const vencimientoPeriod = (rental: any) => ({
    from: periodStart(rental),
    to: toDay(rental.returnDate),
  });

  // ========== Dialog openers ==========

  const openAddDialog = () => {
    setSelectedWorkId('');
    setRentalItems([]);
    setReturnDate('');
    setPagado(0);
    setNewRentalNotes('');
    setNewRentalQtyDraft({});
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
    const { from, to } = vencimientoPeriod(rental);
    setBillingDateFrom(dayKey(from));
    setBillingDateTo(dayKey(to));
    setDiscountType('none');
    setItemDiscounts({});
    setTotalDiscount({ type: 'percent', value: 0 });
    setBillingItemDiscountStr({});
    setBillingTotalDiscountStr('');
    setIsBillingOpen(true);
  };

  const openEditItemsDialog = (rental: any) => {
    setSelectedRental(rental);
    const items = rental.items.map((item: any) => ({ ...item }));
    setEditingRentalItems(items);
    setEditingQtyStrs(items.map((i: any) => (i.quantity === 0 ? '' : String(i.quantity))));
    setIsEditItemsOpen(true);
  };

  const openEditPaymentDialog = (rental: any) => {
    setSelectedRental(rental);
    const p = rental.pagado || 0;
    setPagado(p);
    setPagadoInputStr(p === 0 ? '' : String(p));
    setIsEditPaymentOpen(true);
  };

  const openPartialReturn = (rental: any) => {
    setSelectedRental(rental);
    setPartialReturnItems(rental.items.map((item: any) => ({ productId: item.productId, quantity: 0 })));
    setPartialReturnQtyStrs(rental.items.map(() => ''));
    setIsPartialReturnOpen(true);
  };

  const openEditField = (rental: any, field: string, value: any) => {
    setSelectedRental(rental);
    // <input type="date"> necesita YYYY-MM-DD; con el ISO completo quedaba vacío
    setEditField({ field, value: field === 'returnDate' && value ? dayKey(value) : value });
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
          addedDate: dayToIso(todayKey()),
        }]);
      }
    }
    setNewRentalQtyDraft((d) => {
      const next = { ...d };
      delete next[productId];
      return next;
    });
  };

  const removeItemFromRental = (productId: string) => {
    setRentalItems(rentalItems.filter((item) => item.productId !== productId));
    setNewRentalQtyDraft((d) => {
      const next = { ...d };
      delete next[productId];
      return next;
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    const q = Math.floor(quantity);
    if (q < 0) return;
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: q, totalPrice: q * item.unitPrice }
          : item
      )
    );
  };

  const clampNewRentalItemQuantity = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    const item = rentalItems.find((i) => i.productId === productId);
    if (!product || !item) return;
    const maxQty = Math.max(0, product.stockActual);
    const q = Math.max(1, Math.min(maxQty, item.quantity));
    if (q !== item.quantity) {
      setRentalItems(
        rentalItems.map((it) =>
          it.productId === productId
            ? { ...it, quantity: q, totalPrice: q * it.unitPrice }
            : it
        )
      );
    }
  };

  const updateItemDailyPrice = (productId: string, dailyPrice: number) => {
    if (!Number.isFinite(dailyPrice)) return;
    const d = Math.max(0, dailyPrice);
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, dailyPrice: d }
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

  /** Presupuesto real: cada ítem desde su adición hasta la devolución (antes era cantidad × precio, sin período). */
  const calculatedTotal = useMemo(
    () => (returnDate ? rentalItems.reduce((sum, item) => sum + itemBudget(item, returnDate), 0) : 0),
    [rentalItems, returnDate]
  );
  const calculatedDailyTotal = useMemo(() => rentalItems.reduce((sum, item) => sum + (item.dailyPrice || item.unitPrice) * item.quantity, 0), [rentalItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId || rentalItems.length === 0 || !returnDate) return;

    for (const item of rentalItems) {
      if (item.quantity < 1) {
        alert(`La cantidad de "${item.productName}" debe ser al menos 1.`);
        return;
      }
      const effectiveDaily = item.dailyPrice ?? item.unitPrice;
      if (effectiveDaily <= 0) {
        alert(`El precio por día de "${item.productName}" debe ser mayor que 0.`);
        return;
      }
      const p = products.find((x: any) => x.id === item.productId);
      if (!p || item.quantity > p.stockActual) {
        alert(
          `Revisa las cantidades: "${item.productName}" no puede superar el stock disponible (${p?.stockActual ?? 0} uds.).`
        );
        return;
      }
    }
    
    // Obtener el clientId de la obra seleccionada
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
    for (let idx = 0; idx < editingRentalItems.length; idx++) {
      const item = editingRentalItems[idx];
      if (item.quantity < 1) {
        alert(`La cantidad de "${item.productName}" debe ser al menos 1.`);
        return;
      }
      const effectiveDaily = item.dailyPrice ?? item.unitPrice;
      if (effectiveDaily <= 0) {
        alert(`El precio por día de "${item.productName}" debe ser mayor que 0.`);
        return;
      }
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) continue;
      const totalOthers = editingRentalItems
        .filter((i, iidx) => i.productId === item.productId && iidx !== idx)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (item.quantity + totalOthers > product.stockActual) {
        alert(`La cantidad de "${item.productName}" supera el stock disponible para ese producto.`);
        return;
      }
    }
    updateRentalItems(selectedRental.id, editingRentalItems);
    setIsEditItemsOpen(false);
  };

  const handleUpdatePayment = () => {
    if (!selectedRental) return;
    const cap = selectedRental.totalPrice || 0;
    const raw = String(pagadoInputStr).trim().replace(',', '.');
    const n = parseFloat(raw);
    const pagadoVal = raw === '' || Number.isNaN(n) ? 0 : Math.max(0, Math.min(cap, n));
    updateRentalPayment(selectedRental.id, pagadoVal);
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
      const todayStr = todayKey(); // fecha local (toISOString daba el día siguiente después de las 21hs)

      setEditingRentalItems([...editingRentalItems, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        dailyPrice: product.price,
        totalPrice: product.price,
        addedDate: new Date(todayStr).toISOString(), // Fecha actual como fecha de adición
      }]);
      setEditingQtyStrs((s) => [...s, '1']);
    }
  };

  const removeItemFromEditingRental = (itemIndex: number) => {
    setEditingRentalItems(editingRentalItems.filter((_, index) => index !== itemIndex));
    setEditingQtyStrs((s) => s.filter((_, i) => i !== itemIndex));
  };

  const updateEditingItemDailyPrice = (itemIndex: number, dailyPrice: number) => {
    if (!Number.isFinite(dailyPrice)) return;
    const d = Math.max(0, dailyPrice);
    setEditingRentalItems(
      editingRentalItems.map((item, idx) =>
        idx === itemIndex
          ? { ...item, dailyPrice: d }
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

  const openDeleteRentalModal = (rental: any) => {
    setRentalToDelete(rental);
    setDeletePhraseInput('');
  };

  const closeDeleteRentalModal = () => {
    if (deleteRentalLoading) return;
    setRentalToDelete(null);
    setDeletePhraseInput('');
  };

  const executeDeleteRental = async () => {
    if (!rentalToDelete) return;
    if (deletePhraseInput.trim() !== 'ELIMINAR') {
      alert('Escriba exactamente ELIMINAR (mayúsculas) para confirmar.');
      return;
    }
    setDeleteRentalLoading(true);
    try {
      await deleteRental(rentalToDelete.id);
      setRentalToDelete(null);
      setDeletePhraseInput('');
      setIsDetailsOpen(false);
      setSelectedRental(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el alquiler');
    } finally {
      setDeleteRentalLoading(false);
    }
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
    return Math.round((toDay(returnDateStr).getTime() - toDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
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

  /**
   * Una sola fuente de verdad para las acciones de cada fila (desktop y mobile).
   * `primary`: las 1-2 acciones del próximo paso lógico; `menu`: el resto, en el "⋯".
   */
  const getRowActions = (rental: any): { primary: RowAction[]; menu: RowAction[] } => {
    const next = getNextStatusAction(rental);
    const primary: RowAction[] = [];
    const menu: RowAction[] = [];

    if (next) {
      primary.push({
        key: 'next',
        label: next.label,
        icon: next.nextStatus === 'presupuestado' ? Icons.clipboard : Icons.play,
        tone: next.color === 'blue' ? 'primary' : 'success',
        onClick: () => handleStatusChange(rental.id, next.nextStatus),
      });
    }
    if (rental.status === 'iniciado' || rental.status === 'presupuestado') {
      primary.push({ key: 'bill', label: 'Cobrar', icon: Icons.dollar, tone: 'warning', onClick: () => openBillingDialog(rental) });
    }
    if (rental.status === 'finalizado') {
      primary.push({ key: 'reactivate', label: 'Reactivar', icon: Icons.refresh, tone: 'primary', onClick: () => handleReactivate(rental.id) });
    }

    menu.push({ key: 'details', label: 'Ver detalles', icon: Icons.eye, onClick: () => openDetailsDialog(rental) });
    if (rental.status === 'iniciado') {
      menu.push(
        { key: 'items', label: 'Editar productos', icon: Icons.box, onClick: () => openEditItemsDialog(rental) },
        { key: 'partial', label: 'Devolución parcial', icon: Icons.undo, onClick: () => openPartialReturn(rental) },
        { key: 'return', label: 'Devolver todo', icon: Icons.check, onClick: () => handleFullReturn(rental.id) },
      );
    }
    menu.push(
      { key: 'remito', label: 'Generar remito', icon: Icons.file, onClick: () => handleGenerarRemito(rental) },
      { key: 'recibo', label: 'Generar recibo', icon: Icons.receipt, onClick: () => handleGenerarRecibo(rental) },
      { key: 'delete', label: 'Eliminar alquiler', icon: Icons.trash, tone: 'danger', onClick: () => openDeleteRentalModal(rental) },
    );
    return { primary, menu };
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
    // Antes comparaba contra createdAt, que SIEMPRE es hoy o pasado → todo presupuesto se iniciaba al instante.
    // Ahora: se inicia cuando llega la fecha de inicio real (la adición más antigua de sus productos).
    const checkAutoStart = () => {
      const today = toDay(new Date());
      rentals.forEach((rental: any) => {
        if (rental.status !== 'presupuestado' || autoStartedRef.current.has(rental.id)) return;
        if (today >= periodStart(rental)) {
          autoStartedRef.current.add(rental.id); // evita disparar el PUT repetido cada minuto
          updateRentalStatus(rental.id, 'iniciado');
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
    
    // Todos los períodos son [desde, hasta): el día "hasta" no se cobra (18/11 → 18/12 = 1 mes).
    if (billingMode === 'vencimiento') {
      ({ from: fromDate, to: toDate } = vencimientoPeriod(selectedRental));
    } else if (billingMode === 'todate') {
      fromDate = periodStart(selectedRental);
      toDate = toDay(new Date());
    } else if (billingMode === 'month') {
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = addMonths(fromDate, 1);
    } else {
      fromDate = billingDateFrom ? toDay(billingDateFrom) : periodStart(selectedRental);
      toDate = billingDateTo ? toDay(billingDateTo) : toDay(new Date());
    }

    const items = selectedRental.items.map((item: any) => {
      const billing = billItem(item, fromDate, toDate);
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
            onClick={() => {
              setTransferQtyDraft({});
              setIsTransferOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            {Icons.refresh}
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
                    <TableHeaderCell className="text-left">Precio</TableHeaderCell>
                    <TableHeaderCell className="text-left">F. Devolución</TableHeaderCell>
                <TableHeaderCell className="text-left">Total</TableHeaderCell>
                <TableHeaderCell className="text-left">Pagado</TableHeaderCell>
                <TableHeaderCell className="text-left">Resto</TableHeaderCell>
                <TableHeaderCell className="text-left">Estado</TableHeaderCell>
                <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>
                <TableBody>
                  {filteredRentals.map((rental: any) => {
                    const dailyTotal = calculateDailyTotal(rental);
                    const toDateTotal = calculateToDateBilling(rental);
                    const actions = getRowActions(rental);
                    return (
                  <TableRow key={rental.id}>
                        <TableCell className="font-medium text-sm">
                          <button type="button" onClick={() => openDetailsDialog(rental)} className="text-left hover:text-blue-600 hover:underline underline-offset-2" title="Ver detalles">
                            {rental.workName}
                          </button>
                        </TableCell>
                    <TableCell className="text-gray-600 text-sm">{rental.clientName}</TableCell>
                    <TableCell>
                          <div className="space-y-1">
                            {rental.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600">
                                <span className="font-medium">{item.productName}</span> ×{item.quantity}
                                <span className="text-gray-400 ml-1">
                                  (desde {format(toDay(item.addedDate), 'dd/MM')})
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-semibold text-blue-600">${monthlyFromDaily(dailyTotal).toLocaleString()}/mes</span>
                            <div className="text-xs text-gray-400 mt-0.5">
                              ${(Math.round(dailyTotal * 100) / 100).toLocaleString()}/día · Acumulado: ${toDateTotal.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{format(toDay(rental.returnDate), 'dd/MM/yyyy')}</span>
                            {(rental.status === 'iniciado' || rental.status === 'presupuestado' || rental.status === 'sin presupuestar') && (
                              <IconButton icon={Icons.pencil} label="Editar fecha de devolución" onClick={() => openEditField(rental, 'returnDate', rental.returnDate)} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm">${(rental.totalPrice || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-green-600 text-sm">${(rental.pagado || 0).toLocaleString()}</span>
                            <IconButton icon={Icons.pencil} label="Editar pago" onClick={() => openEditPaymentDialog(rental)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-orange-600 text-sm">${(rental.resto || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(rental)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            {actions.primary.map((a) => <ActionButton key={a.key} action={a} />)}
                            <ActionMenu actions={actions.menu} />
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
                const actions = getRowActions(rental);
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
                          <span className="text-gray-400 text-xs">desde {format(toDay(item.addedDate), 'dd/MM/yy')}</span>
                        </div>
                          ))}
                        </div>

                    {/* Precio por día */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <Text className="text-xs text-gray-500">Precio</Text>
                        <Text className="text-sm font-semibold text-blue-600">${monthlyFromDaily(dailyTotal).toLocaleString()}/mes</Text>
                      </div>
                      <div className="text-right">
                        <Text className="text-xs text-gray-500">Acumulado</Text>
                        <Text className="text-sm font-semibold text-amber-600">${toDateTotal.toLocaleString()}</Text>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm text-gray-600">Devolución:</Text>
                        <span className="text-sm font-medium">{format(toDay(rental.returnDate), 'dd/MM/yyyy')}</span>
                        {(rental.status !== 'finalizado') && (
                          <IconButton icon={Icons.pencil} label="Editar fecha de devolución" onClick={() => openEditField(rental, 'returnDate', rental.returnDate)} />
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
                          <IconButton icon={Icons.pencil} label="Editar pago" onClick={() => openEditPaymentDialog(rental)} />
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

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {actions.primary.map((a) => (
                        <div key={a.key} className="flex-1"><ActionButton action={a} block /></div>
                      ))}
                      <div className="flex-1"><ActionMenu actions={actions.menu} block /></div>
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
          <div className="bg-white w-full max-w-[56rem] rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
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
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={
                                  item.productId in newRentalQtyDraft
                                    ? newRentalQtyDraft[item.productId]
                                    : item.quantity === 0
                                      ? ''
                                      : String(item.quantity)
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (!isLooseIntString(v)) return;
                                  setNewRentalQtyDraft((d) => ({ ...d, [item.productId]: v }));
                                }}
                                onBlur={() => {
                                  const pid = item.productId;
                                  const raw = (
                                    pid in newRentalQtyDraft
                                      ? newRentalQtyDraft[pid]
                                      : item.quantity === 0
                                        ? ''
                                        : String(item.quantity)
                                  ).trim();
                                  let q = parseInt(raw, 10);
                                  if (raw === '' || Number.isNaN(q)) q = 0;
                                  updateItemQuantity(pid, q);
                                  clampNewRentalItemQuantity(pid);
                                  setNewRentalQtyDraft((d) => {
                                    const next = { ...d };
                                    delete next[pid];
                                    return next;
                                  });
                                }}
                                title={`Stock disponible: ${product?.stockActual ?? 0}`}
                                className={freeIntInputCls}
                            />
                          </div>
                            <PricePairInputs
                              dailyPrice={item.dailyPrice}
                              onDailyChange={(d) => updateItemDailyPrice(item.productId, d)}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Fecha adición:</span>
                              <input
                                type="date"
                                value={item.addedDate ? dayKey(item.addedDate) : todayKey()}
                                onChange={(e) => updateItemAddedDate(item.productId, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <Text className="text-xs text-gray-500">Presupuesto: ${returnDate ? itemBudget(item, returnDate).toLocaleString() : '—'}</Text>
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
                  min={todayKey()} required
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
                  <Text className="font-medium text-gray-700">Presupuesto hasta vencimiento</Text>
              <Text className="text-xl font-bold">${calculatedTotal.toLocaleString()}</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-sm text-gray-500">Precio total</Text>
                  <Text className="text-sm font-semibold text-blue-600">${monthlyFromDaily(calculatedDailyTotal).toLocaleString()}/mes · ${(Math.round(calculatedDailyTotal * 100) / 100).toLocaleString()}/día</Text>
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
                  <Text className="font-semibold text-sm">{format(toDay(selectedRental.returnDate), 'dd/MM/yyyy')}</Text>
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
                    const toDate = billItemToDate(item);
                    const accumulated = toDate.total;
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
                            <span className="ml-1 font-medium">{format(toDay(item.addedDate), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">Transcurrido:</span>
                            <span className="ml-1 font-medium">{formatPeriod(toDate)}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">$/mes:</span>
                            <span className="ml-1 font-medium text-blue-600">${monthlyFromDaily(item.dailyPrice || item.unitPrice).toLocaleString()} × {item.quantity} = ${toDate.monthlyRate.toLocaleString()}</span>
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
                          {format(toDay(payment.periodFrom), 'dd/MM/yyyy')} - {format(toDay(payment.periodTo), 'dd/MM/yyyy')}
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => selectedRental && openDeleteRentalModal(selectedRental)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200"
                >
                  Eliminar alquiler
                </button>
                <button onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all sm:ml-auto">
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
                      const { from, to } = vencimientoPeriod(selectedRental);
                      setBillingDateFrom(dayKey(from));
                      setBillingDateTo(dayKey(to));
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
                          setBillingItemDiscountStr({});
                          setBillingTotalDiscountStr('');
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${discountType === 'none' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Sin descuento
                      </button>
                      <button
                        onClick={() => {
                          setDiscountType('item');
                          setBillingTotalDiscountStr('');
                          setBillingItemDiscountStr({});
                        }}
                        className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${discountType === 'item' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Por ítem
                      </button>
                      <button
                        onClick={() => {
                          setDiscountType('total');
                          setBillingItemDiscountStr({});
                          setBillingTotalDiscountStr(
                            totalDiscount.value ? String(totalDiscount.value) : ''
                          );
                        }}
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
                      <span className="text-center">Precio</span>
                      <span className="text-center">Período</span>
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
                      const itemDiscount = itemDiscounts[item.productId] || { type: 'percent', value: 0 };
                      
                      return (
                        <div key={idx} className={`grid gap-2 p-3 items-center text-sm ${discountType === 'item' ? 'grid-cols-7' : 'grid-cols-5'}`}>
                          <span className="col-span-1 font-medium text-gray-800 truncate">{item.productName}</span>
                          <span className="text-center text-gray-600">{item.quantity}</span>
                          <span className="text-center text-blue-600 text-xs">
                            <div className="font-semibold">${monthlyFromDaily(unitDailyPrice).toLocaleString()}/mes</div>
                            <div>${(Math.round(unitDailyPrice * 100) / 100).toLocaleString()}/día</div>
                          </span>
                          <span className="text-center text-gray-600 text-xs">
                            <div>{formatPeriod(item)}</div>
                            <div className="text-gray-400">desde {format(toDay(item.addedDate), 'dd/MM')}</div>
                          </span>
                          {discountType === 'item' && (
                            <div className="flex gap-1 items-center">
                              <select
                                value={itemDiscount.type}
                                onChange={(e) => {
                                  setBillingItemDiscountStr((d) => {
                                    const next = { ...d };
                                    delete next[item.productId];
                                    return next;
                                  });
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
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={
                                  item.productId in billingItemDiscountStr
                                    ? billingItemDiscountStr[item.productId]
                                    : itemDiscount.value
                                      ? String(itemDiscount.value)
                                      : ''
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (!isLooseDecimalString(v)) return;
                                  setBillingItemDiscountStr((d) => ({
                                    ...d,
                                    [item.productId]: v,
                                  }));
                                }}
                                onBlur={() => {
                                  const pid = item.productId;
                                  const disc = itemDiscount;
                                  const fallback = disc.value !== 0 ? String(disc.value) : '';
                                  const raw = (
                                    pid in billingItemDiscountStr
                                      ? billingItemDiscountStr[pid]
                                      : fallback
                                  )
                                    .trim()
                                    .replace(',', '.');
                                  let num = parseFloat(raw);
                                  if (raw === '' || Number.isNaN(num)) num = 0;
                                  if (disc.type === 'percent') {
                                    num = Math.min(100, Math.max(0, num));
                                  } else {
                                    num = Math.min(item.subtotal, Math.max(0, num));
                                  }
                                  setItemDiscounts({
                                    ...itemDiscounts,
                                    [pid]: { ...disc, value: num },
                                  });
                                  setBillingItemDiscountStr((d) => {
                                    const next = { ...d };
                                    if (num === 0) next[pid] = '';
                                    else delete next[pid];
                                    return next;
                                  });
                                }}
                                className={`w-24 text-xs rounded border border-gray-300 px-2 py-1 ${hideNumberSpinners}`}
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
                            setBillingTotalDiscountStr('');
                            setTotalDiscount({ ...totalDiscount, type: e.target.value as 'percent' | 'amount' });
                          }}
                          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="percent">Porcentaje (%)</option>
                          <option value="amount">Monto fijo ($)</option>
                        </select>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={billingTotalDiscountStr}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!isLooseDecimalString(v)) return;
                            setBillingTotalDiscountStr(v);
                          }}
                          onBlur={() => {
                            const subtotal = billingDetails.subtotal;
                            const raw = billingTotalDiscountStr.trim().replace(',', '.');
                            let num = parseFloat(raw);
                            if (raw === '' || Number.isNaN(num)) num = 0;
                            if (totalDiscount.type === 'percent') {
                              num = Math.min(100, Math.max(0, num));
                            } else {
                              num = Math.min(subtotal, Math.max(0, num));
                            }
                            setTotalDiscount({ ...totalDiscount, value: num });
                            setBillingTotalDiscountStr(num === 0 ? '' : String(num));
                          }}
                          className={`flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none ${hideNumberSpinners}`}
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
                            ? '(Meses completos × precio/mes + días sueltos × precio/día, desde la adición de cada producto)'
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
                        dayKey(billingDetails.fromDate),
                        dayKey(billingDetails.toDate)
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
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                      value={partialReturnQtyStrs[idx] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!isLooseIntString(v)) return;
                        setPartialReturnQtyStrs((prev) => {
                          const x = [...prev];
                          x[idx] = v;
                          return x;
                        });
                      }}
                      onBlur={() => {
                        const raw = (partialReturnQtyStrs[idx] ?? '').trim();
                        let n = parseInt(raw, 10);
                        if (raw === '' || Number.isNaN(n)) n = 0;
                        const val = Math.min(item.quantity, Math.max(0, n));
                        setPartialReturnItems((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, quantity: val } : p))
                        );
                        setPartialReturnQtyStrs((prev) => {
                          const x = [...prev];
                          x[idx] = val === 0 ? '' : String(val);
                          return x;
                        });
                      }}
                      className={`w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm ${hideNumberSpinners}`}
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
          <div className="bg-white w-full max-w-[56rem] rounded-2xl shadow-2xl p-6 my-auto max-h-[90vh] overflow-y-auto">
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
                              <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={editingQtyStrs[itemIndex] ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (!isLooseIntString(v)) return;
                                  setEditingQtyStrs((prev) => {
                                    const x = [...prev];
                                    x[itemIndex] = v;
                                    return x;
                                  });
                                }}
                                onBlur={() => {
                                  const raw = (editingQtyStrs[itemIndex] ?? '').trim();
                                  let q = parseInt(raw, 10);
                                  if (raw === '' || Number.isNaN(q)) q = 0;
                                  const line = editingRentalItems[itemIndex];
                                  if (!line) return;
                                  const product = products.find((p: any) => p.id === line.productId);
                                  let newQ = q;
                                  if (product) {
                                    const totalOthers = editingRentalItems
                                      .filter((i, idx) => i.productId === line.productId && idx !== itemIndex)
                                      .reduce((sum, i) => sum + i.quantity, 0);
                                    const maxQty = Math.max(0, product.stockActual - totalOthers);
                                    newQ = Math.max(1, Math.min(maxQty, newQ));
                                  } else {
                                    newQ = Math.max(1, newQ);
                                  }
                                  setEditingRentalItems((items) =>
                                    items.map((it, idx) =>
                                      idx === itemIndex
                                        ? { ...it, quantity: newQ, totalPrice: newQ * it.unitPrice }
                                        : it
                                    )
                                  );
                                  setEditingQtyStrs((strs) => {
                                    const n = [...strs];
                                    n[itemIndex] = String(newQ);
                                    return n;
                                  });
                                }}
                                title={`Máx. según stock: ${availableStock + item.quantity}`}
                                className={freeIntInputCls}
                              />
                            </div>
                            <PricePairInputs
                              dailyPrice={item.dailyPrice ?? item.unitPrice}
                              onDailyChange={(d) => updateEditingItemDailyPrice(itemIndex, d)}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Fecha adición:</span>
                              <input
                                type="date"
                                value={item.addedDate ? dayKey(item.addedDate) : todayKey()}
                                onChange={(e) => updateEditingItemAddedDate(itemIndex, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <Text className="text-xs text-gray-500">Presupuesto: ${itemBudget(item, selectedRental.returnDate).toLocaleString()}</Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <Text className="font-medium text-gray-700">Presupuesto hasta vencimiento</Text>
                <Text className="text-xl font-bold">${editingRentalItems.reduce((sum: number, item: any) => sum + itemBudget(item, selectedRental.returnDate), 0).toLocaleString()}</Text>
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={pagadoInputStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(',', '.');
                    if (!isLooseDecimalString(v)) return;
                    setPagadoInputStr(v);
                  }}
                  onBlur={() => {
                    const cap = selectedRental.totalPrice || 0;
                    const raw = String(pagadoInputStr).trim().replace(',', '.');
                    const n = parseFloat(raw);
                    if (raw === '' || Number.isNaN(n)) {
                      setPagado(0);
                      setPagadoInputStr('');
                      return;
                    }
                    const clamped = Math.max(0, Math.min(cap, n));
                    setPagado(clamped);
                    setPagadoInputStr(clamped === 0 ? '' : String(clamped));
                  }}
                  className={`w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm ${hideNumberSpinners}`}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resto</label>
                <Text className="text-lg font-semibold text-orange-600">${(() => {
                  const cap = selectedRental.totalPrice || 0;
                  const raw = String(pagadoInputStr).trim().replace(',', '.');
                  const n = parseFloat(raw);
                  const p =
                    raw === '' || Number.isNaN(n)
                      ? 0
                      : Math.max(0, Math.min(cap, n));
                  return (cap - p).toLocaleString();
                })()}</Text>
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
                      setTransferQtyDraft({});
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
                          const tid = item.productId;
                          const existingTransfer = transferItems.find((ti: any) => ti.productId === tid);
                          const currentTransferQty = existingTransfer?.quantity || 0;
                          const availableQuantity = item.quantity; // Cantidad total disponible
                          const remainingQuantity = availableQuantity - currentTransferQty;
                          const displayTransfer =
                            tid in transferQtyDraft
                              ? transferQtyDraft[tid]
                              : currentTransferQty === 0
                                ? ''
                                : String(currentTransferQty);
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
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  value={displayTransfer}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (!isLooseIntString(v)) return;
                                    setTransferQtyDraft((d) => ({ ...d, [tid]: v }));
                                  }}
                                  onBlur={() => {
                                    const raw = (
                                      tid in transferQtyDraft
                                        ? transferQtyDraft[tid]
                                        : currentTransferQty === 0
                                          ? ''
                                          : String(currentTransferQty)
                                    ).trim();
                                    let parsed = parseInt(raw, 10);
                                    if (raw === '' || Number.isNaN(parsed)) parsed = 0;
                                    const qty = Math.max(0, Math.min(availableQuantity, parsed));
                                    if (qty === 0) {
                                      setTransferItems((ti) =>
                                        ti.filter((t: any) => t.productId !== tid)
                                      );
                                      setTransferQtyDraft((d) => ({ ...d, [tid]: '' }));
                                    } else {
                                      setTransferItems((ti) => {
                                        const existing = ti.find((t: any) => t.productId === tid);
                                        if (existing) {
                                          return ti.map((t: any) =>
                                            t.productId === tid ? { ...t, quantity: qty } : t
                                          );
                                        }
                                        return [
                                          ...ti,
                                          {
                                            productId: tid,
                                            productName: item.productName,
                                            quantity: qty,
                                          },
                                        ];
                                      });
                                      setTransferQtyDraft((d) => {
                                        const next = { ...d };
                                        delete next[tid];
                                        return next;
                                      });
                                    }
                                  }}
                                  className={`w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center ${hideNumberSpinners}`}
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
                    setTransferQtyDraft({});
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
                        setTransferQtyDraft({});
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

      {rentalToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{
            minHeight: '100vh',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteRentalModal();
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Title className="text-lg font-bold text-red-800 mb-3">Eliminar alquiler</Title>
            <div className="text-sm text-gray-700 space-y-2 mb-4">
              <p>Obra: <span className="font-semibold">{rentalToDelete.workName}</span></p>
              <p>Cliente: <span className="font-semibold">{rentalToDelete.clientName}</span></p>
              <p>Estado: <span className="font-semibold">{rentalToDelete.status}</span></p>
              <p>Total: <span className="font-semibold">${(rentalToDelete.totalPrice || 0).toLocaleString()}</span></p>
              <p className="pt-2 border-t border-gray-100 text-gray-600">
                Se borrarán el alquiler, sus ítems y el historial de cobros. El stock se actualizará según las cantidades actuales de cada producto. Esta acción no se puede deshacer.
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Escriba <span className="font-mono font-bold">ELIMINAR</span> para confirmar
            </label>
            <input
              type="text"
              autoComplete="off"
              value={deletePhraseInput}
              onChange={(e) => setDeletePhraseInput(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none mb-4"
              placeholder="ELIMINAR"
              disabled={deleteRentalLoading}
            />
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={closeDeleteRentalModal}
                disabled={deleteRentalLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void executeDeleteRental()}
                disabled={deleteRentalLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {deleteRentalLoading ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

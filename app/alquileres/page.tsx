'use client';

import { useState, useMemo } from 'react';
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
import { format } from 'date-fns';

export default function AlquileresPage() {
  const products = useStore((state: any) => state.products);
  const clients = useStore((state: any) => state.clients);
  const obras = useStore((state: any) => state.obras);
  const rentals = useStore((state: any) => state.rentals);
  const addRental = useStore((state: any) => state.addRental);
  const returnRental = useStore((state: any) => state.returnRental);
  const partialReturn = useStore((state: any) => state.partialReturn);
  const updateRental = useStore((state: any) => state.updateRental);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPartialReturnOpen, setIsPartialReturnOpen] = useState(false);
  const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [editField, setEditField] = useState<{ field: string; value: any }>({ field: '', value: '' });
  const [partialReturnItems, setPartialReturnItems] = useState<{ productId: string; quantity: number }[]>([]);
  
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [returnDate, setReturnDate] = useState('');
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
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
    () => products.filter((p: any) => p.stock > 0),
    [products]
  );

  const activeRentals = useMemo(
    () => rentals.filter((r: any) => r.status === 'active'),
    [rentals]
  );

  const totalActiveRentals = activeRentals.length;
  const totalRevenue = rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  const upcomingReturns = activeRentals.filter((r: any) => {
    const daysUntil = Math.ceil((new Date(r.returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0;
  }).length;

  const openAddDialog = () => {
    setSelectedWorkId('');
    setRentalItems([]);
    setReturnDate('');
    setManualTotal(null);
    setIsDialogOpen(true);
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

  const handlePartialReturn = () => {
    const itemsToReturn = partialReturnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) return;
    partialReturn(selectedRental.id, itemsToReturn);
    setIsPartialReturnOpen(false);
  };

  const handleEditField = () => {
    if (editField.field === 'returnDate') {
      updateRental(selectedRental.id, { returnDate: editField.value });
    } else if (editField.field === 'totalPrice') {
      updateRental(selectedRental.id, { totalPrice: parseFloat(editField.value) || 0 });
    }
    setIsEditFieldOpen(false);
  };

  const addItemToRental = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    const existingItem = rentalItems.find((item) => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
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
      if (product.stock > 0) {
        setRentalItems([...rentalItems, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
        }]);
      }
    }
    setManualTotal(null);
  };

  const removeItemFromRental = (productId: string) => {
    setRentalItems(rentalItems.filter((item) => item.productId !== productId));
    setManualTotal(null);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product || quantity < 1 || quantity > product.stock) return;
    setRentalItems(
      rentalItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      )
    );
    setManualTotal(null);
  };

  const calculatedTotal = useMemo(() => rentalItems.reduce((sum, item) => sum + item.totalPrice, 0), [rentalItems]);
  const finalTotal = manualTotal !== null ? manualTotal : calculatedTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkId || rentalItems.length === 0 || !returnDate) return;
    addRental({
      workId: selectedWorkId,
      items: rentalItems,
      totalPrice: finalTotal,
      returnDate,
      status: 'active',
    });
    setIsDialogOpen(false);
  };

  const handleFullReturn = (rentalId: string) => {
    if (confirm('¿Confirmar devolución completa?')) returnRental(rentalId);
  };

  const getDaysUntilReturn = (returnDateStr: string) => {
    return Math.ceil((new Date(returnDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Alquileres</Title>
          <Text className="text-gray-500 mt-1 text-sm sm:text-base">Gestiona los alquileres de productos</Text>
        </div>
        <button
          onClick={openAddDialog}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <span className="text-lg">+</span>
          Nuevo Alquiler
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Activos</Text>
          <Metric className="text-2xl">{totalActiveRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Ingresos Totales</Text>
          <Metric className="text-2xl">${totalRevenue.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="orange" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Vencen en 3 días</Text>
          <Metric className="text-2xl">{upcomingReturns}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Total Alquileres</Text>
          <Metric className="text-2xl">{rentals.length}</Metric>
        </Card>
      </div>

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
              <option value="active">Activos</option>
              <option value="returned">Devueltos</option>
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

      <Card className="shadow-md rounded-2xl">
        <Title className="text-lg font-bold mb-4">Lista de Alquileres</Title>
        {filteredRentals.length === 0 ? (
          <div className="text-center py-12">
            <Text className="text-gray-400 text-4xl mb-3">📋</Text>
            <Text className="text-gray-500">No se encontraron alquileres</Text>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="text-left">Obra</TableHeaderCell>
                <TableHeaderCell className="text-left">Cliente</TableHeaderCell>
                <TableHeaderCell className="text-left">Productos</TableHeaderCell>
                <TableHeaderCell className="text-left">Fecha Devolución</TableHeaderCell>
                <TableHeaderCell className="text-left">Total</TableHeaderCell>
                <TableHeaderCell className="text-left">Estado</TableHeaderCell>
                <TableHeaderCell className="text-left">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>
                <TableBody>
                  {filteredRentals.map((rental: any) => {
                    const daysUntil = getDaysUntilReturn(rental.returnDate);
                    return (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">{rental.workName}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{rental.clientName}</TableCell>
                    <TableCell>
                          <div className="space-y-1">
                            {rental.items.map((item: any, idx: number) => (
                              <Text key={idx} className="text-sm text-gray-600">
                                {item.productName} ×{item.quantity}
                              </Text>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{format(new Date(rental.returnDate), 'dd/MM/yyyy')}</span>
                            {rental.status === 'active' && (
                              <button
                                onClick={() => openEditField(rental, 'returnDate', rental.returnDate)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                                title="Editar fecha"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${rental.totalPrice.toLocaleString()}</span>
                            {rental.status === 'active' && (
                              <button
                                onClick={() => openEditField(rental, 'totalPrice', rental.totalPrice)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                                title="Editar total"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rental.status === 'active' ? (
                            <Badge color={daysUntil < 0 ? 'red' : daysUntil <= 3 ? 'orange' : 'green'}>
                              {daysUntil < 0 ? 'Vencido' : daysUntil === 0 ? 'Hoy' : `${daysUntil}d`}
                            </Badge>
                          ) : (
                            <Badge color="gray">Devuelto</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rental.status === 'active' && (
                            <div className="flex gap-1">
                          <button
                            onClick={() => openPartialReturn(rental)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                          >
                            Parcial
                          </button>
                          <button
                            onClick={() => handleFullReturn(rental.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            Devolver
                          </button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-4">
              {filteredRentals.map((rental: any) => {
                const daysUntil = getDaysUntilReturn(rental.returnDate);
                return (
                  <div key={rental.id} className="border border-gray-200 rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Text className="font-semibold text-gray-900">{rental.workName}</Text>
                        <Text className="text-sm text-gray-600 mt-0.5">{rental.clientName}</Text>
                        <div className="mt-1 space-y-1">
                          {rental.items.map((item: any, idx: number) => (
                            <Text key={idx} className="text-sm text-gray-600">
                              {item.productName} ×{item.quantity}
                            </Text>
                          ))}
                        </div>
                      </div>
                      <div className="ml-2">
                        {rental.status === 'active' ? (
                          <Badge color={daysUntil < 0 ? 'red' : daysUntil <= 3 ? 'orange' : 'green'}>
                            {daysUntil < 0 ? 'Vencido' : daysUntil === 0 ? 'Hoy' : `${daysUntil}d`}
                          </Badge>
                        ) : (
                          <Badge color="gray">Devuelto</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm text-gray-600">Devolución:</Text>
                        <span className="text-sm font-medium">{format(new Date(rental.returnDate), 'dd/MM/yyyy')}</span>
                        {rental.status === 'active' && (
                          <button
                            onClick={() => openEditField(rental, 'returnDate', rental.returnDate)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                            title="Editar fecha"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Text className="text-sm text-gray-600">Total:</Text>
                        <span className="text-sm font-semibold">${rental.totalPrice.toLocaleString()}</span>
                        {rental.status === 'active' && (
                          <button
                            onClick={() => openEditField(rental, 'totalPrice', rental.totalPrice)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                            title="Editar total"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </div>

                    {rental.status === 'active' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => openPartialReturn(rental)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                        >
                          Devolución Parcial
                        </button>
                        <button
                          onClick={() => handleFullReturn(rental.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                          Devolver Todo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {isDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4"
          style={{ 
            minHeight: '100vh',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDialogOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-auto">
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
                  <option key={obra.id} value={obra.id}>
                    {obra.name} - {obra.clientName}
                  </option>
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
                      <Text className="text-xs text-gray-500">Stock: {product.stock} | ${product.price}</Text>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItemToRental(product.id)}
                      className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                    >
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
                      <div key={item.productId} className="flex items-center justify-between p-2 bg-blue-50">
                        <div className="flex-1">
                          <Text className="font-medium text-sm">{item.productName}</Text>
                          <div className="flex items-center gap-2 mt-1">
                            <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">-</button>
                            <Text className="text-sm w-6 text-center">{item.quantity}</Text>
                            <button type="button" onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= (product?.stock || 0)} className="w-6 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">+</button>
                            <Text className="text-xs text-gray-500 ml-2">${item.totalPrice.toLocaleString()}</Text>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeItemFromRental(item.productId)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded">Quitar</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Devolución</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Manual (opcional)</label>
                <TextInput
                  type="number"
                  min="0"
                  value={manualTotal !== null ? manualTotal.toString() : ''}
                  onChange={(e) => setManualTotal(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder={`Auto: $${calculatedTotal.toLocaleString()}`}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <Text className="font-medium text-gray-700">Total</Text>
              <Text className="text-xl font-bold">${finalTotal.toLocaleString()}</Text>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md">Cancelar</button>
              <button type="submit" disabled={!selectedWorkId || rentalItems.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50">Crear</button>
            </div>
          </form>
          </div>
        </div>
      )}

      {isPartialReturnOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ 
            minHeight: '100vh',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPartialReturnOpen(false);
            }
          }}
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
                      type="number"
                      min="0"
                      max={item.quantity}
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
                <button onClick={() => setIsPartialReturnOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md">Cancelar</button>
                <button onClick={handlePartialReturn} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg">Confirmar</button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {isEditFieldOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          style={{ 
            minHeight: '100vh',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditFieldOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-4">
              {editField.field === 'returnDate'
                ? 'Editar fecha de devolución'
                : `Edición de Total - ${selectedRental?.workName || ''}`}
            </Title>
            <div className="space-y-4">
              {editField.field === 'returnDate' ? (
                <input
                  type="date"
                  value={editField.value}
                  onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
                />
              ) : (
                <TextInput
                  type="number"
                  min="0"
                  value={editField.value.toString()}
                  onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                  className="pl-4"
                />
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setIsEditFieldOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditField}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

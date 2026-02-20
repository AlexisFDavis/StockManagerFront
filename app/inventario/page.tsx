'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  Button,
  TextInput,
  Textarea,
  Badge,
  Metric,
  Select,
  SelectItem,
} from '@tremor/react';
import { Product } from '@/types';
import { format } from 'date-fns';

export default function InventarioPage() {
  const products = useStore((state: any) => state.products);
  const rentals = useStore((state: any) => state.rentals);
  const addProduct = useStore((state: any) => state.addProduct);
  const updateProduct = useStore((state: any) => state.updateProduct);
  const deleteProduct = useStore((state: any) => state.deleteProduct);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stockTotal: 0,
    price: 0,
    notes: '',
  });
  const [notesText, setNotesText] = useState('');

  const [searchText, setSearchText] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = searchText === '' || 
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.description.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = product.stockActual > 0 && product.stockActual < 10;
      if (stockFilter === 'out') matchesStock = product.stockActual === 0;
      if (stockFilter === 'available') matchesStock = product.stockActual >= 10;
      
      return matchesSearch && matchesStock;
    });
  }, [products, searchText, stockFilter]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', stockTotal: 0, price: 0, notes: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      stockTotal: product.stockTotal,
      price: product.price,
      notes: product.notes || '',
    });
    setIsDialogOpen(true);
  };

  const openDetailsDialog = (product: Product) => {
    setSelectedProduct(product);
    setNotesText(product.notes || '');
    setIsDetailsDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (selectedProduct) {
      updateProduct(selectedProduct.id, { notes: notesText });
      setSelectedProduct({ ...selectedProduct, notes: notesText });
      // Actualizar también en la lista de productos
      const updatedProduct = products.find((p: Product) => p.id === selectedProduct.id);
      if (updatedProduct) {
        setSelectedProduct({ ...updatedProduct, notes: notesText });
      }
    }
  };

  // Obtener información de dónde está alquilado el producto
  const getProductRentals = (productId: string) => {
    return rentals
      .filter((rental: any) => 
        rental.status === 'iniciado' && 
        rental.items.some((item: any) => item.productId === productId)
      )
      .map((rental: any) => {
        const item = rental.items.find((i: any) => i.productId === productId);
        return {
          rentalId: rental.id,
          workName: rental.workName,
          clientName: rental.clientName,
          quantity: item?.quantity || 0,
          returnDate: rental.returnDate,
          status: rental.status,
        };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
      // Actualizar también el producto seleccionado si está abierto el modal de detalles
      if (selectedProduct && selectedProduct.id === editingProduct.id) {
        setSelectedProduct({ ...selectedProduct, ...formData });
      }
    } else {
      addProduct(formData);
    }
    setIsDialogOpen(false);
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: Product) => sum + p.stockTotal, 0);
  const stockActual = products.reduce((sum: number, p: Product) => sum + p.stockActual, 0);
  const lowStockProducts = products.filter((p: Product) => p.stockActual < 10 && p.stockActual > 0).length;
  const outOfStockProducts = products.filter((p: Product) => p.stockActual === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <span className="text-lg">+</span>
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Total Productos</Text>
          <Metric className="text-2xl">{totalProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Stock Total</Text>
          <Metric className="text-2xl">{totalStock.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Stock Actual</Text>
          <Metric className="text-2xl">{stockActual.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Stock Bajo</Text>
          <Metric className="text-2xl">{lowStockProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Sin Stock</Text>
          <Metric className="text-2xl">{outOfStockProducts}</Metric>
        </Card>
      </div>

      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <div className="mb-3">
          <Text className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar Producto</label>
            <TextInput
              placeholder="Nombre o descripción..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado de Stock</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="available">Stock disponible (≥10)</option>
              <option value="low">Stock bajo (&lt;10)</option>
              <option value="out">Sin stock</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product: Product) => (
          <Card key={product.id} className="shadow-md hover:shadow-xl transition-all rounded-2xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-3">
                <Text className="font-semibold text-lg text-gray-900">{product.name}</Text>
                <Text className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</Text>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  size="lg"
                  color={product.stockActual === 0 ? 'red' : product.stockActual < 10 ? 'yellow' : 'green'}
                >
                  {product.stockActual} actual
                </Badge>
                <Text className="text-xs text-gray-400">Total: {product.stockTotal}</Text>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <Text className="text-gray-400 text-xs uppercase">Precio</Text>
                  <Text className="font-bold text-xl text-gray-900">${product.price.toLocaleString()}</Text>
                </div>
                <div className="text-right">
                  <Text className="text-gray-400 text-xs uppercase">Valor total</Text>
                  <Text className="font-semibold text-gray-700">${(product.stockTotal * product.price).toLocaleString()}</Text>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => openDetailsDialog(product)}
                  className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Detalles
                </button>
                <button
                  onClick={() => openEditDialog(product)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar este producto?')) deleteProduct(product.id);
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="shadow-md rounded-2xl">
          <div className="text-center py-12">
            <Text className="text-gray-400 text-4xl mb-3">📦</Text>
            <Text className="text-gray-500">No se encontraron productos con los filtros aplicados</Text>
          </div>
        </Card>
      )}

      {isDialogOpen && (
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
              setIsDialogOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-6">
              {editingProduct ? `Edición de ${editingProduct.name}` : 'Nuevo Producto'}
            </Title>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Total</label>
                <TextInput
                  type="number"
                  min="0"
                  value={formData.stockTotal.toString()}
                  onChange={(e) => setFormData({ ...formData, stockTotal: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price.toString()}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el producto..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {editingProduct ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {isDetailsDialogOpen && selectedProduct && (
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
              setIsDetailsDialogOpen(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 my-auto">
            <Title className="text-xl font-bold mb-6">Detalles del Producto</Title>
            
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Nombre</Text>
                  <Text className="font-semibold text-gray-900">{selectedProduct.name}</Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Precio</Text>
                  <Text className="font-semibold text-gray-900">${selectedProduct.price.toLocaleString()}</Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Descripción</Text>
                  <Text className="font-medium text-gray-900">{selectedProduct.description}</Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Valor Total</Text>
                  <Text className="font-semibold text-gray-900">
                    ${(selectedProduct.stockTotal * selectedProduct.price).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Stock Total</Text>
                  <Text className="font-semibold text-gray-900">{selectedProduct.stockTotal}</Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Stock Actual</Text>
                  <Badge
                    color={selectedProduct.stockActual === 0 ? 'red' : selectedProduct.stockActual < 10 ? 'yellow' : 'green'}
                    size="lg"
                  >
                    {selectedProduct.stockActual}
                  </Badge>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Stock Alquilado</Text>
                  <Text className="font-semibold text-orange-600">
                    {selectedProduct.stockTotal - selectedProduct.stockActual}
                  </Text>
                </div>
                <div>
                  <Text className="text-gray-500 text-sm mb-1">Stock Disponible</Text>
                  <Text className={`font-semibold ${
                    selectedProduct.stockActual > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedProduct.stockActual}
                  </Text>
                </div>
              </div>

              {/* Dónde está alquilado */}
              {(() => {
                const productRentals = getProductRentals(selectedProduct.id);
                return productRentals.length > 0 ? (
                  <div className="border-t border-gray-200 pt-4">
                    <Title className="text-lg font-bold mb-4">Alquilado en:</Title>
                    <div className="space-y-3">
                      {productRentals.map((rental: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Text className="font-semibold text-sm text-gray-900">{rental.workName}</Text>
                              <Text className="text-xs text-gray-600 mt-1">{rental.clientName}</Text>
                              <div className="mt-2 flex gap-4 text-xs">
                                <div>
                                  <Text className="text-gray-500">Cantidad:</Text>
                                  <Text className="font-semibold text-gray-900 ml-1">{rental.quantity} uds</Text>
                                </div>
                                <div>
                                  <Text className="text-gray-500">Devolución:</Text>
                                  <Text className="font-semibold text-gray-900 ml-1">
                                    {format(new Date(rental.returnDate), 'dd/MM/yyyy')}
                                  </Text>
                                </div>
                              </div>
                            </div>
                            <Badge color="blue" size="sm">
                              {rental.status === 'iniciado' ? 'Iniciado' : rental.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <Text className="text-gray-500 text-sm">Este producto no está actualmente alquilado</Text>
                  </div>
                );
              })()}

              {/* Notas */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Title className="text-lg font-bold">Notas</Title>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Guardar Notas
                  </button>
                </div>
                <Textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Agregar notas sobre este producto..."
                  rows={5}
                  className="w-full"
                />
                {notesText && notesText !== selectedProduct.notes && (
                  <div className="mt-2">
                    <Text className="text-xs text-blue-600">⚠️ Tienes cambios sin guardar</Text>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setIsDetailsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

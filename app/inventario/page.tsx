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
  Dialog,
  DialogPanel,
  Metric,
  Select,
  SelectItem,
} from '@tremor/react';
import { Product } from '@/types';

export default function InventarioPage() {
  const products = useStore((state: any) => state.products);
  const addProduct = useStore((state: any) => state.addProduct);
  const updateProduct = useStore((state: any) => state.updateProduct);
  const deleteProduct = useStore((state: any) => state.deleteProduct);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock: 0,
    price: 0,
  });

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = searchText === '' || 
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.description.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = product.stock > 0 && product.stock < 10;
      if (stockFilter === 'out') matchesStock = product.stock === 0;
      if (stockFilter === 'available') matchesStock = product.stock >= 10;
      
      return matchesSearch && matchesStock;
    });
  }, [products, searchText, stockFilter]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', stock: 0, price: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      stock: product.stock,
      price: product.price,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsDialogOpen(false);
  };

  // KPIs
  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: Product) => sum + p.stock, 0);
  const lowStockProducts = products.filter((p: Product) => p.stock < 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter((p: Product) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title className="text-3xl font-bold text-gray-900">Inventario</Title>
          <Text className="text-gray-500 mt-1">Gestiona tus productos y stock</Text>
        </div>
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="text-lg">+</span>
          Nuevo Producto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Total Productos</Text>
          <Metric className="text-2xl">{totalProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Stock Total</Text>
          <Metric className="text-2xl">{totalStock.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Stock Bajo</Text>
          <Metric className="text-2xl">{lowStockProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Sin Stock</Text>
          <Metric className="text-2xl">{outOfStockProducts}</Metric>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border border-gray-200">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Todos</option>
              <option value="available">Stock disponible (≥10)</option>
              <option value="low">Stock bajo (&lt;10)</option>
              <option value="out">Sin stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product: Product) => (
          <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-3">
                <Text className="font-semibold text-lg text-gray-900">{product.name}</Text>
                <Text className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</Text>
              </div>
              <Badge
                size="lg"
                color={product.stock === 0 ? 'red' : product.stock < 10 ? 'yellow' : 'green'}
              >
                {product.stock} uds
              </Badge>
            </div>
            
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <Text className="text-gray-400 text-xs uppercase">Precio</Text>
                  <Text className="font-bold text-xl text-gray-900">${product.price.toLocaleString()}</Text>
                </div>
                <div className="text-right">
                  <Text className="text-gray-400 text-xs uppercase">Valor total</Text>
                  <Text className="font-semibold text-gray-700">${(product.stock * product.price).toLocaleString()}</Text>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => openEditDialog(product)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar este producto?')) deleteProduct(product.id);
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="shadow-sm">
          <div className="text-center py-12">
            <Text className="text-gray-400 text-4xl mb-3">📦</Text>
            <Text className="text-gray-500">No se encontraron productos con los filtros aplicados</Text>
          </div>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} static={true}>
        <DialogPanel className="max-w-lg">
          <Title className="text-xl font-bold mb-6">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <TextInput
                  type="number"
                  min="0"
                  value={formData.stock.toString()}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingProduct ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>
    </div>
  );
}

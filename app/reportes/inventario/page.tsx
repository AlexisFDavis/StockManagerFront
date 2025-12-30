'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  Metric,
  BarChart,
  DonutChart,
  AreaChart,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';
import { Product } from '@/types';

export default function ReportesInventarioPage() {
  const products = useStore((state: any) => state.products);
  const rentals = useStore((state: any) => state.rentals);

  const [searchText, setSearchText] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = searchText === '' || 
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.description.toLowerCase().includes(searchText.toLowerCase());
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock < 10;
      if (stockFilter === 'out') matchesStock = p.stock === 0;
      if (stockFilter === 'available') matchesStock = p.stock >= 10;
      return matchesSearch && matchesStock;
    });
  }, [products, searchText, stockFilter]);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: Product) => sum + p.stock, 0);
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.stock * p.price), 0);
  const avgPrice = products.length > 0 ? products.reduce((sum: number, p: Product) => sum + p.price, 0) / products.length : 0;
  const lowStockProducts = products.filter((p: Product) => p.stock > 0 && p.stock < 10).length;
  const outOfStockProducts = products.filter((p: Product) => p.stock === 0).length;

  const stockByProduct = filteredProducts.map((p: Product) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    Stock: p.stock,
  }));

  const valueByProduct = filteredProducts.map((p: Product) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    Valor: p.stock * p.price,
  }));

  const stockDistribution = useMemo(() => {
    const available = products.filter((p: Product) => p.stock >= 10).length;
    const low = products.filter((p: Product) => p.stock > 0 && p.stock < 10).length;
    const out = products.filter((p: Product) => p.stock === 0).length;
    return [
      { name: 'Disponible (≥10)', value: available },
      { name: 'Bajo (<10)', value: low },
      { name: 'Sin Stock', value: out },
    ];
  }, [products]);

  const productRentalStats = useMemo(() => {
    const stats: Record<string, { name: string; count: number; revenue: number }> = {};
    rentals.forEach((rental: any) => {
      rental.items.forEach((item: any) => {
        if (!stats[item.productId]) {
          stats[item.productId] = { name: item.productName, count: 0, revenue: 0 };
        }
        stats[item.productId].count += item.quantity;
        stats[item.productId].revenue += item.totalPrice;
      });
    });
    return Object.values(stats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(s => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
        Alquileres: s.count,
        Ingresos: s.revenue,
      }));
  }, [rentals]);

  return (
    <div className="space-y-6">
      <div>
        <Title className="text-3xl font-bold text-gray-900">Reportes de Inventario</Title>
        <Text className="text-gray-500 mt-1">Análisis detallado de productos y stock</Text>
      </div>

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Productos</Text>
          <Metric className="text-xl">{totalProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Stock Total</Text>
          <Metric className="text-xl">{totalStock.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Valor Total</Text>
          <Metric className="text-xl">${totalValue.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="purple" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Precio Prom.</Text>
          <Metric className="text-xl">${Math.round(avgPrice).toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Stock Bajo</Text>
          <Metric className="text-xl">{lowStockProducts}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Sin Stock</Text>
          <Metric className="text-xl">{outOfStockProducts}</Metric>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Stock por Producto</Title>
          {stockByProduct.length > 0 ? (
            <BarChart
              data={stockByProduct}
              index="name"
              categories={['Stock']}
              colors={['blue']}
              yAxisWidth={48}
              className="h-72"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Distribución de Stock</Title>
          <DonutChart
            data={stockDistribution}
            category="value"
            index="name"
            colors={['emerald', 'yellow', 'red']}
            className="h-72"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Valor por Producto</Title>
          {valueByProduct.length > 0 ? (
            <BarChart
              data={valueByProduct}
              index="name"
              categories={['Valor']}
              colors={['indigo']}
              yAxisWidth={64}
              valueFormatter={(n: number) => `$${n.toLocaleString()}`}
              className="h-72"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Productos Más Alquilados</Title>
          {productRentalStats.length > 0 ? (
            <BarChart
              data={productRentalStats}
              index="name"
              categories={['Alquileres']}
              colors={['teal']}
              yAxisWidth={48}
              className="h-72"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">Sin datos de alquileres</div>
          )}
        </Card>
      </div>

      <Card className="shadow-sm">
        <Title className="text-lg font-bold mb-4">⚠️ Productos que Requieren Atención</Title>
        <div className="space-y-2">
          {products.filter((p: Product) => p.stock < 10).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Text className="text-3xl mb-2">✅</Text>
              <Text>Todos los productos tienen stock suficiente</Text>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Producto</th>
                    <th className="text-left p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products
                    .filter((p: Product) => p.stock < 10)
                    .sort((a: Product, b: Product) => a.stock - b.stock)
                    .map((p: Product) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3">{p.stock} uds</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.stock === 0 ? 'Sin Stock' : 'Stock Bajo'}
                          </span>
                        </td>
                        <td className="p-3">${(p.stock * p.price).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


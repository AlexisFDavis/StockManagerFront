'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  Metric,
  Badge,
  DonutChart,
  BarList,
  TextInput,
} from '@tremor/react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const products = useStore((state: any) => state.products);
  const rentals = useStore((state: any) => state.rentals);
  const clients = useStore((state: any) => state.clients);

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  const activeRentals = useMemo(
    () => rentals.filter((r: any) => r.status === 'active'),
    [rentals]
  );

  const filteredActiveRentals = useMemo(() => {
    return activeRentals.filter((r: any) => {
      const matchesSearch = searchText === '' || 
        r.clientName.toLowerCase().includes(searchText.toLowerCase());
      
      const daysUntil = Math.ceil((new Date(r.returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let matchesDate = true;
      if (dateFilter === 'overdue') matchesDate = daysUntil < 0;
      if (dateFilter === 'today') matchesDate = daysUntil === 0;
      if (dateFilter === 'week') matchesDate = daysUntil >= 0 && daysUntil <= 7;
      
      return matchesSearch && matchesDate;
    });
  }, [activeRentals, searchText, dateFilter]);
  
  const totalStock = useMemo(
    () => products.reduce((sum: number, p: any) => sum + p.stock, 0),
    [products]
  );

  const totalRevenue = useMemo(
    () => rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0),
    [rentals]
  );

  const activeRevenue = useMemo(
    () => activeRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0),
    [activeRentals]
  );
  
  const upcomingReturns = useMemo(() => {
    return activeRentals.filter((rental: any) => {
      const daysUntilReturn = Math.ceil(
        (new Date(rental.returnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilReturn <= 7 && daysUntilReturn >= 0;
    });
  }, [activeRentals]);

  const overdueRentals = useMemo(() => {
    return activeRentals.filter((r: any) => new Date(r.returnDate) < new Date());
  }, [activeRentals]);

  const lowStockProducts = useMemo(
    () => products.filter((p: any) => p.stock < 10 && p.stock > 0),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((p: any) => p.stock === 0),
    [products]
  );

  const stockDistribution = useMemo(() => {
    return products.map((p: any) => ({
      name: p.name,
      value: p.stock,
    }));
  }, [products]);

  const topProducts = useMemo(() => {
    const productCounts: { [key: string]: number } = {};
    rentals.forEach((r: any) => {
      r.items.forEach((item: any) => {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.entries(productCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rentals]);

  const revenueByClient = useMemo(() => {
    const clientRevenue: { [key: string]: number } = {};
    rentals.forEach((r: any) => {
      clientRevenue[r.clientName] = (clientRevenue[r.clientName] || 0) + r.totalPrice;
    });
    return Object.entries(clientRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rentals]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Title className="text-3xl font-bold text-gray-900">Dashboard</Title>
        <Text className="text-gray-500 mt-1">Resumen general del sistema</Text>
      </div>
      
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Alquileres Activos</Text>
          <Metric className="text-3xl mt-2">{activeRentals.length}</Metric>
          <Text className="text-gray-500 text-xs mt-2">De {rentals.length} totales</Text>
        </Card>
        
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Ingresos Totales</Text>
          <Metric className="text-3xl mt-2">${totalRevenue.toLocaleString()}</Metric>
          <Text className="text-green-600 text-xs mt-2">+${activeRevenue.toLocaleString()} activo</Text>
        </Card>
        
        <Card decoration="top" decorationColor="indigo" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Stock Total</Text>
          <Metric className="text-3xl mt-2">{totalStock.toLocaleString()}</Metric>
          <Text className="text-gray-500 text-xs mt-2">{products.length} productos</Text>
        </Card>
        
        <Card decoration="top" decorationColor="amber" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Clientes Registrados</Text>
          <Metric className="text-3xl mt-2">{clients.length}</Metric>
          <Text className="text-gray-500 text-xs mt-2">Activos en el sistema</Text>
        </Card>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-500 text-sm">Vencidos</Text>
              <Metric className="text-2xl">{overdueRentals.length}</Metric>
            </div>
            <Badge size="lg" color="red">⚠️</Badge>
          </div>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-500 text-sm">Próximos a Vencer</Text>
              <Metric className="text-2xl">{upcomingReturns.length}</Metric>
            </div>
            <Badge size="lg" color="orange">7 días</Badge>
          </div>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-500 text-sm">Stock Bajo</Text>
              <Metric className="text-2xl">{lowStockProducts.length}</Metric>
            </div>
            <Badge size="lg" color="yellow">&lt;10</Badge>
          </div>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-500 text-sm">Sin Stock</Text>
              <Metric className="text-2xl">{outOfStockProducts.length}</Metric>
            </div>
            <Badge size="lg" color="gray">0</Badge>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Productos Más Alquilados</Title>
          {topProducts.length > 0 ? (
            <BarList data={topProducts} className="mt-4" />
          ) : (
            <Text className="text-gray-500 text-center py-8">Sin datos</Text>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Ingresos por Cliente</Title>
          {revenueByClient.length > 0 ? (
            <BarList
              data={revenueByClient}
              className="mt-4"
              valueFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
          ) : (
            <Text className="text-gray-500 text-center py-8">Sin datos</Text>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Distribución de Stock</Title>
          {stockDistribution.length > 0 ? (
            <DonutChart
              data={stockDistribution}
              category="value"
              index="name"
              valueFormatter={(value: number) => `${value} uds`}
              className="h-48"
              colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
            />
          ) : (
            <Text className="text-gray-500 text-center py-8">Sin productos</Text>
          )}
        </Card>
      </div>
      
      {/* Active Rentals List with Filters */}
      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <Title className="text-lg font-bold">Alquileres Activos</Title>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <TextInput
              placeholder="Buscar cliente..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 md:flex-none md:w-48"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors min-w-[140px]"
            >
              <option value="all">Todos</option>
              <option value="overdue">Vencidos</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
            </select>
          </div>
        </div>
        
        {filteredActiveRentals.length === 0 ? (
          <div className="text-center py-8">
            <Text className="text-gray-400 text-3xl mb-2">📋</Text>
            <Text className="text-gray-500">No hay alquileres con los filtros aplicados</Text>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActiveRentals.map((rental: any) => {
              const returnDate = new Date(rental.returnDate);
              const daysUntilReturn = Math.ceil(
                (returnDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <Text className="font-semibold text-gray-900">{rental.clientName}</Text>
                    <Text className="text-gray-500 text-sm">
                      {rental.items.length} producto(s) | Devolución: {format(returnDate, "dd/MM/yyyy")}
                    </Text>
                  </div>
                  <div className="flex items-center gap-4">
                    <Text className="font-bold text-gray-900">${rental.totalPrice.toLocaleString()}</Text>
                    <Badge
                      color={daysUntilReturn < 0 ? 'red' : daysUntilReturn <= 3 ? 'orange' : 'green'}
                    >
                      {daysUntilReturn < 0
                        ? 'Vencido'
                        : daysUntilReturn === 0
                        ? 'Hoy'
                        : `${daysUntilReturn}d`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="shadow-sm bg-amber-50 border border-amber-200">
          <Title className="text-lg font-bold mb-4 text-amber-800">⚠️ Alertas de Stock</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockProducts.length > 0 && (
              <div>
                <Text className="font-medium text-red-700 mb-2">Sin Stock:</Text>
                <div className="space-y-1">
                  {outOfStockProducts.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-red-100 rounded">
                      <Text className="text-red-800">{product.name}</Text>
                      <Badge color="red">0 uds</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div>
                <Text className="font-medium text-yellow-700 mb-2">Stock Bajo:</Text>
                <div className="space-y-1">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                      <Text className="text-yellow-800">{product.name}</Text>
                      <Badge color="yellow">{product.stock} uds</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

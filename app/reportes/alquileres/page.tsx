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
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale/es';

export default function ReportesAlquileresPage() {
  const rentals = useStore((state: any) => state.rentals);
  const clients = useStore((state: any) => state.clients);
  const products = useStore((state: any) => state.products);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredRentals = useMemo(() => {
    return rentals.filter((r: any) => {
      const matchesSearch = searchText === '' || 
        r.clientName.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      let matchesDate = true;
      if (dateFrom) matchesDate = new Date(r.createdAt) >= new Date(dateFrom);
      if (dateTo && matchesDate) matchesDate = new Date(r.createdAt) <= new Date(dateTo);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rentals, searchText, statusFilter, dateFrom, dateTo]);

  const totalRentals = rentals.length;
  const activeRentals = rentals.filter((r: any) => r.status === 'iniciado').length;
  const sinPresupuestar = rentals.filter((r: any) => r.status === 'sin presupuestar').length;
  const presupuestados = rentals.filter((r: any) => r.status === 'presupuestado').length;
  const finalizados = rentals.filter((r: any) => r.status === 'finalizado').length;
  const totalRevenue = rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  const avgRentalValue = totalRentals > 0 ? totalRevenue / totalRentals : 0;
  const overdueRentals = rentals.filter((r: any) => r.status === 'iniciado' && new Date(r.returnDate) < new Date()).length;
  
  // Ingresos por estado
  const activeRevenue = rentals
    .filter((r: any) => r.status === 'iniciado')
    .reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  const finalizadosRevenue = rentals
    .filter((r: any) => r.status === 'finalizado')
    .reduce((sum: number, r: any) => sum + r.totalPrice, 0);

  const statusDistribution = [
    { name: 'Iniciados', value: activeRentals },
    { name: 'Finalizados', value: finalizados },
    { name: 'Presupuestados', value: presupuestados },
    { name: 'Sin presupuestar', value: sinPresupuestar },
    { name: 'Vencidos', value: overdueRentals },
  ];

  const monthlyRevenue = useMemo(() => {
    const last6Months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      last6Months[key] = 0;
    }
    rentals.forEach((r: any) => {
      const month = format(parseISO(r.createdAt), 'yyyy-MM');
      if (last6Months[month] !== undefined) {
        last6Months[month] += r.totalPrice;
      }
    });
    return Object.entries(last6Months).map(([date, revenue]) => ({
      date: format(parseISO(date + '-01'), 'MMM yy', { locale: es }),
      Ingresos: revenue,
    }));
  }, [rentals]);

  const monthlyRentals = useMemo(() => {
    const last6Months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      last6Months[key] = 0;
    }
    rentals.forEach((r: any) => {
      const month = format(parseISO(r.createdAt), 'yyyy-MM');
      if (last6Months[month] !== undefined) {
        last6Months[month]++;
      }
    });
    return Object.entries(last6Months).map(([date, count]) => ({
      date: format(parseISO(date + '-01'), 'MMM yy', { locale: es }),
      Alquileres: count,
    }));
  }, [rentals]);

  const topClients = useMemo(() => {
    const clientStats: Record<string, { name: string; count: number; total: number }> = {};
    rentals.forEach((r: any) => {
      if (!clientStats[r.clientId]) {
        clientStats[r.clientId] = { name: r.clientName, count: 0, total: 0 };
      }
      clientStats[r.clientId].count++;
      clientStats[r.clientId].total += r.totalPrice;
    });
    return Object.values(clientStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => ({
        name: c.name.length > 18 ? c.name.substring(0, 18) + '...' : c.name,
        Ingresos: c.total,
        Alquileres: c.count,
      }));
  }, [rentals]);

  const topProducts = useMemo(() => {
    const productStats: Record<string, { name: string; revenue: number }> = {};
    rentals.forEach((r: any) => {
      r.items.forEach((item: any) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName, revenue: 0 };
        }
        productStats[item.productId].revenue += item.totalPrice;
      });
    });
    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
        Ingresos: p.revenue,
      }));
  }, [rentals]);

  return (
    <div className="space-y-6">

      <Card className="shadow-sm border border-gray-200">
        <div className="mb-3">
          <Text className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente</label>
            <TextInput
              placeholder="Buscar por cliente..."
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
              <option value="all">Todos los estados</option>
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Total</Text>
          <Metric className="text-xl">{totalRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Iniciados</Text>
          <Metric className="text-xl">{activeRentals}</Metric>
          <Text className="text-xs text-gray-400 mt-1">${activeRevenue.toLocaleString()}</Text>
        </Card>
        <Card decoration="top" decorationColor="gray" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Finalizados</Text>
          <Metric className="text-xl">{finalizados}</Metric>
          <Text className="text-xs text-gray-400 mt-1">${finalizadosRevenue.toLocaleString()}</Text>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Presupuestados</Text>
          <Metric className="text-xl">{presupuestados}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Vencidos</Text>
          <Metric className="text-xl">{overdueRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Ingresos Total</Text>
          <Metric className="text-xl">${totalRevenue.toLocaleString()}</Metric>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Ingresos Mensuales</Title>
          <AreaChart
            data={monthlyRevenue}
            index="date"
            categories={['Ingresos']}
            colors={['indigo']}
            valueFormatter={(n: number) => `$${n.toLocaleString()}`}
            yAxisWidth={80}
            className="h-72"
            showAnimation={true}
          />
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Alquileres por Mes</Title>
          <BarChart
            data={monthlyRentals}
            index="date"
            categories={['Alquileres']}
            colors={['slate']}
            yAxisWidth={40}
            className="h-72"
            showAnimation={true}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Estado de Alquileres</Title>
          <DonutChart
            data={statusDistribution.filter(s => s.value > 0)}
            category="value"
            index="name"
            colors={['green', 'slate', 'yellow', 'gray', 'rose']}
            className="h-64"
            showAnimation={true}
            valueFormatter={(value: number) => `${value} alquileres`}
          />
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Top Clientes por Ingresos</Title>
          {topClients.length > 0 ? (
            <BarChart
              data={topClients}
              index="name"
              categories={['Ingresos']}
              colors={['emerald']}
              valueFormatter={(n: number) => `$${n.toLocaleString()}`}
              yAxisWidth={120}
              className="h-64"
              layout="vertical"
              showAnimation={true}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Productos Más Rentables</Title>
          {topProducts.length > 0 ? (
            <BarChart
              data={topProducts}
              index="name"
              categories={['Ingresos']}
              colors={['indigo']}
              valueFormatter={(n: number) => `$${n.toLocaleString()}`}
              yAxisWidth={120}
              className="h-64"
              layout="vertical"
              showAnimation={true}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>
      </div>

      <Card className="shadow-sm">
        <Title className="text-lg font-bold mb-4">Detalle de Alquileres ({filteredRentals.length})</Title>
        {filteredRentals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Text className="text-3xl mb-2">📋</Text>
            <Text>No hay alquileres con los filtros aplicados</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Devolución</th>
                  <th className="text-left p-3 font-medium">Productos</th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRentals.slice(0, 10).map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{r.id.slice(-6)}</td>
                    <td className="p-3 font-medium">{r.clientName}</td>
                    <td className="p-3 text-gray-600">{format(parseISO(r.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="p-3 text-gray-600">{format(parseISO(r.returnDate), 'dd/MM/yyyy')}</td>
                    <td className="p-3">{r.items.length} items</td>
                    <td className="p-3 font-semibold">${r.totalPrice.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.status === 'iniciado' 
                          ? new Date(r.returnDate) < new Date() 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                          : r.status === 'presupuestado'
                          ? 'bg-blue-100 text-blue-700'
                          : r.status === 'sin presupuestar'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {r.status === 'iniciado' 
                          ? new Date(r.returnDate) < new Date() ? 'Vencido' : 'Iniciado'
                          : r.status === 'presupuestado' ? 'Presupuestado'
                          : r.status === 'sin presupuestar' ? 'Sin presupuestar'
                          : 'Finalizado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRentals.length > 10 && (
              <div className="text-center py-3 text-gray-500 text-sm">
                Mostrando 10 de {filteredRentals.length} alquileres
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}


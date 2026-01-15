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
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';
import { format, parseISO } from 'date-fns';
import { Client } from '@/types';

export default function ReportesClientesPage() {
  const clients = useStore((state: any) => state.clients);
  const rentals = useStore((state: any) => state.rentals);

  const [searchText, setSearchText] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  const clientStats = useMemo(() => {
    return clients.map((client: Client) => {
      const clientRentals = rentals.filter((r: any) => r.clientId === client.id);
      const totalSpent = clientRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const activeRentals = clientRentals.filter((r: any) => r.status === 'active').length;
      const lastRental = clientRentals.length > 0 
        ? clientRentals.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;
      return { 
        ...client, 
        totalSpent, 
        totalRentals: clientRentals.length, 
        activeRentals,
        lastRentalDate: lastRental?.createdAt 
      };
    });
  }, [clients, rentals]);

  const filteredClients = useMemo(() => {
    return clientStats.filter((client: any) => {
      const matchesSearch = searchText === '' || 
        client.name.toLowerCase().includes(searchText.toLowerCase()) ||
        client.email.toLowerCase().includes(searchText.toLowerCase());
      let matchesActivity = true;
      if (activityFilter === 'active') matchesActivity = client.activeRentals > 0;
      if (activityFilter === 'inactive') matchesActivity = client.activeRentals === 0 && client.totalRentals > 0;
      if (activityFilter === 'new') matchesActivity = client.totalRentals === 0;
      return matchesSearch && matchesActivity;
    });
  }, [clientStats, searchText, activityFilter]);

  const totalClients = clients.length;
  const clientsWithActiveRentals = clientStats.filter((c: any) => c.activeRentals > 0).length;
  const totalRevenue = rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
  const clientsWithRentals = clientStats.filter((c: any) => c.totalRentals > 0).length;
  const newClients = clientStats.filter((c: any) => c.totalRentals === 0).length;

  const topClientsByRevenue = useMemo(() => {
    return [...clientStats]
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        Ingresos: c.totalSpent,
      }));
  }, [clientStats]);

  const topClientsByRentals = useMemo(() => {
    return [...clientStats]
      .sort((a: any, b: any) => b.totalRentals - a.totalRentals)
      .slice(0, 5)
      .map((c: any) => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        Alquileres: c.totalRentals,
      }));
  }, [clientStats]);

  const clientActivityDistribution = [
    { name: 'Con alquileres activos', value: clientsWithActiveRentals },
    { name: 'Sin alquileres activos', value: clientsWithRentals - clientsWithActiveRentals },
    { name: 'Sin alquileres', value: newClients },
  ];

  const revenueDistribution = useMemo(() => {
    const high = clientStats.filter((c: any) => c.totalSpent > 5000).length;
    const medium = clientStats.filter((c: any) => c.totalSpent >= 1000 && c.totalSpent <= 5000).length;
    const low = clientStats.filter((c: any) => c.totalSpent > 0 && c.totalSpent < 1000).length;
    const none = clientStats.filter((c: any) => c.totalSpent === 0).length;
    return [
      { name: 'Alto (>$5k)', value: high },
      { name: 'Medio ($1k-$5k)', value: medium },
      { name: 'Bajo (<$1k)', value: low },
      { name: 'Sin compras', value: none },
    ];
  }, [clientStats]);

  return (
    <div className="space-y-6">
      <div>
        <Title className="text-3xl font-bold text-gray-900">Reportes de Clientes</Title>
        <Text className="text-gray-500 mt-1">Análisis de clientes y comportamiento</Text>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <div className="mb-3">
          <Text className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</Text>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar Cliente</label>
            <TextInput
              placeholder="Nombre o email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Actividad</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
            >
              <option value="all">Todos los clientes</option>
              <option value="active">Con alquileres activos</option>
              <option value="inactive">Sin alquileres activos</option>
              <option value="new">Sin ningún alquiler</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Total Clientes</Text>
          <Metric className="text-xl">{totalClients}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Con Activos</Text>
          <Metric className="text-xl">{clientsWithActiveRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="gray" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Con Historial</Text>
          <Metric className="text-xl">{clientsWithRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Nuevos</Text>
          <Metric className="text-xl">{newClients}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Ingresos Total</Text>
          <Metric className="text-xl">${totalRevenue.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="purple" className="shadow-sm">
          <Text className="text-gray-500 text-xs">Prom/Cliente</Text>
          <Metric className="text-xl">${Math.round(avgRevenuePerClient).toLocaleString()}</Metric>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Top Clientes por Ingresos</Title>
          {topClientsByRevenue.length > 0 ? (
            <BarChart
              data={topClientsByRevenue}
              index="name"
              categories={['Ingresos']}
              colors={['emerald']}
              valueFormatter={(n: number) => `$${n.toLocaleString()}`}
              yAxisWidth={64}
              className="h-72"
              showAnimation={true}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Top Clientes por Alquileres</Title>
          {topClientsByRentals.length > 0 ? (
            <BarChart
              data={topClientsByRentals}
              index="name"
              categories={['Alquileres']}
              colors={['cyan']}
              yAxisWidth={32}
              className="h-72"
              showAnimation={true}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">Sin datos</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Actividad de Clientes</Title>
          <DonutChart
            data={clientActivityDistribution}
            category="value"
            index="name"
            colors={['emerald', 'slate', 'amber']}
            className="h-64"
            showAnimation={true}
            valueFormatter={(value: number) => `${value} clientes`}
          />
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Distribución por Ingresos</Title>
          <DonutChart
            data={revenueDistribution}
            category="value"
            index="name"
            colors={['emerald', 'cyan', 'amber', 'rose']}
            className="h-64"
            showAnimation={true}
            valueFormatter={(value: number) => `$${value.toLocaleString()}`}
          />
        </Card>
      </div>

      <Card className="shadow-sm">
        <Title className="text-lg font-bold mb-4">Detalle de Clientes ({filteredClients.length})</Title>
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Text className="text-3xl mb-2">👥</Text>
            <Text>No hay clientes con los filtros aplicados</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Teléfono</th>
                  <th className="text-left p-3 font-medium">Alquileres</th>
                  <th className="text-left p-3 font-medium">Activos</th>
                  <th className="text-left p-3 font-medium">Total Gastado</th>
                  <th className="text-left p-3 font-medium">Último Alquiler</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredClients
                  .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
                  .slice(0, 15)
                  .map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-gray-600">{c.email}</td>
                      <td className="p-3 text-gray-600">{c.phone}</td>
                      <td className="p-3 text-center">{c.totalRentals}</td>
                      <td className="p-3 text-center">
                        {c.activeRentals > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {c.activeRentals}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold">${c.totalSpent.toLocaleString()}</td>
                      <td className="p-3 text-gray-600">
                        {c.lastRentalDate ? format(parseISO(c.lastRentalDate), 'dd/MM/yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {filteredClients.length > 15 && (
              <div className="text-center py-3 text-gray-500 text-sm">
                Mostrando 15 de {filteredClients.length} clientes
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}


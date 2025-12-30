'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  TextInput,
  Badge,
  Metric,
  Select,
  SelectItem,
} from '@tremor/react';
import { Client } from '@/types';
import { format } from 'date-fns';

export default function ClientesPage() {
  const clients = useStore((state: any) => state.clients);
  const obras = useStore((state: any) => state.obras);
  const rentals = useStore((state: any) => state.rentals);
  const addClient = useStore((state: any) => state.addClient);
  const updateClient = useStore((state: any) => state.updateClient);
  const deleteClient = useStore((state: any) => state.deleteClient);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  const [searchText, setSearchText] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  const clientStats = useMemo(() => {
    return clients.map((client: Client) => {
      const clientRentals = rentals.filter((r: any) => r.clientId === client.id);
      const totalSpent = clientRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
      const activeRentals = clientRentals.filter((r: any) => r.status === 'active').length;
      return { ...client, totalSpent, totalRentals: clientRentals.length, activeRentals };
    });
  }, [clients, rentals]);

  const filteredClients = useMemo(() => {
    return clientStats.filter((client: any) => {
      const matchesSearch = searchText === '' || 
        client.name.toLowerCase().includes(searchText.toLowerCase()) ||
        client.email.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesActivity = true;
      if (activityFilter === 'active') matchesActivity = client.activeRentals > 0;
      if (activityFilter === 'inactive') matchesActivity = client.activeRentals === 0;
      
      return matchesSearch && matchesActivity;
    });
  }, [clientStats, searchText, activityFilter]);

  const clientObras = useMemo(() => {
    if (!selectedClientId) return [];
    return obras.filter((o: any) => o.clientId === selectedClientId);
  }, [obras, selectedClientId]);

  const clientRentals = useMemo(() => {
    if (!selectedClientId) return [];
    return rentals.filter((r: any) => r.clientId === selectedClientId);
  }, [rentals, selectedClientId]);

  const totalClients = clients.length;
  const clientsWithActiveRentals = useMemo(() => {
    const activeClientIds = new Set(rentals.filter((r: any) => r.status === 'active').map((r: any) => r.clientId));
    return activeClientIds.size;
  }, [rentals]);
  const totalRevenue = rentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);

  const openAddDialog = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, email: client.email, phone: client.phone, address: client.address });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    setIsDialogOpen(false);
  };

  const selectedClient = clientStats.find((c: any) => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title className="text-3xl font-bold text-gray-900">Clientes</Title>
          <Text className="text-gray-500 mt-1">Gestiona la información de tus clientes</Text>
        </div>
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="text-lg">+</span>
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Total Clientes</Text>
          <Metric className="text-2xl">{totalClients}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Con Alquileres Activos</Text>
          <Metric className="text-2xl">{clientsWithActiveRentals}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Ingresos Totales</Text>
          <Metric className="text-2xl">${totalRevenue.toLocaleString()}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Promedio/Cliente</Text>
          <Metric className="text-2xl">${totalClients > 0 ? Math.round(totalRevenue / totalClients).toLocaleString() : 0}</Metric>
        </Card>
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
              className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Con alquileres activos</option>
              <option value="inactive">Sin alquileres activos</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-md rounded-2xl">
            <Title className="text-lg font-bold mb-4">Lista de Clientes</Title>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredClients.map((client: any) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedClientId === client.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Text className="font-semibold text-gray-900">{client.name}</Text>
                      <Text className="text-gray-500 text-sm">{client.email}</Text>
                    </div>
                    {client.activeRentals > 0 && (
                      <Badge color="green" size="sm">{client.activeRentals}</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <Text className="text-gray-500">{client.totalRentals} alquileres</Text>
                    <Text className="font-medium text-gray-700">${client.totalSpent.toLocaleString()}</Text>
                  </div>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div className="text-center py-8">
                  <Text className="text-gray-400 text-3xl mb-2">👥</Text>
                  <Text className="text-gray-500 text-sm">No se encontraron clientes</Text>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-md rounded-2xl h-full">
            {selectedClient ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Title className="text-2xl font-bold">{selectedClient.name}</Title>
                    <div className="mt-2 space-y-1 text-sm">
                      <Text className="text-gray-600">📧 {selectedClient.email}</Text>
                      <Text className="text-gray-600">📞 {selectedClient.phone}</Text>
                      <Text className="text-gray-600">📍 {selectedClient.address}</Text>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditDialog(selectedClient)} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md">Editar</button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este cliente?')) {
                          deleteClient(selectedClient.id);
                          setSelectedClientId(null);
                        }
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Text className="text-blue-600 text-xs">Obras</Text>
                    <Text className="text-xl font-bold text-blue-700">{clientObras.length}</Text>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <Text className="text-green-600 text-xs">Alquileres Activos</Text>
                    <Text className="text-xl font-bold text-green-700">{selectedClient.activeRentals}</Text>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <Text className="text-indigo-600 text-xs">Total Gastado</Text>
                    <Text className="text-xl font-bold text-indigo-700">${selectedClient.totalSpent.toLocaleString()}</Text>
                  </div>
                </div>

                <div>
                  <Title className="text-lg font-bold mb-3">Obras</Title>
                  {clientObras.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Text className="text-gray-500">Sin obras registradas</Text>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clientObras.map((obra: any) => (
                        <div key={obra.id} className="border border-gray-200 rounded-xl p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <Text className="font-medium text-sm">{obra.name}</Text>
                              {obra.description && (
                                <Text className="text-xs text-gray-500 mt-0.5">{obra.description}</Text>
                              )}
                            </div>
                            <Badge color={obra.status === 'active' ? 'green' : obra.status === 'completed' ? 'gray' : 'yellow'} size="sm">
                              {obra.status === 'active' ? 'Activa' : obra.status === 'completed' ? 'Finalizada' : 'Pausada'}
                            </Badge>
                          </div>
                          {obra.address && (
                            <Text className="text-xs text-gray-600">📍 {obra.address}</Text>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Title className="text-lg font-bold mb-3">Historial de Alquileres</Title>
                  {clientRentals.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Text className="text-gray-500">Sin alquileres registrados</Text>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {clientRentals.map((rental: any) => (
                        <div key={rental.id} className="border border-gray-200 rounded-xl p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Text className="font-medium text-sm">{rental.workName}</Text>
                              <Text className="text-xs text-gray-500">#{rental.id.slice(-6)} - {format(new Date(rental.createdAt), 'dd/MM/yyyy')}</Text>
                            </div>
                            <Badge color={rental.status === 'active' ? 'green' : 'gray'} size="sm">
                              {rental.status === 'active' ? 'Activo' : 'Devuelto'}
                            </Badge>
                          </div>
                          <div className="bg-gray-50 rounded p-2 mb-2 text-xs">
                            {rental.items.map((item: any, idx: number) => (
                              <Text key={idx} className="text-gray-600">• {item.productName} ×{item.quantity}</Text>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs">
                            <Text className="text-gray-500">Devolución: {format(new Date(rental.returnDate), 'dd/MM/yyyy')}</Text>
                            <Text className="font-bold">${rental.totalPrice.toLocaleString()}</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <Text className="text-gray-400 text-4xl mb-3">👈</Text>
                  <Text className="text-gray-500">Selecciona un cliente</Text>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <Title className="text-xl font-bold mb-6">{editingClient ? `Edición de ${editingClient.name}` : 'Nuevo Cliente'}</Title>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <TextInput value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre completo o razón social" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <TextInput type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <TextInput value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+54 11 1234-5678" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <TextInput value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Dirección completa" required />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg">{editingClient ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}

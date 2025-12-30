'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/store';
import {
  Card,
  Title,
  Text,
  TextInput,
  Textarea,
  Badge,
  Metric,
} from '@tremor/react';
import { Obra } from '@/types';
import { format } from 'date-fns';

export default function ObrasPage() {
  const obras = useStore((state: any) => state.obras);
  const clients = useStore((state: any) => state.clients);
  const rentals = useStore((state: any) => state.rentals);
  const addObra = useStore((state: any) => state.addObra);
  const updateObra = useStore((state: any) => state.updateObra);
  const deleteObra = useStore((state: any) => state.deleteObra);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    address: '',
    status: 'active' as 'active' | 'completed' | 'paused',
  });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  const filteredObras = useMemo(() => {
    return obras.filter((obra: Obra) => {
      const matchesSearch = searchText === '' || 
        obra.name.toLowerCase().includes(searchText.toLowerCase()) ||
        obra.clientName.toLowerCase().includes(searchText.toLowerCase()) ||
        (obra.description && obra.description.toLowerCase().includes(searchText.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || obra.status === statusFilter;
      const matchesClient = clientFilter === 'all' || obra.clientId === clientFilter;
      
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [obras, searchText, statusFilter, clientFilter]);

  const openAddDialog = () => {
    setEditingObra(null);
    setFormData({
      clientId: '',
      name: '',
      description: '',
      address: '',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (obra: Obra) => {
    setEditingObra(obra);
    setFormData({
      clientId: obra.clientId,
      name: obra.name,
      description: obra.description || '',
      address: obra.address || '',
      status: obra.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.name) return;
    
    if (editingObra) {
      updateObra(editingObra.id, formData);
    } else {
      addObra(formData);
    }
    setIsDialogOpen(false);
  };

  const totalObras = obras.length;
  const activeObras = obras.filter((o: Obra) => o.status === 'active').length;
  const completedObras = obras.filter((o: Obra) => o.status === 'completed').length;
  const pausedObras = obras.filter((o: Obra) => o.status === 'paused').length;

  const obrasWithActiveRentals = useMemo(() => {
    const activeRentalWorkIds = new Set(
      rentals.filter((r: any) => r.status === 'active').map((r: any) => r.workId)
    );
    return obras.filter((o: Obra) => activeRentalWorkIds.has(o.id)).length;
  }, [obras, rentals]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'completed':
        return 'gray';
      case 'paused':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Finalizada';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title className="text-2xl sm:text-3xl font-bold text-gray-900">Obras</Title>
          <Text className="text-gray-500 mt-1 text-sm sm:text-base">Gestiona las obras de tus clientes</Text>
        </div>
        <button
          onClick={openAddDialog}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
        >
          <span className="text-lg">+</span>
          Nueva Obra
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <Card decoration="top" decorationColor="blue" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Total Obras</Text>
          <Metric className="text-2xl">{totalObras}</Metric>
        </Card>
        <Card decoration="top" decorationColor="green" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Activas</Text>
          <Metric className="text-2xl">{activeObras}</Metric>
        </Card>
        <Card decoration="top" decorationColor="gray" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Finalizadas</Text>
          <Metric className="text-2xl">{completedObras}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Pausadas</Text>
          <Metric className="text-2xl">{pausedObras}</Metric>
        </Card>
        <Card decoration="top" decorationColor="indigo" className="shadow-md rounded-2xl">
          <Text className="text-gray-500 text-sm">Con Alquileres</Text>
          <Metric className="text-2xl">{obrasWithActiveRentals}</Metric>
        </Card>
      </div>

      <Card className="shadow-md border border-gray-200 rounded-2xl">
        <div className="mb-3">
          <Text className="text-sm font-semibold text-gray-700">Filtros de Búsqueda</Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar Obra</label>
            <TextInput
              placeholder="Nombre, cliente o descripción..."
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
              className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="completed">Finalizadas</option>
              <option value="paused">Pausadas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
            >
              <option value="all">Todos</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredObras.map((obra: Obra) => {
          const obraRentals = rentals.filter((r: any) => r.workId === obra.id);
          const activeRentals = obraRentals.filter((r: any) => r.status === 'active').length;
          const totalRevenue = obraRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
          
          return (
            <Card key={obra.id} className="shadow-md hover:shadow-xl transition-all rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-3">
                  <Text className="font-semibold text-lg text-gray-900">{obra.name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{obra.clientName}</Text>
                  {obra.description && (
                    <Text className="text-gray-500 text-sm mt-2 line-clamp-2">{obra.description}</Text>
                  )}
                </div>
                <Badge
                  size="lg"
                  color={getStatusColor(obra.status)}
                >
                  {getStatusLabel(obra.status)}
                </Badge>
              </div>

              {obra.address && (
                <div className="mb-3">
                  <Text className="text-gray-400 text-xs uppercase">Dirección</Text>
                  <Text className="text-gray-600 text-sm mt-0.5">📍 {obra.address}</Text>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Text className="text-gray-400 text-xs uppercase">Alquileres</Text>
                    <Text className="font-semibold text-gray-900">{obraRentals.length}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-400 text-xs uppercase">Activos</Text>
                    <Text className="font-semibold text-green-600">{activeRentals}</Text>
                  </div>
                </div>
                <div className="mb-3">
                  <Text className="text-gray-400 text-xs uppercase">Ingresos Totales</Text>
                  <Text className="font-bold text-xl text-gray-900">${totalRevenue.toLocaleString()}</Text>
                </div>
                <div className="mb-3">
                  <Text className="text-gray-400 text-xs uppercase">Creada</Text>
                  <Text className="text-gray-600 text-sm">{format(new Date(obra.createdAt), 'dd/MM/yyyy')}</Text>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditDialog(obra)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta obra?')) deleteObra(obra.id);
                    }}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredObras.length === 0 && (
        <Card className="shadow-md rounded-2xl">
          <div className="text-center py-12">
            <Text className="text-gray-400 text-4xl mb-3">🏗️</Text>
            <Text className="text-gray-500">No se encontraron obras con los filtros aplicados</Text>
          </div>
        </Card>
      )}

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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 my-auto">
            <Title className="text-xl font-bold mb-6">
              {editingObra ? `Edición de ${editingObra.name}` : 'Nueva Obra'}
            </Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Obra *</label>
                <TextInput
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Edificio Residencial Palermo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la obra..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <TextInput
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección de la obra..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'paused' })}
                  className="w-full rounded-xl border border-gray-300 pl-4 pr-3 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all shadow-sm"
                >
                  <option value="active">Activa</option>
                  <option value="completed">Finalizada</option>
                  <option value="paused">Pausada</option>
                </select>
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
                  {editingObra ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


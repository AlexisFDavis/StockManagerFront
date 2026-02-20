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
  BarChart,
  TextInput,
} from '@tremor/react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const products = useStore((state: any) => state.products);
  const rentals = useStore((state: any) => state.rentals);
  const clients = useStore((state: any) => state.clients);
  const obras = useStore((state: any) => state.obras);

  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [timeFilterProducts, setTimeFilterProducts] = useState<'30days' | 'all'>('30days');
  const [timeFilterClients, setTimeFilterClients] = useState<'30days' | 'all'>('30days');
  const [isRentalsExpanded, setIsRentalsExpanded] = useState(false);
  const [isStockAlertsExpanded, setIsStockAlertsExpanded] = useState(false);
  const [isObrasCobrarExpanded, setIsObrasCobrarExpanded] = useState(false);
  
  const activeRentals = useMemo(
    () => rentals.filter((r: any) => r.status === 'iniciado'),
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
    () => products.reduce((sum: number, p: any) => sum + p.stockTotal, 0),
    [products]
  );

  const stockActual = useMemo(
    () => products.reduce((sum: number, p: any) => sum + p.stockActual, 0),
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

  const overdueRentalsAmount = useMemo(() => {
    return overdueRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  }, [overdueRentals]);

  const upcomingReturnsAmount = useMemo(() => {
    return upcomingReturns.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  }, [upcomingReturns]);

  const activeRentalsAmount = useMemo(() => {
    return activeRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  }, [activeRentals]);

  // Alquileres presupuestados: alquileres con estado 'presupuestado'
  const presupuestadosRentals = useMemo(() => {
    return rentals.filter((r: any) => r.status === 'presupuestado');
  }, [rentals]);

  const presupuestadosRentalsAmount = useMemo(() => {
    return presupuestadosRentals.reduce((sum: number, r: any) => sum + r.totalPrice, 0);
  }, [presupuestadosRentals]);

  // Presupuestos a confirmar: alquileres con estado 'sin presupuestar' o 'presupuestado'
  const presupuestosAConfirmar = useMemo(() => {
    return rentals.filter((r: any) => 
      r.status === 'sin presupuestar' || r.status === 'presupuestado'
    );
  }, [rentals]);

  const lowStockProducts = useMemo(
    () => products.filter((p: any) => p.stockActual < 10 && p.stockActual > 0),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((p: any) => p.stockActual === 0),
    [products]
  );

  const stockDistribution = useMemo(() => {
    return products.map((p: any) => ({
      name: p.name,
      value: p.stockTotal,
    }));
  }, [products]);

  // Stock disponible por producto (Total - Alquilado)
  const productStockInfo = useMemo(() => {
    return products.map((product: any) => {
      // Calcular cuánto está alquilado actualmente
      const alquilado = activeRentals.reduce((sum: number, rental: any) => {
        const item = rental.items.find((i: any) => i.productId === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      
      // Obtener obras donde se alquiló este producto
      const obrasAlquiladas = activeRentals
        .filter((rental: any) => 
          rental.items.some((i: any) => i.productId === product.id)
        )
        .map((rental: any) => ({
          obraName: rental.workName,
          clientName: rental.clientName,
          quantity: rental.items.find((i: any) => i.productId === product.id)?.quantity || 0,
        }));

      return {
        id: product.id,
        name: product.name,
        stockTotal: product.stockTotal,
        stockAlquilado: alquilado,
        stockDisponible: product.stockTotal - alquilado,
        obrasAlquiladas: obrasAlquiladas,
      };
    });
  }, [products, activeRentals]);

  // Datos para el gráfico de stock disponible
  const stockDisponibleChart = useMemo(() => {
    return productStockInfo
      .filter((p: any) => p.stockTotal > 0)
      .map((p: any) => ({
        name: p.name,
        'Disponible': p.stockDisponible,
        'Alquilado': p.stockAlquilado,
      }))
      .slice(0, 10); // Top 10 productos
  }, [productStockInfo]);

  const topProducts = useMemo(() => {
    const productCounts: { [key: string]: number } = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredRentals = timeFilterProducts === '30days' 
      ? rentals.filter((r: any) => new Date(r.createdAt) >= thirtyDaysAgo)
      : rentals;
    
    filteredRentals.forEach((r: any) => {
      r.items.forEach((item: any) => {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
      });
    });
    return Object.entries(productCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rentals, timeFilterProducts]);

  const revenueByClient = useMemo(() => {
    const clientRevenue: { [key: string]: number } = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredRentals = timeFilterClients === '30days' 
      ? rentals.filter((r: any) => new Date(r.createdAt) >= thirtyDaysAgo)
      : rentals;
    
    filteredRentals.forEach((r: any) => {
      clientRevenue[r.clientName] = (clientRevenue[r.clientName] || 0) + r.totalPrice;
    });
    return Object.entries(clientRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rentals, timeFilterClients]);

  const obrasWithWarning = useMemo(() => {
    return obras.filter((o: any) => 
      o.status === 'active' && (o.resto || 0) === (o.totalPrice || 0) && (o.totalPrice || 0) > 0
    );
  }, [obras]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card decoration="top" decorationColor="red" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Alquileres Vencidos</Text>
          <Metric className="text-3xl mt-2">{overdueRentals.length}</Metric>
          <Text className="text-red-600 text-xs mt-2 font-semibold">${overdueRentalsAmount.toLocaleString()}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="orange" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Próximos a Cobrar (7 días)</Text>
          <Metric className="text-3xl mt-2">{upcomingReturns.length}</Metric>
          <Text className="text-orange-600 text-xs mt-2 font-semibold">${upcomingReturnsAmount.toLocaleString()}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="blue" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Alquileres Presupuestados</Text>
          <Metric className="text-3xl mt-2">{presupuestadosRentals.length}</Metric>
          <Text className="text-blue-600 text-xs mt-2 font-semibold">${presupuestadosRentalsAmount.toLocaleString()}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="green" className="shadow-sm">
          <Text className="text-gray-500 text-sm">Alquileres Activos</Text>
          <Metric className="text-3xl mt-2">{activeRentals.length}</Metric>
          <Text className="text-green-600 text-xs mt-2 font-semibold">${activeRentalsAmount.toLocaleString()}</Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Stock Disponible por Producto</Title>
          {productStockInfo.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {productStockInfo.map((product: any) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Text className="font-semibold text-sm text-gray-900">{product.name}</Text>
                      <div className="mt-2 flex gap-4 text-xs">
                        <div>
                          <Text className="text-gray-500">Total:</Text>
                          <Text className="font-semibold text-gray-900 ml-1">{product.stockTotal}</Text>
                        </div>
                        <div>
                          <Text className="text-gray-500">Alquilado:</Text>
                          <Text className="font-semibold text-orange-600 ml-1">{product.stockAlquilado}</Text>
                        </div>
                        <div>
                          <Text className="text-gray-500">Disponible:</Text>
                          <Text className={`font-semibold ml-1 ${
                            product.stockDisponible > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.stockDisponible}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      color={product.stockDisponible > 0 ? 'green' : 'red'} 
                      size="sm"
                    >
                      {product.stockDisponible > 0 ? 'Disponible' : 'Sin Stock'}
                    </Badge>
                  </div>
                  {product.obrasAlquiladas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs font-medium text-gray-600 mb-2">Alquilado en:</Text>
                      <div className="space-y-1">
                        {product.obrasAlquiladas.map((obra: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <Text className="text-gray-600">
                              {obra.obraName} - {obra.clientName}
                            </Text>
                            <Badge color="blue" size="xs">
                              {obra.quantity} uds
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-gray-500 text-center py-8">Sin productos</Text>
          )}
        </Card>

        <Card className="shadow-sm">
          <Title className="text-lg font-bold mb-4">Presupuestos a Confirmar</Title>
          {presupuestosAConfirmar.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {presupuestosAConfirmar.map((rental: any) => (
                <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Text className="font-semibold text-sm text-gray-900">{rental.workName}</Text>
                      <Text className="text-xs text-gray-600 mt-1">{rental.clientName}</Text>
                      <div className="mt-2 flex gap-4 text-xs">
                        <div>
                          <Text className="text-gray-500">Total:</Text>
                          <Text className="font-semibold text-gray-900 ml-1">${(rental.totalPrice || 0).toLocaleString()}</Text>
                        </div>
                        <div>
                          <Text className="text-gray-500">Productos:</Text>
                          <Text className="font-semibold text-gray-900 ml-1">{rental.items.length}</Text>
                        </div>
                        <div>
                          <Text className="text-gray-500">Creado:</Text>
                          <Text className="font-semibold text-gray-900 ml-1">
                            {format(new Date(rental.createdAt), 'dd/MM/yyyy')}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      color={rental.status === 'presupuestado' ? 'blue' : 'gray'} 
                      size="sm"
                    >
                      {rental.status === 'presupuestado' ? 'Presupuestado' : 'Sin presupuestar'}
                    </Badge>
                  </div>
                  {rental.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs font-medium text-gray-600 mb-2">Productos:</Text>
                      <div className="space-y-1">
                        {rental.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <Text className="text-gray-600">
                              {item.productName}
                            </Text>
                            <Badge color="blue" size="xs">
                              {item.quantity} uds × ${item.unitPrice.toLocaleString()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-gray-500 text-center py-8">No hay presupuestos pendientes</Text>
          )}
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Title className="text-lg font-bold">Alquileres Activos</Title>
            <button
              onClick={() => setIsRentalsExpanded(!isRentalsExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isRentalsExpanded ? 'Ocultar' : 'Mostrar'}
            >
              {isRentalsExpanded ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
          {isRentalsExpanded && (
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
          )}
        </div>
        
        {isRentalsExpanded && (
          <>
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
          </>
        )}
      </Card>

      {((lowStockProducts.length > 0 || outOfStockProducts.length > 0) || obrasWithWarning.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <Card className="shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Title className="text-lg font-bold">⚠️ Alertas de Stock</Title>
                <button
                  onClick={() => setIsStockAlertsExpanded(!isStockAlertsExpanded)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isStockAlertsExpanded ? 'Ocultar' : 'Mostrar'}
                >
                  {isStockAlertsExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {isStockAlertsExpanded && (
                <div className="space-y-3">
                {outOfStockProducts.map((product: any) => (
                  <div key={product.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Text className="font-semibold text-sm text-gray-900">{product.name}</Text>
                        <div className="mt-2 flex gap-4 text-xs">
                          <div>
                            <Text className="text-gray-500">Stock Actual:</Text>
                            <Text className="font-semibold text-red-600 ml-1">0</Text>
                          </div>
                          <div>
                            <Text className="text-gray-500">Stock Total:</Text>
                            <Text className="font-semibold text-gray-900 ml-1">{product.stockTotal}</Text>
                          </div>
                        </div>
                      </div>
                      <Badge color="red" size="sm">
                        Sin Stock
                      </Badge>
                    </div>
                  </div>
                ))}
                {lowStockProducts.map((product: any) => (
                  <div key={product.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Text className="font-semibold text-sm text-gray-900">{product.name}</Text>
                        <div className="mt-2 flex gap-4 text-xs">
                          <div>
                            <Text className="text-gray-500">Stock Actual:</Text>
                            <Text className="font-semibold text-yellow-600 ml-1">{product.stockActual}</Text>
                          </div>
                          <div>
                            <Text className="text-gray-500">Stock Total:</Text>
                            <Text className="font-semibold text-gray-900 ml-1">{product.stockTotal}</Text>
                          </div>
                        </div>
                      </div>
                      <Badge color="yellow" size="sm">
                        Stock Bajo
                      </Badge>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </Card>
          )}

          {obrasWithWarning.length > 0 && (
            <Card className="shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Title className="text-lg font-bold">⚠️ Obras a Cobrar</Title>
                <button
                  onClick={() => setIsObrasCobrarExpanded(!isObrasCobrarExpanded)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isObrasCobrarExpanded ? 'Ocultar' : 'Mostrar'}
                >
                  {isObrasCobrarExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              {isObrasCobrarExpanded && (
                <div className="space-y-3">
                {obrasWithWarning.map((obra: any) => (
                  <div key={obra.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Text className="font-semibold text-sm text-gray-900">{obra.name}</Text>
                        <Text className="text-xs text-gray-600 mt-1">{obra.clientName}</Text>
                        <div className="mt-2 flex gap-4 text-xs">
                          <div>
                            <Text className="text-gray-500">Total:</Text>
                            <Text className="font-semibold text-gray-900 ml-1">${(obra.totalPrice || 0).toLocaleString()}</Text>
                          </div>
                          <div>
                            <Text className="text-gray-500">Pagado:</Text>
                            <Text className="font-semibold text-green-600 ml-1">${(obra.pagado || 0).toLocaleString()}</Text>
                          </div>
                          <div>
                            <Text className="text-gray-500">Resto:</Text>
                            <Text className="font-semibold text-red-600 ml-1">${(obra.resto || 0).toLocaleString()}</Text>
                          </div>
                        </div>
                      </div>
                      <Badge color="yellow" size="sm">
                        Pendiente
                      </Badge>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

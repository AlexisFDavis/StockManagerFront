'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Button } from '@tremor/react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/alquileres', label: 'Alquileres', icon: '📋' },
  { path: '/clientes', label: 'Clientes', icon: '👥' },
  { path: '/reportes/inventario', label: 'Rep. Inventario', icon: '📈' },
  { path: '/reportes/alquileres', label: 'Rep. Alquileres', icon: '📉' },
  { path: '/reportes/clientes', label: 'Rep. Clientes', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStore((state: any) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Stock Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Sistema de Alquileres</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Button
              key={item.path}
              onClick={() => router.push(item.path)}
              variant={isActive ? 'primary' : 'secondary'}
              className={`w-full justify-start ${
                isActive ? 'bg-blue-600 text-white' : ''
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleLogout}
          variant="secondary"
          className="w-full"
        >
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}


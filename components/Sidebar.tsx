'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Button } from '@tremor/react';
import { useEffect, useState } from 'react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/alquileres', label: 'Alquileres', icon: '📋' },
  { path: '/clientes', label: 'Clientes', icon: '👥' },
  { path: '/obras', label: 'Obras', icon: '🏗️' },
  { path: '/reportes/inventario', label: 'Rep. Inventario', icon: '📈' },
  { path: '/reportes/alquileres', label: 'Rep. Alquileres', icon: '📉' },
  { path: '/reportes/clientes', label: 'Rep. Clientes', icon: '📊' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStore((state: any) => state.logout);
  const isSidebarOpen = useStore((state: any) => state.isSidebarOpen);
  const closeSidebar = useStore((state: any) => state.closeSidebar);
  const setIsSidebarOpen = useStore((state: any) => state.setIsSidebarOpen);
  const [isMobile, setIsMobile] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      closeSidebar();
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    const initialMobile = window.innerWidth < 768;
    setIsMobile(initialMobile);
    if (initialMobile) {
      closeSidebar();
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [closeSidebar]);

  return (
    <>
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeSidebar}
          style={{ width: '100vw', height: '100vh' }}
        />
      )}

      <aside
        className={`
          fixed md:static
          top-0 left-0
          w-64 bg-white border-r border-gray-200 h-screen flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          shadow-lg md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${!isSidebarOpen ? 'md:hidden' : ''}
        `}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Stock Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de Alquileres</p>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all shadow-sm hover:shadow-md"
            aria-label="Cerrar menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
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
      </aside>
    </>
  );
}


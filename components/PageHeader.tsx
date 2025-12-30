'use client';

import { useStore } from '@/store/store';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const openSidebar = useStore((state: any) => state.openSidebar);
  const toggleSidebar = useStore((state: any) => state.toggleSidebar);
  const isSidebarOpen = useStore((state: any) => state.isSidebarOpen);
  const logout = useStore((state: any) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 mr-3 transition-all shadow-sm hover:shadow-md"
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        aria-label="Cerrar sesión"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Salir
      </button>
    </div>
  );
}


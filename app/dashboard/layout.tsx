'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { getCurrentUser } from '@/lib/api-client';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useStore((state: any) => state.currentUser);
  const setUser = useStore((state: any) => state.setUser);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      // Si ya hay usuario en el store, no hacer nada
      if (currentUser) {
        setIsChecking(false);
        return;
      }

      // Intentar obtener usuario desde la cookie
      try {
        const user = await getCurrentUser();
        if (user) {
          setUser(user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, [currentUser, setUser, router]);

  if (isChecking || !currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageHeader title="Dashboard" />
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

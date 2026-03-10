'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';

export default function Home() {
  const router = useRouter();
  const currentUser = useStore((state: any) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [currentUser, router]);

  return null;
}


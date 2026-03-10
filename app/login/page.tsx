'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Card, Title, TextInput, Button, Text } from '@tremor/react';
import { login, getCurrentUser } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state: any) => state.setUser);
  const currentUser = useStore((state: any) => state.currentUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si ya hay sesión activa
  useEffect(() => {
    async function checkSession() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUser(user);
          router.push('/dashboard');
        }
      } catch (error) {
        // No hay sesión activa, continuar en login
      }
    }
    checkSession();
  }, [setUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(username, password);
      setUser(user);
      // Usar window.location para forzar recarga completa y asegurar que la cookie se establezca
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full shadow-2xl rounded-2xl">
        <Title className="text-2xl mb-6 text-center">Stock Manager</Title>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <TextInput
              id="username"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <TextInput
              id="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full rounded-xl shadow-md hover:shadow-lg transition-shadow" 
            size="lg"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

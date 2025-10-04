'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import withAuth from '@/components/withAuth';

function NuevaCargaPage() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token no encontrado');

      await axios.post(
        'http://localhost:3000/cargas',
        {
          codigo: Number(codigo), // Nos aseguramos de enviar un número
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Si todo sale bien, redirigimos a la lista de cargas
      router.push('/cargas');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ocurrió un error al crear la carga.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (Simplificado) */}
      <aside className="hidden w-64 bg-gray-800 p-4 text-white md:block">
        <h1 className="text-2xl font-bold">CargaPay</h1>
        <nav className="mt-8">
            <Link href="/dashboard" className="block rounded-md py-2 px-3 hover:bg-gray-700">Dashboard</Link>
            <Link href="/cargas" className="block rounded-md bg-gray-900 py-2 px-3">Cargas</Link>
        </nav>
      </aside>

      {/* Área de Contenido */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Carga</h1>
          <p className="mt-1 text-gray-600">Ingresá el código único para la nueva carga.</p>
        </header>

        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                Código de Carga
              </label>
              <div className="mt-1">
                <input
                  id="codigo"
                  name="codigo"
                  type="number"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: 101"
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex items-center justify-end space-x-4">
              <Link href="/cargas" className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Carga'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default withAuth(NuevaCargaPage);
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import withAuth from '@/components/withAuth';
import { useRouter } from 'next/navigation';

interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada'
  // Podés agregar más campos si tu API los devuelve, como fecha o estado
}

function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal
  const router = useRouter();

  useEffect(() => {
    const fetchCargas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');

        const response = await axios.get('http://localhost:3000/cargas', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCargas(response.data);
      } catch (err: any) {
        setError('Error al obtener las cargas');
      } finally {
        setLoading(false);
      }
    };

    fetchCargas();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 flex-col bg-gray-800 p-4 text-white md:flex">
          <div>
            <h1 className="text-2xl font-bold">CargaPay</h1>
            <nav className="mt-8 space-y-2">
              <Link href="/dashboard" className="block rounded-md py-2 px-3 hover:bg-gray-700">Dashboard</Link>
              <Link href="/cargas" className="block rounded-md bg-gray-900 py-2 px-3">Cargas</Link>
            </nav>
          </div>
          <div className="mt-auto">
            <button onClick={handleLogout} className="w-full rounded-md py-2 px-3 text-left text-red-400 hover:bg-gray-700 hover:text-red-300">
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Cargas</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 sm:mt-0 rounded-lg bg-indigo-600 ..."
            >
              + Nueva Carga
            </button>
          </div>

          {/* Tabla de Cargas */}
          <div className="mt-8">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              {loading ? (
                <p className="p-6 text-center">Cargando...</p>
              ) : error ? (
                <p className="p-6 text-center text-red-500">{error}</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Código</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cargas.map((carga) => (
                      <tr key={carga.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{carga.code}</td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${carga.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {carga.estado === 'activa' ? 'Activa' : 'Finalizada'}
                          </span>
                        </td>


                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Link href={`/cargas/${carga.id}`} className="text-indigo-600 hover:text-indigo-900">
                            Ver Detalles
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

    </>
  );
}

export default withAuth(CargasPage);
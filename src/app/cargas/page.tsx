'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import withAuth from '@/components/withAuth';
import { usePathname, useRouter } from 'next/navigation';
import ModalNuevaCarga from '@/components/modalNuevaCarga';
import ConfirmationModal from '@/components/ConfirmationModal';
import Layout from '@/components/Layout';

// 1. La interfaz debe tener los campos para agrupar y mostrar
interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada';
  fecha_creacion: string;
  factura?: { id: number };
}

// Estructura para los datos agrupados
type Quincena = 'Primera Quincena' | 'Segunda Quincena';
interface GroupedCargas {
  [monthYear: string]: {
    [key in Quincena]?: Carga[];
  };
}

function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMonth, setOpenMonth] = useState<string | null>(null); // Estado para el acordeón
  const router = useRouter();
  const pathname = usePathname();
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: () => { },
    onCancel: () => { },
  });
  const closeConfirmation = () => setConfirmation({ ...confirmation, isOpen: false });
  const fetchCargas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cargas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCargas(response.data);
      // Abrimos el mes más reciente por defecto
      if (response.data.length > 0) {
        const lastCargaDate = new Date(response.data[0].fecha_creacion);
        const lastMonthKey = lastCargaDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        setOpenMonth(lastMonthKey);
      }
    } catch (err: any) {
      setError('Error al obtener las cargas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();
  }, []);

  // 2. Lógica para agrupar las Cargas por mes y quincena
  const groupedCargas = useMemo(() => {
    return cargas.reduce((acc: GroupedCargas, carga) => {
      const date = new Date(carga.fecha_creacion);
      const day = date.getDate();
      const monthYear = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
        .replace(' de ', ' ');
      const quincenaKey: Quincena = day <= 15 ? 'Primera Quincena' : 'Segunda Quincena';

      if (!acc[monthYear]) acc[monthYear] = {};
      if (!acc[monthYear][quincenaKey]) acc[monthYear][quincenaKey] = [];

      acc[monthYear][quincenaKey]?.push(carga);
      return acc;
    }, {});
  }, [cargas]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const toggleMonth = (monthKey: string) => {
    setOpenMonth(openMonth === monthKey ? null : monthKey);
  };

  const handleFacturarClick = (monthKey: string, quincena: Quincena) => {
    const cargasCount = groupedCargas[monthKey][quincena]?.filter(c => c.estado === 'activa').length || 0;
    if (cargasCount === 0) return; // No hacer nada si no hay cargas activas

    setConfirmation({
      isOpen: true,
      title: 'Facturar Quincena',
      message: `Estás a punto de finalizar ${cargasCount} cargas y generar una factura para la ${quincena} de ${monthKey}. ¿Estás seguro?`,
      confirmText: 'Sí, Facturar',
      onConfirm: () => facturarQuincena(monthKey, quincena),
      onCancel: closeConfirmation,
    });
  };

  const facturarQuincena = async (monthYear: string, quincena: string) => {
    try {


      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/facturacion/quincena`, {
        monthYear, quincena,
      },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const nuevaFactura = response.data;

      router.push(`/facturas/${nuevaFactura.id}`)

      // fetchCargas(); // Recargamos la lista para ver los cambios
    } catch (err: any) {
      console.error("Error al facturar la quincena:", err);
      // Aquí podrías usar un estado para mostrar un error al usuario
    }
    closeConfirmation();
  };

  return (
    <>
        <Layout>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Cargas</h2>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 sm:mt-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              + Nueva Carga
            </button>
          </div>

          <div className="mt-8 space-y-4">
            {loading ? (
              <p className="p-6 text-center">Cargando...</p>
            ) : error ? (
              <p className="p-6 text-center text-red-500">{error}</p>
            ) : Object.keys(groupedCargas).length === 0 ? (
              <p className="p-6 text-center text-gray-500">Aún no hay cargas registradas.</p>
            ) : (
              Object.keys(groupedCargas).map(monthKey => (
                <div key={monthKey} className="overflow-hidden rounded-lg bg-white shadow">
                  <button onClick={() => toggleMonth(monthKey)} className="flex w-full items-center justify-between p-4 text-left font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none">
                    <span className="capitalize">{monthKey}</span>
                    <svg className={`h-5 w-5 transform transition-transform ${openMonth === monthKey ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {openMonth === monthKey && (
                    <div className="border-t border-gray-200 p-4">
                      {(['Primera Quincena', 'Segunda Quincena'] as Quincena[]).map(quincena => (
                        groupedCargas[monthKey][quincena] && (
                          <div key={quincena} className="mb-6 last:mb-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-md font-semibold text-gray-600">{quincena}</h4>
                              {(() => {
                                const quincenaCargas = groupedCargas[monthKey][quincena];
                                const hayCargasActivas = quincenaCargas?.some(c => c.estado === 'activa');

                                if (hayCargasActivas) {
                                  const cargasActivasCount = quincenaCargas.filter(c => c.estado === 'activa').length;
                                  return (
                                    <button
                                      onClick={() => handleFacturarClick(monthKey, quincena)}
                                      className="rounded-md bg-green-600 p-2.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                                    >
                                      Facturar Quincena ({cargasActivasCount})
                                    </button>
                                  );
                                }

                                const primeraCargaFacturada = quincenaCargas?.find(c => c.estado === 'finalizada' && c.factura?.id);
                                if (primeraCargaFacturada) {
                                  return (
                                    <Link href={`/facturas/${primeraCargaFacturada.factura?.id}`}>
                                      <button
                                        className="rounded-md bg-gray-700 p-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-600"
                                      >
                                        Ver Factura
                                      </button>
                                    </Link>
                                  );
                                }

                                return null; // No muestra ningún botón si no hay cargas o si algo es inconsistente
                              })()}
                            </div>

                            <div className="mt-2 overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Código</th>
                                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                                    {/* <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th> */}
                                    <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                  {groupedCargas[monthKey][quincena]?.map(carga => (
                                    <tr key={carga.id}>
                                      <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{carga.code}</td>
                                      <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{new Date(carga.fecha_creacion).toLocaleDateString('es-AR')}</td>
                                      {/* <td className="whitespace-nowrap px-6 py-3 text-sm">
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${carga.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                          {carga.estado}
                                        </span>
                                      </td> */}
                                      <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-medium">
                                        <Link href={`/cargas/${carga.id}`} className="text-indigo-600 hover:text-indigo-900">Ver Detalles</Link>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          </Layout>
      <ModalNuevaCarga
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCargaCreada={() => {
          setIsModalOpen(false);
          fetchCargas();
        }}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        onConfirm={confirmation.onConfirm}
        onCancel={closeConfirmation}
      />
    </>
  );
}

export default withAuth(CargasPage);

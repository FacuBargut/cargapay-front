'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import withAuth from '@/components/withAuth';
import { usePathname, useRouter } from 'next/navigation';
import ModalNuevaCarga from '@/components/modalNuevaCarga';
import ConfirmationModal from '@/components/ConfirmationModal';
import Layout from '@/components/Layout';
import api from '@/lib/api';

// 1. La interfaz debe tener los campos para agrupar y mostrar
interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada';
  fecha_creacion: string;
  factura?: { id: number };
}
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
  const [openMonth, setOpenMonth] = useState<string | null>(null);
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
      const response = await api.get('/cargas');
      setCargas(response.data);
      if (response.data.length > 0) {
        // Ordenamos por fecha para asegurarnos de que el más reciente esté primero
        const sortedCargas = [...response.data].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
        const lastCargaDate = new Date(sortedCargas[0].fecha_creacion);
        const lastMonthKey = lastCargaDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
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

  const groupedCargas = useMemo(() => {
    // Ordenamos las cargas de más nueva a más vieja antes de agrupar
    const sortedCargas = [...cargas].sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

    return sortedCargas.reduce((acc: GroupedCargas, carga) => {
      const date = new Date(carga.fecha_creacion);
      const day = date.getDate();
      const monthYear = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
      const quincenaKey: Quincena = day <= 15 ? 'Primera Quincena' : 'Segunda Quincena';
      if (!acc[monthYear]) acc[monthYear] = {};
      if (!acc[monthYear][quincenaKey]) acc[monthYear][quincenaKey] = [];
      acc[monthYear][quincenaKey]?.push(carga);
      return acc;
    }, {});
  }, [cargas]);

  const toggleMonth = (monthKey: string) => {
    setOpenMonth(openMonth === monthKey ? null : monthKey);
  };

  const handleFacturarClick = (monthKey: string, quincena: Quincena) => {
    const cargasCount = groupedCargas[monthKey][quincena]?.filter(c => c.estado === 'activa').length || 0;
    if (cargasCount === 0) return;

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
      const response = await api.post('/facturacion/quincena', { monthYear, quincena });
      const nuevaFactura = response.data;
      if (nuevaFactura && nuevaFactura.id) {
        window.open(`/facturas/${nuevaFactura.id}`, '_blank');
      }
      fetchCargas();
    } catch (err: any) {
      console.error("Error al facturar la quincena:", err);
    }
    closeConfirmation();
  };

  const handleDeleteFacturaClick = (facturaId: number) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Factura',
      message: 'Estás a punto de eliminar esta factura. Todas las cargas asociadas volverán al estado "Activa". ¿Estás seguro?',
      confirmText: 'Sí, Eliminar Factura',
      onConfirm: () => deleteFactura(facturaId),
      onCancel: closeConfirmation,
    });
  };

  const deleteFactura = async (facturaId: number) => {
    try {
      await api.delete(`/facturacion/${facturaId}`);
      fetchCargas();
    } catch (err: any) {
      console.error("Error al eliminar la factura:", err);
    }
    closeConfirmation();
  };

  return (
    <>
      <Layout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Cargas</h2>
          <button onClick={() => setIsModalOpen(true)} className="cursor-pointer mt-4 sm:mt-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            + Nueva Carga
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="p-6 text-center text-gray-500">Cargando...</p>
          ) : error ? (
            <p className="p-6 text-center text-red-500">{error}</p>
          ) : Object.keys(groupedCargas).length === 0 ? (
            <div className="text-center rounded-lg border-2 border-dashed border-gray-300 p-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Aún no hay cargas registradas</h3>
              <p className="mt-1 text-sm text-gray-500">Comenzá creando tu primera carga.</p>
              <div className="mt-6">
                <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                  + Agregar Nueva Carga
                </button>
              </div>
            </div>
          ) : (
            Object.keys(groupedCargas).map(monthKey => (
              <div key={monthKey} className="overflow-hidden rounded-lg bg-white shadow">
                <button onClick={() => toggleMonth(monthKey)} className="cursor-pointer flex w-full items-center justify-between p-4 text-left font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none">
                  <span className="capitalize">{monthKey}</span>
                  <svg className={`h-5 w-5 transform transition-transform ${openMonth === monthKey ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {openMonth === monthKey && (
                  <div className="border-t border-gray-200 p-4">
                    {(['Primera Quincena', 'Segunda Quincena'] as Quincena[]).map(quincena => {
                      const quincenaCargas = groupedCargas[monthKey][quincena];
                      if (!quincenaCargas) return null;

                      const hayCargasActivas = quincenaCargas.some(c => c.estado === 'activa');
                      const primeraCargaFacturada = quincenaCargas.find(c => c.estado === 'finalizada' && c.factura?.id);

                      return (
                        <div key={quincena} className="mb-6 last:mb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-md font-semibold text-gray-600">{quincena}</h4>
                            {hayCargasActivas ? (
                              <button
                                onClick={() => handleFacturarClick(monthKey, quincena)}
                                className="cursor-pointer rounded-md bg-green-600 p-2.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                              >
                                Facturar Quincena ({quincenaCargas.filter(c => c.estado === 'activa').length})
                              </button>
                            ) : primeraCargaFacturada ? (
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/facturas/${primeraCargaFacturada.factura?.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cursor-pointer rounded-md bg-gray-700 p-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-600"
                                >
                                  Ver Factura
                                </Link>
                                <button
                                  onClick={() => handleDeleteFacturaClick(primeraCargaFacturada.factura!.id)}
                                  className="cursor-pointer rounded-md bg-red-600 p-2 text-white shadow-sm hover:bg-red-500"
                                  title="Eliminar Factura para reabrir quincena"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-2 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Código</th>
                                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                  <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {quincenaCargas.map(carga => (
                                  <tr key={carga.id}>
                                    <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{carga.code}</td>
                                    <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{new Date(carga.fecha_creacion).toLocaleDateString('es-AR')}</td>
                                    <td className="whitespace-nowrap px-6 py-3 text-sm">
                                      <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${carga.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {carga.estado}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-medium">
                                      <Link href={`/cargas/${carga.id}`} className="text-indigo-600 hover:text-indigo-900">Ver Detalles</Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
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
        onCargaCreada={fetchCargas}
      />

      {/* ¡ASEGURATE DE QUE ESTE BLOQUE EXISTA Y ESTÉ CORRECTO! */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={closeConfirmation}
        confirmText={confirmation.confirmText}
      />
    </>
  );
}

export default withAuth(CargasPage);
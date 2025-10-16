'use client';
import { useState, useEffect } from 'react';
import withAuth from '@/components/withAuth';
import Layout from '@/components/Layout';
import api from '@/lib/api';

import ConfirmationModal from '@/components/ConfirmationModal';
import ModalTarifa from '@/components/ModalTarifa';
import TarifaValueDisplay from '@/components/TarifaValueDisplay';
export interface Tarifa {
  id: number;
  name: string;
  value: number;
  configuracion_escalonada?: {
    niveles: { desde: number; hasta: number; monto: number }[];
  };
}

function TarifasPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para los modales
  const [isTarifaModalOpen, setIsTarifaModalOpen] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<Tarifa | null>(null);
  const [confirmation, setConfirmation] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const fetchTarifas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/rates`);
      setTarifas(response.data);
    } catch (err) {
      setError('Error al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarifas();
  }, []);

  // --- Manejadores de Acciones ---
  const handleAddClick = () => {
    setEditingTarifa(null);
    setIsTarifaModalOpen(true);
  };
  
  const handleEditClick = (tarifa: Tarifa) => {
    setEditingTarifa(tarifa);
    setIsTarifaModalOpen(true);
  };

  const handleDeleteClick = (tarifaId: number) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Tarifa',
      message: '¿Estás seguro de que querés eliminar esta tarifa? Esta acción es irreversible.',
      onConfirm: () => deleteTarifa(tarifaId),
    });
  };

  const deleteTarifa = async (tarifaId: number) => {
    try {
      await api.delete(`/rates/${tarifaId}`);
      fetchTarifas(); 
    } catch (err) {
      console.error("Error al eliminar la tarifa", err);
    }
    setConfirmation({ ...confirmation, isOpen: false });
  };
  
  return (
    <>
      <Layout>
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Tarifas</h2>
          <button 
            onClick={handleAddClick}
            className="cursor-pointer mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:mt-0"
          >
            + Agregar Tarifa
          </button>
        </div>

        <div className="mt-8">
  
    {loading ? (
      <p className="p-12 text-center text-gray-500">Cargando tarifas...</p>
    ) : error ? (
      <p className="p-12 text-center text-red-500">{error}</p>
    ) : tarifas.length > 0 ? (
      // --- Si hay tarifas, mostramos la tabla ---
<>
              {/* --- 2. VISTA DE TABLA (SOLO PARA DESKTOP) --- */}
              <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre de la Tarifa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Valor Actual</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {tarifas.map((tarifa) => (
                      <tr key={tarifa.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{tarifa.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <TarifaValueDisplay tarifa={tarifa} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-4">
                          <button onClick={() => handleEditClick(tarifa)} className="cursor-pointer text-indigo-600 hover:text-indigo-900">Editar</button>
                          <button onClick={() => handleDeleteClick(tarifa.id)} className="cursor-pointer text-red-600 hover:text-red-900">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- 3. VISTA DE TARJETAS (SOLO PARA MOBILE) --- */}
              <div className="space-y-4 md:hidden">
                {tarifas.map((tarifa) => (
                  <div key={tarifa.id} className="rounded-lg bg-white p-4 shadow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">{tarifa.name}</h3>
                    </div>
                    <div className="mt-2 border-t pt-2 text-sm text-gray-500">
                      <TarifaValueDisplay tarifa={tarifa} />
                    </div>
                    <div className="mt-3 flex justify-end space-x-4 border-t pt-3">
                      <button onClick={() => handleEditClick(tarifa)} className="cursor-pointer text-sm font-medium text-indigo-600">Editar</button>
                      <button onClick={() => handleDeleteClick(tarifa.id)} className="cursor-pointer text-sm font-medium text-red-600">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
    ) : (
      // --- Si no hay tarifas, mostramos el EMPTY STATE ---
      <div className="text-center rounded-lg border-2 border-dashed border-gray-300 p-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Sin Tarifas Creadas</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comenzá agregando tu primera tarifa para poder calcular tus viajes.
        </p>
      </div>
    )}
  </div>

      </Layout>
      
      {/* Modales */}
      <ModalTarifa
        isOpen={isTarifaModalOpen}
        onClose={() => setIsTarifaModalOpen(false)}
        onSave={() => {
          setIsTarifaModalOpen(false);
          fetchTarifas();
        }}
        tarifaToEdit={editingTarifa}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
      />
    </>
  );
}

export default withAuth(TarifasPage);
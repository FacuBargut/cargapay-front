'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';
import ModalInstruccion from '@/components/ModalInstruccion';

// --- Interfaces ---
interface Viaje { id: number; localidad_destino: string; cant_km: number; tipo: string; changarin: boolean; }
interface Estadia { id: number; horas_estadia: number; }
export interface Instruction { id: number; tipo: 'viaje' | 'estadia'; viaje?: Viaje; estadia?: Estadia; }
export interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada';
  instructions: Instruction[];
  valor_km_recorrido: number; // <-- Asegurate de que exista
  valor_hora_estadia: number;  // <-- Asegurate de que exista
}

export default function CargaDetailPage() {
  const params = useParams();
  const cargaId = params.cargaId as string;

  const [carga, setCarga] = useState<Carga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const fetchCargaDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cargas/${cargaId}`);
      setCarga(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cargaId) fetchCargaDetails();
  }, [cargaId]);

  const { totalKm, totalHorasEstadia, montoKm, montoHoras, montoTotal } = useMemo(() => {
    if (!carga) {
      return { totalKm: 0, totalHorasEstadia: 0, montoKm: 0, montoHoras: 0, montoTotal: 0 };
    }

    const { totalKm, totalHorasEstadia } = carga.instructions.reduce(
      (totales, inst) => {
        if (inst.tipo === 'viaje' && inst.viaje) {
          totales.totalKm += Number(inst.viaje.cant_km);
        }
        if (inst.tipo === 'estadia' && inst.estadia) {
          totales.totalHorasEstadia += Number(inst.estadia.horas_estadia);
        }
        return totales;
      },
      { totalKm: 0, totalHorasEstadia: 0 }
    );

    const montoKm = totalKm * carga.valor_km_recorrido;
    const montoHoras = totalHorasEstadia * carga.valor_hora_estadia;
    const montoTotal = montoKm + montoHoras;

    return { totalKm, totalHorasEstadia, montoKm, montoHoras, montoTotal };
  }, [carga]);

  // --- LÓGICA DE ACCIONES COMPLETA ---
  const handleFinalizarClick = () => {
    setConfirmation({
      isOpen: true,
      title: 'Finalizar Carga',
      message: '¿Estás seguro? Una vez finalizada, no podrás modificarla.',
      onConfirm: finalizarCarga,
    });
  };

  const finalizarCarga = async () => {
    try {
      await api.patch(`/cargas/${cargaId}/finalizar`);
      fetchCargaDetails();
    } catch (err) { console.error("Error al finalizar la carga:", err); }
    closeConfirmation();
  };

  const handleDeleteClick = (instructionId: number) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Instrucción',
      message: '¿Estás seguro de que querés eliminar esta instrucción?',
      onConfirm: () => deleteInstruction(instructionId),
    });
  };

  const deleteInstruction = async (instructionId: number) => {
    try {
      await api.delete(`/instructions/${instructionId}`);
      fetchCargaDetails();
    } catch (err) { console.error("Error al eliminar instrucción:", err); }
    closeConfirmation();
  };

  const handleEditClick = (instruction: Instruction) => {
    setEditingInstruction(instruction);
    setIsInstructionModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingInstruction(null);
    setIsInstructionModalOpen(true);
  };

  const closeConfirmation = () => setConfirmation({ ...confirmation, isOpen: false });
  // --- FIN LÓGICA DE ACCIONES ---

  if (loading) return <p className="p-10 text-center">Cargando...</p>;
  if (error) return <p className="p-10 text-center text-red-500">{error}</p>;
  if (!carga) return <p className="p-10 text-center">No se encontró la carga.</p>;

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-6 lg:p-10">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de la Carga</h1>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-lg text-gray-600">Código: <span className="font-semibold">{carga.code}</span></p>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${carga.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {carga.estado}
              </span>
            </div>
          </div>
          {/* {carga.estado === 'activa' && (
            <button onClick={handleFinalizarClick} className="mt-4 sm:mt-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
              Finalizar Carga
            </button>
          )} */}
        </header>

        {carga.estado === 'activa' ? (
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Instrucciones Registradas</h2>
              <button onClick={handleAddClick} className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                + Agregar Instrucción
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {carga.instructions.length > 0 ? (
                carga.instructions.map((inst) => (
                  <div key={inst.id} className="rounded-md border p-4 flex justify-between items-start">
                    <div>
                      <p className="font-bold capitalize text-indigo-600">{inst.tipo}</p>
                      {inst.tipo === 'viaje' && inst.viaje && (
                        <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
                          <li><strong>Destino:</strong> {inst.viaje.localidad_destino}</li>
                          <li><strong>KM:</strong> {inst.viaje.cant_km}</li>
                          <li><strong>Changarin:</strong> {inst.viaje.changarin ? 'Si' : 'No'}</li>
                          <li><strong>Tipo:</strong> {inst.viaje.tipo}</li>
                        </ul>
                      )}
                      {inst.tipo === 'estadia' && inst.estadia && (
                        <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
                          <li><strong>Horas:</strong> {inst.estadia.horas_estadia}</li>
                        </ul>
                      )}
                    </div>
                    <div className="flex space-x-4">
                      <button onClick={() => handleEditClick(inst)} className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => handleDeleteClick(inst.id)} className="cursor-pointer text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Esta carga aún no tiene instrucciones.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 shadow-lg">
    <div className="flex flex-col items-center border-b pb-6">
      <h2 className="text-2xl font-bold text-gray-900">Resumen de Facturación</h2>
      <p className="text-sm text-gray-500">Carga Finalizada</p>
    </div>
    
    {/* Totales Generales */}
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div className="rounded-lg bg-gray-50 p-4 text-center">
        <p className="text-sm font-medium text-gray-500">Total KM</p>
        <p className="text-2xl font-bold text-gray-900">{totalKm.toLocaleString('es-AR')} km</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-4 text-center">
        <p className="text-sm font-medium text-gray-500">Total Horas Estadía</p>
        <p className="text-2xl font-bold text-gray-900">{totalHorasEstadia.toLocaleString('es-AR')} hs</p>
      </div>
      <div className="rounded-lg bg-indigo-50 p-4 text-center">
        <p className="text-sm font-medium text-indigo-700">MONTO TOTAL</p>
        <p className="text-2xl font-bold text-indigo-900">
          ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>

    {/* Detalle de Facturación */}
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-800">Detalle de Conceptos</h3>
      <div className="mt-4 space-y-3 border-t pt-4">
        {/* Fila para Viajes */}
        <div className="flex justify-between text-base">
          <div className="text-gray-600">
            <p>Total Viajes ({totalKm.toLocaleString('es-AR')} km)</p>
            <p className="text-sm text-gray-400">
              Valor por KM: ${carga.valor_km_recorrido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="font-semibold text-gray-800">
            ${montoKm.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {/* Fila para Estadías */}
        <div className="flex justify-between text-base">
          <div className="text-gray-600">
            <p>Total Estadías ({totalHorasEstadia.toLocaleString('es-AR')} hs)</p>
            <p className="text-sm text-gray-400">
              Valor por Hora: ${carga.valor_hora_estadia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="font-semibold text-gray-800">
            ${montoHoras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      {/* Línea de Total */}
      <div className="mt-4 flex justify-between border-t-2 border-gray-900 pt-4">
          <span className="text-lg font-bold text-gray-900">Total a Facturar</span>
          <span className="text-lg font-bold text-gray-900">
            ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
      </div>
    </div>
  </div>
        )}
      </div>

      <ConfirmationModal isOpen={confirmation.isOpen} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={closeConfirmation} />
      <ModalInstruccion isOpen={isInstructionModalOpen} onClose={() => setIsInstructionModalOpen(false)} onSave={() => { setIsInstructionModalOpen(false); fetchCargaDetails(); }} cargaId={carga.id} instructionToEdit={editingInstruction} />
    </>
  );
}
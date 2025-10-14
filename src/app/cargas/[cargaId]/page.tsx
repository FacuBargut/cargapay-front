'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ConfirmationModal from '@/components/ConfirmationModal';
import ModalInstruccion from '@/components/ModalInstruccion';
import { Tarifa } from '@/app/tarifas/page';
import Layout from '@/components/Layout';
import withAuth from '@/components/withAuth';

// --- Interfaces ---
interface Viaje { id: number; localidad_destino: string; cant_km: number; tipo: string; changarin: boolean; amount: number }
interface Estadia { id: number; horas_estadia: number; amount: number }
export interface Instruction { id: number; tipo: 'viaje' | 'estadia'; viaje?: Viaje; estadia?: Estadia; }
export interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada';
  instructions: Instruction[];
  cantidad_bocas: number;
}

function CargaDetailPage() {
  const params = useParams();
  const cargaId = params.cargaId as string;

  const [carga, setCarga] = useState<Carga | null>(null);
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
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

  const fetchData = async () => {
    try {
      if (!loading) setLoading(true);
      const [cargaResponse, tarifasResponse] = await Promise.all([
        api.get(`/cargas/${cargaId}`),
        api.get('/rates'),
      ]);
      setCarga(cargaResponse.data);
      setTarifas(tarifasResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cargaId) fetchData();
  }, [cargaId]);

  const { totalKm, totalHorasEstadia, montoViajes, montoEstadias, montoBocas, montoTotal, valorKmPromedio, valorHoraPromedio } = useMemo(() => {
    if (!carga) {
      return { totalKm: 0, totalHorasEstadia: 0, montoViajes: 0, montoEstadias: 0, montoBocas: 0, montoTotal: 0 };
    }

    let totalKm = 0;
    let totalHorasEstadia = 0;
    let montoViajes = 0;
    let montoEstadias = 0;

    carga.instructions.forEach(inst => {
      if (inst.tipo === 'viaje' && inst.viaje) {
        totalKm += Number(inst.viaje.cant_km);
        montoViajes += Number(inst.viaje.amount);
      }
      if (inst.tipo === 'estadia' && inst.estadia) {
        totalHorasEstadia += Number(inst.estadia.horas_estadia);
        montoEstadias += Number(inst.estadia.amount);
      }
    });

    const valorKmPromedio = totalKm > 0 ? montoViajes / totalKm : 0;
    const valorHoraPromedio = totalHorasEstadia > 0 ? montoEstadias / totalHorasEstadia : 0;

    

    // El costo por boca sí se calcula en vivo con la tarifa actual
    const valorBoca = tarifas.find(t => t.name === "Costo por boca")?.value || 0;
    const montoBocas = carga.cantidad_bocas * valorBoca;

    const montoTotal = montoViajes + montoEstadias + montoBocas;

    return { totalKm, totalHorasEstadia, montoViajes, montoEstadias, montoBocas, montoTotal, valorKmPromedio, valorHoraPromedio };
  }, [carga, tarifas]);

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
      fetchData();
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
      fetchData();
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

  if (loading) return <Layout><p className="p-10 text-center">Cargando...</p></Layout>;
  if (error) return <Layout><p className="p-10 text-center text-red-500">{error}</p></Layout>;
  if (!carga) return <Layout><p className="p-10 text-center">No se encontró la carga.</p></Layout>;

  return (
    <>
      <Layout>
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

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800">Detalle de Conceptos</h3>
              <div className="mt-4 space-y-3 border-t pt-4">
                {/* Fila para Viajes */}
                {/* <div className="flex justify-between text-base">
                  <p className="text-gray-600">Subtotal Viajes ({totalKm.toLocaleString('es-AR')} km)</p>
                  <span className="font-semibold text-gray-800">
                    ${montoViajes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="font-semibold text-gray-800">${viajeRate?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div> */}
                <div className="flex justify-between text-base">
                  <div>
                    <p className="text-gray-600">Subtotal Viajes ({totalKm.toLocaleString('es-AR')} km)</p>
                    <p className="text-sm text-gray-400">
                    Valor por km recorrido
                    ${valorKmPromedio?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-800">${montoViajes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Fila para Estadías */}
                <div className="flex justify-between text-base">
                  <div>
                    <p className="text-gray-600">Subtotal Estadias ({totalKm.toLocaleString('es-AR')} km)</p>
                    <p className="text-sm text-gray-400">
                      Valor por hora de estadia
                    ${valorHoraPromedio?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-800">${montoEstadias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Fila para Bocas */}
                <div className="flex justify-between text-base">
                  <p className="text-gray-600">Subtotal Bocas ({carga.cantidad_bocas})</p>
                  <span className="font-semibold text-gray-800">
                    ${montoBocas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t-2 border-gray-900 pt-4">
                <span className="text-lg font-bold text-gray-900">Total a Facturar</span>
                <span className="text-lg font-bold text-indigo-600">
                  ${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </Layout>

      <ConfirmationModal isOpen={confirmation.isOpen} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={closeConfirmation} />
      <ModalInstruccion isOpen={isInstructionModalOpen} onClose={() => setIsInstructionModalOpen(false)} onSave={() => { setIsInstructionModalOpen(false); fetchData(); }} cargaId={carga.id} instructionToEdit={editingInstruction} />
    </>
  );
}

export default withAuth(CargaDetailPage)
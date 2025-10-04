'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Instruction } from '@/app/cargas/[cargaId]/page';
 // Usamos los tipos centralizados

// --- Componente Switch reutilizable ---
const Switch = ({ label, enabled, setEnabled }: { label: string, enabled: boolean, setEnabled: (enabled: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);
// --- Fin del Componente Switch ---

interface ViajeData { localidad_destino: string; cant_km: string; changarin: boolean; tipo: 'caja' | 'colgado'; }
interface EstadiaData { horas_estadia: string; }
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  cargaId: number;
  instructionToEdit?: Instruction | null;
}

export default function ModalInstruccion({ isOpen, onClose, onSave, cargaId, instructionToEdit }: ModalProps) {
  const [tipo, setTipo] = useState<'viaje' | 'estadia'>('viaje');
  const [viajeData, setViajeData] = useState<ViajeData>({ localidad_destino: '', cant_km: '', changarin: false, tipo: 'caja' });
  const [estadiaData, setEstadiaData] = useState<EstadiaData>({ horas_estadia: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. useEffect para rellenar el formulario en modo edición o resetearlo
  useEffect(() => {
    if (isOpen) {
      if (instructionToEdit) { // Modo Edición
        setTipo(instructionToEdit.tipo);
        if (instructionToEdit.tipo === 'viaje' && instructionToEdit.viaje) {
          setViajeData({
            localidad_destino: instructionToEdit.viaje.localidad_destino,
            cant_km: String(instructionToEdit.viaje.cant_km),
            changarin: instructionToEdit.viaje.changarin,
            tipo: instructionToEdit.viaje.tipo as 'caja' | 'colgado',
          });
        } else if (instructionToEdit.tipo === 'estadia' && instructionToEdit.estadia) {
          setEstadiaData({ horas_estadia: String(instructionToEdit.estadia.horas_estadia) });
        }
      } else { // Modo Creación
        setTipo('viaje');
        setViajeData({ localidad_destino: '', cant_km: '', changarin: false, tipo: 'caja' });
        setEstadiaData({ horas_estadia: '' });
      }
    }
  }, [isOpen, instructionToEdit]);

  // 2. Lógica de guardado dinámica (POST o PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isEditing = !!instructionToEdit;

    const payload = {
      cargaId,
      tipo,
      viaje: tipo === 'viaje' ? { ...viajeData, cant_km: Number(viajeData.cant_km) } : undefined,
      estadia: tipo === 'estadia' ? { horas_estadia: Number(estadiaData.horas_estadia) } : undefined,
    };

    try {
      if (isEditing) {
        await api.patch(`/instructions/${instructionToEdit?.id}`, payload);
      } else {
        await api.post('/instructions', payload);
      }
      onSave(); // Llama a la función para refrescar y cerrar
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la instrucción');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">{instructionToEdit ? 'Editar' : 'Agregar'} Instrucción</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="tipo-instruccion" className="block text-sm font-medium text-gray-700">Tipo de Instrucción</label>
            <select
              id="tipo-instruccion"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'viaje' | 'estadia')}
              disabled={!!instructionToEdit} // 3. Deshabilitado en modo edición
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="viaje">Viaje</option>
              <option value="estadia">Estadía</option>
            </select>
          </div>

          {tipo === 'viaje' && (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <label htmlFor="destino" className="text-sm font-medium text-gray-700">Localidad Destino</label>
                <input id="destino" type="text" placeholder="Ej: Rosario" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={viajeData.localidad_destino} onChange={(e) => setViajeData({ ...viajeData, localidad_destino: e.target.value })} />
              </div>
              <div>
                <label htmlFor="km" className="text-sm font-medium text-gray-700">Cantidad de KM</label>
                <input id="km" type="number" step="0.1" placeholder="Ej: 300.5" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={viajeData.cant_km} onChange={(e) => setViajeData({ ...viajeData, cant_km: e.target.value })} />
              </div>
              <Switch label="¿Tiene changarín?" enabled={viajeData.changarin} setEnabled={(enabled) => setViajeData({ ...viajeData, changarin: enabled })} />
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Entrega</label>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                  <button type="button" onClick={() => setViajeData({ ...viajeData, tipo: 'caja' })} className={`rounded-md py-1 text-sm font-semibold ${viajeData.tipo === 'caja' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>Caja</button>
                  <button type="button" onClick={() => setViajeData({ ...viajeData, tipo: 'colgado' })} className={`rounded-md py-1 text-sm font-semibold ${viajeData.tipo === 'colgado' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>Colgado</button>
                </div>
              </div>
            </div>
          )}

          {tipo === 'estadia' && (
            <div className="space-y-4 rounded-md border p-4">
              <div>
                <label htmlFor="horas" className="text-sm font-medium text-gray-700">Cantidad de Horas</label>
                <input id="horas" type="number" step="0.1" placeholder="Ej: 4.5" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={estadiaData.horas_estadia} onChange={(e) => setEstadiaData({ horas_estadia: e.target.value })} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
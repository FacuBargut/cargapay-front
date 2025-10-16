'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Tarifa } from '@/app/tarifas/page';



const tarifaOptions = [
  "Valor por km recorrido",
  "Valor por hora de estadia",
  "Costo por boca",
];

interface Nivel {
  id: number;
  desde: string;
  hasta: string;
  monto: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tarifaToEdit?: Tarifa | null;
}

export default function ModalTarifa({ isOpen, onClose, onSave, tarifaToEdit }: ModalProps) {
  const [name, setName] = useState(tarifaOptions[0]);
  const [valor, setValor] = useState('');
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!tarifaToEdit;


  useEffect(() => {
    if (isOpen) {
      setError('');
      if (isEditing && tarifaToEdit) {
        setName(tarifaToEdit.name);
        if (tarifaToEdit.name === "Costo por boca") {

          const nivelesConId = tarifaToEdit.configuracion_escalonada?.niveles.map((n, index) => ({
            ...n,
            id: index,
            desde: String(n.desde),
            hasta: String(n.hasta),
            monto: String(n.monto),
          })) || [];
          setNiveles(nivelesConId);
          setValor('');
        } else {

          setValor(String(tarifaToEdit.value));
          setNiveles([]);
        }
      } else {

        setName(tarifaOptions[0]);
        setValor('');
        setNiveles([]);
      }
    }
  }, [isOpen, isEditing, tarifaToEdit]);

  // --- Lógica para manejar los niveles ---
  const handleNivelChange = (index: number, field: keyof Omit<Nivel, 'id'>, value: string) => {
    const nuevosNiveles = [...niveles];
    nuevosNiveles[index][field] = value;
    setNiveles(nuevosNiveles);
  };

  const handleAddNivel = () => {
    setNiveles([...niveles, { id: Date.now(), desde: '', hasta: '', monto: '' }]);
  };

  const handleRemoveNivel = (id: number) => {
    setNiveles(niveles.filter(nivel => nivel.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    let payload: any;

    if (name === "Costo por boca") {
      payload = {
        name,
        value: null,
        configuracion_escalonada: {
          niveles: niveles.map(({ id, ...rest }) => ({
            desde: Number(rest.desde),
            hasta: Number(rest.hasta),
            monto: Number(rest.monto),
          })),
        },
      };
    } else {
      payload = {
        name,
        value: Number(valor),
        configuracion_escalonada: null,
      };
    }

    try {
      if (isEditing) {
        await api.patch(`/rates/${tarifaToEdit.id}`, payload);
      } else {
        await api.post('/rates', payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la tarifa.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar' : 'Nueva'} Tarifa</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label htmlFor="nombre-tarifa" className="block text-sm font-medium text-gray-700">Nombre de la Tarifa</label>
            <select
              id="nombre-tarifa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {tarifaOptions.map(option => (<option key={option} value={option}>{option}</option>))}
            </select>
          </div>

          {name === "Costo por boca" ? (

            <div>
              <label className="block text-sm font-medium text-gray-700">Adicional de bocas por entrega</label>
              <div className="mt-2 space-y-2">
                {niveles.map((nivel, index) => (
                  <div key={nivel.id} className="flex items-center space-x-2">
                    <input type="number" placeholder="Desde" value={nivel.desde} onChange={(e) => handleNivelChange(index, 'desde', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" />
                    <input type="number" placeholder="Hasta" value={nivel.hasta} onChange={(e) => handleNivelChange(index, 'hasta', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" />
                    <input type="number" step="0.01" placeholder="Monto ($)" value={nivel.monto} onChange={(e) => handleNivelChange(index, 'monto', e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm" />
                    <button type="button" onClick={() => handleRemoveNivel(nivel.id)} className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddNivel} className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                + Agregar rango tarifa
              </button>
            </div>
          ) : (

            <div>
              <label htmlFor="valor-tarifa" className="block text-sm font-medium text-gray-700">Valor</label>
              <input
                id="valor-tarifa" type="number" step="0.01" required
                placeholder="Ej: 150.50"
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={valor} onChange={(e) => setValor(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end space-x-4 pt-4">
            {/* Botón de Cancelar (acción secundaria) */}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>

            {/* Botón de Guardar (acción principal) */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Tarifa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
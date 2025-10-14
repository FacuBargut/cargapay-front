'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Tarifa } from '@/app/tarifas/page';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tarifaToEdit?: Tarifa | null; // La tarifa a editar (opcional)
}

// Opciones de tarifas predefinidas que el usuario puede crear
const tarifaOptions = [
  "Valor por km recorrido",
  "Valor por hora de estadia",
  "Costo por boca",
];

export default function ModalTarifa({ isOpen, onClose, onSave, tarifaToEdit }: ModalProps) {
  const [name, setName] = useState(tarifaOptions[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!tarifaToEdit;


  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(tarifaToEdit.name);
        setValue(String(tarifaToEdit.value));
      } else {
        setName(tarifaOptions[0]);
        setValue('');
      }
      setError('');
    }
  }, [isOpen, isEditing, tarifaToEdit]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name,
      value: Number(value),
    };

    try {
      if (isEditing) {
        await api.patch(`${process.env.NEXT_PUBLIC_API_URL}/rates/${tarifaToEdit.id}`, payload);
      } else {
        await api.post(`${process.env.NEXT_PUBLIC_API_URL}/rates`, payload);
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
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar' : 'Nueva'} Tarifa</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nombre-tarifa" className="block text-sm font-medium text-gray-700">
              Nombre de la Tarifa
            </label>
            <select
              id="nombre-tarifa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {tarifaOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="valor-tarifa" className="block text-sm font-medium text-gray-700">
              Valor
            </label>
            <input
              id="valor-tarifa"
              type="number"
              step="0.01"
              required
              placeholder="Ej: 150.50"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Tarifa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




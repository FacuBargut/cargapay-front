'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCargaCreada: () => void;
}

export default function ModalNuevaCarga({ isOpen, onClose, onCargaCreada }: ModalProps) {
    const [codigo, setCodigo] = useState('');
    const [valorKm, setValorKm] = useState(''); // <-- Nuevo estado
    const [valorHora, setValorHora] = useState(''); // <-- Nuevo estado
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reseteamos los campos cuando el modal se abre
    useEffect(() => {
        if(isOpen) {
            setCodigo('');
            setValorKm('');
            setValorHora('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/cargas', { 
                code: Number(codigo),
                valor_km_recorrido: Number(valorKm), // <-- Nuevo dato
                valor_hora_estadia: Number(valorHora),   // <-- Nuevo dato
            });
            onCargaCreada();
            onClose();

        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al crear la carga.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
            <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Carga</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Input Código */}
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código de Carga</label>
                        <input id="codigo" type="number" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    </div>

                    {/* Input Valor KM */}
                    <div>
                        <label htmlFor="valorKm" className="block text-sm font-medium text-gray-700">Valor por KM Recorrido</label>
                        <input id="valorKm" type="number" step="0.01" placeholder="Ej: 150.50" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={valorKm} onChange={(e) => setValorKm(e.target.value)} />
                    </div>

                    {/* Input Valor Hora Estadía */}
                    <div>
                        <label htmlFor="valorHora" className="block text-sm font-medium text-gray-700">Valor por Hora de Estadía</label>
                        <input id="valorHora" type="number" step="0.01" placeholder="Ej: 2500.00" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={valorHora} onChange={(e) => setValorHora(e.target.value)} />
                    </div>
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar Carga'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCargaCreada: () => void;
}

export default function ModalNuevaCarga({ isOpen, onClose, onCargaCreada }: ModalProps) {
    const [codigo, setCodigo] = useState('');
    const [cantidadBocas, setCantidadBocas] = useState('');
    const [missingTarifas, setMissingTarifas] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCodigo('');
            setCantidadBocas('');
            setError('');
            setMissingTarifas([]);
        }
    }, [isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMissingTarifas([]);
        setLoading(true);

        try {
            await api.post('/cargas', {
                code: Number(codigo),
                cantidad_bocas: Number(cantidadBocas),
            });
            onCargaCreada();
            onClose();

        } catch (err: any) {
            // Manejamos el error 412 (Precondition Failed) que envía el backend
            if (err.response?.status === 412) {
                setError(err.response.data.message || 'Faltan tarifas por configurar.');
                setMissingTarifas(err.response.data.missing || []);
            } else {
                setError(err.response?.data?.message || 'Error al crear la carga.');
            }
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
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código de Carga</label>
                        <input placeholder="Ejemplo: 123456" id="codigo" type="number" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    </div>

                    <div>
                        <label htmlFor="bocas" className="block text-sm font-medium text-gray-700">Cantidad de Bocas (Clientes)</label>
                        <input id="bocas" type="number" placeholder="Ejemplo: 3" required className="mt-1 w-full rounded-md border-gray-300 shadow-sm" value={cantidadBocas} onChange={(e) => setCantidadBocas(e.target.value)} />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm font-semibold text-red-800 text-center">{error}</p>
                            
                            {/* Si hay tarifas faltantes, las listamos */}
                            {missingTarifas.length > 0 && (
                                <ul className="mt-2 list-disc list-inside text-left text-sm text-red-700">
                                    {missingTarifas.map(tarifa => (
                                        <li key={tarifa}>{tarifa}</li>
                                    ))}
                                </ul>
                                
                            )}

                            {/* El link solo aparece si el error es por tarifas */}
                            {missingTarifas.length > 0 && (
                                <div className="mt-3 text-center">
                                    <Link href="/tarifas" className="text-sm font-semibold text-indigo-600 hover:underline">
                                        Ir a configurar Tarifas
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-4 pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            disabled={loading}
                            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Guardar Carga'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
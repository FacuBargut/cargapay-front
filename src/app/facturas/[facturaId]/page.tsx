'use client';
import { Carga } from "@/app/cargas/[cargaId]/page";
import withAuth from "@/components/withAuth";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export interface Factura {
    id: number;
    periodo: string;
    fecha_emision: string; // La API lo envía como string
    monto_total: number;
    estado: 'pendiente' | 'pagada';
    cargas: Carga[]; // Un array de las cargas incluidas
}

function FacturaDetailPage() {
    const params = useParams();
    const facturaId = params.facturaId as string;
    const [factura, setFactura] = useState<Factura | null>(null);

    useEffect(() => {
        if (!facturaId) return;

        // 1. Definís una función async adentro
        const fetchFactura = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    // Manejar caso sin token, ej: redirigir
                    console.error("No hay token");
                    return;
                }

                // 2. Usás await dentro de esta nueva función
                const response = await api.get(`http://localhost:3000/facturacion/${facturaId}`);
                setFactura(response.data);

            } catch (err) {
                console.error("Error al obtener la factura:", err);
            }
        };

        // 3. Llamás a la función
        fetchFactura();

    }, [facturaId]);

    const { totalKm, totalHoras, subtotalKm, subtotalHoras } = useMemo(() => {
        if (!factura) {
            return { totalKm: 0, totalHoras: 0, subtotalKm: 0, subtotalHoras: 0 };
        }

        let totalKm = 0;
        let totalHoras = 0;
        let subtotalKm = 0;
        let subtotalHoras = 0;

        factura.cargas.forEach(carga => {
            carga.instructions?.forEach(inst => {
                if (inst.tipo === 'viaje' && inst.viaje) {
                    totalKm += Number(inst.viaje.cant_km);
                }
                if (inst.tipo === 'estadia' && inst.estadia) {
                    totalHoras += Number(inst.estadia.horas_estadia);
                }
            });
            // Calculamos los subtotales por carga y los sumamos
            subtotalKm += (carga.instructions?.filter(i => i.tipo === 'viaje').reduce((sum, i) => sum + Number(i.viaje?.cant_km), 0) ?? 0) * carga.valor_km_recorrido;
            subtotalHoras += (carga.instructions?.filter(i => i.tipo === 'estadia').reduce((sum, i) => sum + Number(i.estadia?.horas_estadia), 0) ?? 0) * carga.valor_hora_estadia;
        });

        return { totalKm, totalHoras, subtotalKm, subtotalHoras };
    }, [factura]);

    if (!factura) return <p className="p-10 text-center">Cargando factura...</p>;

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-lg">
                <header className="border-b pb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Detalle de Facturación</h1>
                    <p className="capitalize text-gray-500">{factura.periodo}</p>
                    <p className="text-sm text-gray-400">Emitida el: {new Date(factura.fecha_emision).toLocaleDateString('es-AR')}</p>
                </header>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-800">Cargas Incluidas ({factura.cargas.length})</h2>
                    <div className="mt-4 space-y-4 border-t pt-4">
                        {factura.cargas.map(carga => (
                            <div key={carga.id} className="rounded-lg border bg-white p-4">
                                <div className="flex justify-between font-bold">
                                    <span>Carga #{carga.code}</span>
                                </div>
                                <div className="mt-3 space-y-2 border-t pt-3">
                                    {carga.instructions?.map(inst => (
                                        <div key={inst.id} className="flex justify-between text-sm text-gray-600">
                                            {inst.tipo === 'viaje' && inst.viaje && (
                                                <>
                                                    <span>Viaje a {inst.viaje.localidad_destino} ({inst.viaje.cant_km} km)</span>
                                                    <span className="font-medium text-gray-800">
                                                        ${(Number(inst.viaje.cant_km) * carga.valor_km_recorrido).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </>
                                            )}
                                            {inst.tipo === 'estadia' && inst.estadia && (
                                                <>
                                                    <span>Estadía ({inst.estadia.horas_estadia} hs)</span>
                                                    <span className="font-medium text-gray-800">
                                                        ${(Number(inst.estadia.horas_estadia) * carga.valor_hora_estadia).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nueva sección de Desglose de Facturación */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold">Desglose de Facturación</h2>
                    <div className="mt-4 space-y-3 border-t pt-4">
                        {/* Fila para Viajes */}
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600">Total Viajes ({totalKm.toLocaleString('es-AR')} km)</span>
                            <span className="font-semibold text-gray-800">
                                ${subtotalKm.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        {/* Fila para Estadías */}
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600">Total Estadías ({totalHoras.toLocaleString('es-AR')} hs)</span>
                            <span className="font-semibold text-gray-800">
                                ${subtotalHoras.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t-2 border-gray-900 pt-6">
                    <div className="flex justify-between text-2xl">
                        <span className="font-bold text-gray-900">Monto Total a Facturar</span>
                        <span className="font-bold text-indigo-600">
                            {/* Agregamos Number() para asegurar la conversión */}
                            ${Number(factura.monto_total).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(FacturaDetailPage);
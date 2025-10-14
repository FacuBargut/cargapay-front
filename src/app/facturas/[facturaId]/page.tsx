'use client';
import { Carga } from "@/app/cargas/[cargaId]/page";
import withAuth from "@/components/withAuth";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export interface Factura {
    id: number;
    periodo: string;
    fecha_emision: string;
    monto_total: number;
    estado: 'pendiente' | 'pagada';
    cargas: Carga[];
}


function FacturaDetailPage() {
    const params = useParams();
    const facturaId = params.facturaId as string;
    const [factura, setFactura] = useState<Factura | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleDownloadPDF = () => {
        if (!factura) return;

        // 1. Guardamos el título original de la página.
        const originalTitle = document.title;

        // 2. Creamos el nombre de archivo dinámico.
        const fileName = `Factura-${factura.periodo.replace(/\s/g, '-')}.pdf`;

        // 3. Cambiamos el título de la página por el nombre del archivo.
        document.title = fileName;

        // 4. Llamamos a la función de imprimir.
        window.print();

        // 5. Restauramos el título original después de un breve momento.
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    useEffect(() => {
        if (!facturaId) return;

        const fetchFactura = async () => {
            try {
                // 2. Corregimos la URL del endpoint (usamos 'facturas' y no 'facturacion')
                const response = await api.get(`facturacion/${facturaId}`);
                setFactura(response.data);
            } catch (err) {
                setError("Error al obtener la factura.");
                console.error("Error al obtener la factura:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFactura();
    }, [facturaId]);

    // 3. Este 'useMemo' es solo para mostrar los subtotales, no para el cálculo principal
    const { subtotalViajes, subtotalEstadias, subtotalBocas, totalKm, totalHoras, totalBocas, valorKmPromedio, valorHoraPromedio } = useMemo(() => {
        if (!factura) {
            return { subtotalViajes: 0, subtotalEstadias: 0, subtotalBocas: 0, totalKm: 0, totalHoras: 0, totalBocas: 0 };
        }

        let subtotalViajes = 0;
        let subtotalEstadias = 0;
        let totalKm = 0;
        let totalHoras = 0;
        let totalBocas = 0;

        factura.cargas.forEach(carga => {
            totalBocas += Number(carga.cantidad_bocas) || 0;
            carga.instructions?.forEach(inst => {
                if (inst.tipo === 'viaje' && inst.viaje) {
                    totalKm += Number(inst.viaje.cant_km);
                    subtotalViajes += Number(inst.viaje.amount);
                }
                if (inst.tipo === 'estadia' && inst.estadia) {
                    totalHoras += Number(inst.estadia.horas_estadia);
                    subtotalEstadias += Number(inst.estadia.amount);
                }
            });
        });


        const valorKmPromedio = totalKm > 0 ? subtotalViajes / totalKm : 0;
        const valorHoraPromedio = totalHoras > 0 ? subtotalEstadias / totalHoras : 0;


        // Derivamos el costo de las bocas del total
        const subtotalBocas = Number(factura.monto_total) - (subtotalViajes + subtotalEstadias);

        return { subtotalViajes, subtotalEstadias, subtotalBocas, totalKm, totalHoras, totalBocas, valorKmPromedio, valorHoraPromedio };
    }, [factura]);

    if (loading) return <p className="p-10 text-center">Cargando factura...</p>;
    if (error) return <p className="p-10 text-center text-red-500">{error}</p>;
    if (!factura) return <p className="p-10 text-center">No se encontró la factura.</p>;

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-lg">
                <header className="border-b pb-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Detalle de Facturación</h1>
                    <p className="mt-1 capitalize text-gray-500">{factura.periodo}</p>
                    <p className="text-sm text-gray-400">Emitida el: {new Date(factura.fecha_emision).toLocaleDateString('es-AR')}</p>
                </header>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-800">Cargas Incluidas ({factura.cargas.length})</h2>
                    <div className="mt-4 space-y-4 border-t pt-4">
                        {factura.cargas.map(carga => (
                            <div key={carga.id} className="rounded-lg border bg-gray-50 p-4">
                                <div className="flex justify-between font-semibold">
                                    <span>Carga #{carga.code}</span>
                                    <span>Bocas: {carga.cantidad_bocas}</span>
                                </div>
                                <div className="mt-3 space-y-2 border-t pt-3">
                                    {carga.instructions?.length > 0 ? (
                                        carga.instructions.map(inst => (
                                            <div key={inst.id} className="flex justify-between text-sm text-gray-600">
                                                {inst.tipo === 'viaje' && inst.viaje && (
                                                    <>
                                                        {/* Mostramos las unidades (km) */}
                                                        <span>Viaje a {inst.viaje.localidad_destino} ({inst.viaje.cant_km} km)</span>
                                                        {/* Mostramos el monto guardado */}
                                                        <span className="font-medium text-gray-800">
                                                            ${Number(inst.viaje.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </>
                                                )}
                                                {inst.tipo === 'estadia' && inst.estadia && (
                                                    <>
                                                        {/* Mostramos las unidades (hs) */}
                                                        <span>Estadía ({inst.estadia.horas_estadia} hs)</span>
                                                        {/* Mostramos el monto guardado */}
                                                        <span className="font-medium text-gray-800">
                                                            ${Number(inst.estadia.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">Sin instrucciones registradas.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold">Desglose de Conceptos</h2>
                    <div className="mt-4 space-y-3 border-t pt-4">
                        {/* Fila para Viajes */}
                        <div className="flex justify-between text-base">
                            <div>
                                <p className="text-gray-600">Subtotal Viajes ({totalKm.toLocaleString('es-AR')} km)</p>
                                {/* Mostramos el valor promedio de la tarifa usada */}
                                <p className="text-sm text-gray-400">
                                    Valor por km recorrido: ${valorKmPromedio?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <span className="font-semibold text-gray-800">
                                ${subtotalViajes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Fila para Estadías */}
                        <div className="flex justify-between text-base">
                            <div>
                                <p className="text-gray-600">Subtotal Estadías ({totalHoras.toLocaleString('es-AR')} hs)</p>
                                {/* Mostramos el valor promedio de la tarifa usada */}
                                <p className="text-sm text-gray-400">
                                    Valor por hora de estadia: ${valorHoraPromedio?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <span className="font-semibold text-gray-800">
                                ${subtotalEstadias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Fila para Bocas */}
                        <div className="flex justify-between text-base">
                            <div>
                                <p className="text-gray-600">Subtotal Bocas ({totalBocas})</p>
                                {/* Mostramos el valor promedio de la tarifa usada */}
                                
                            </div>
                            <span className="font-semibold text-gray-800">
                                ${subtotalBocas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t-2 border-gray-900 pt-6">
                    <div className="flex justify-between text-2xl">
                        <span className="font-bold text-gray-900">Monto Total a Facturar</span>
                        <span className="font-bold text-indigo-600">
                            ${Number(factura.monto_total).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>

                <div className="mt-8 border-t pt-6 text-right print:hidden">
                    <button
                        onClick={() => handleDownloadPDF()}
                        className="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600"
                    >
                        Imprimir / Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export default withAuth(FacturaDetailPage);
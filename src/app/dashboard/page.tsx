// src/app/dashboard/page.tsx
'use client';
import Link from "next/link";
import withAuth from "@/components/withAuth";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ModalNuevaCarga from '@/components/modalNuevaCarga';
import api from "@/lib/api";
import { Instruction } from "../cargas/[cargaId]/page";
import Layout from "../../components/Layout";
// Componente para los íconos, para no repetir SVG
const Icon = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

interface Carga {
  id: number;
  code: number;
  estado: 'activa' | 'finalizada';
  instructions: Instruction[],
  valor_km_recorrido: number; // <-- Campo nuevo
  valor_hora_estadia: number;
}
const KpiCard = ({ title, value, iconPath, color }: { title: string, value: string, iconPath: string, color: string }) => (
  <div className="rounded-lg bg-white p-6 shadow-lg">
    <div className="flex items-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-md ${color}`}>
        <Icon path={iconPath} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

function DashboardPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCargas = async () => {
    // No reseteamos el loading aquí para evitar parpadeos al recargar
    try {
      const response = await api.get('/cargas');
      setCargas(response.data);
    } catch (err: any) {
      setError('Error al obtener las cargas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargas();
  }, []);


  const kpiData = useMemo(() => {
    const cargasActivas = cargas.filter(c => c.estado === 'activa').length;

    let totalKm = 0;
    let totalHoras = 0;
    let montoTotalFinalizadas = 0;

    cargas.forEach(carga => {
      carga.instructions?.forEach(inst => {
        if (inst.tipo === 'viaje' && inst.viaje) {
          totalKm += Number(inst.viaje.cant_km);
        }
        if (inst.tipo === 'estadia' && inst.estadia) {
          totalHoras += Number(inst.estadia.horas_estadia);
        }
      });

      if (carga.estado === 'finalizada') {
        const montoKm = (carga.instructions?.filter(i => i.tipo === 'viaje').reduce((sum, i) => sum + Number(i.viaje?.cant_km), 0) ?? 0) * carga.valor_km_recorrido;
        const montoHoras = (carga.instructions?.filter(i => i.tipo === 'estadia').reduce((sum, i) => sum + Number(i.estadia?.horas_estadia), 0) ?? 0) * carga.valor_hora_estadia;
        montoTotalFinalizadas += montoKm + montoHoras;
      }
    });

    return { cargasActivas, totalKm, totalHoras, montoTotalFinalizadas };
  }, [cargas]);

  return (
    <>
      <Layout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Operativo</h2>
          <div className="mt-4 flex space-x-2 sm:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              + Nueva Carga
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Cargas Activas" value={String(kpiData.cargasActivas)} iconPath="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 003.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 003.375 3.375v1.875a5.625 5.625 0 01-5.625-5.625V10.5a1.875 1.875 0 011.875-1.875h13.5A1.875 1.875 0 0121 10.5v3.375c0 3.109-2.516 5.625-5.625 5.625z" color="bg-blue-500" />
          <KpiCard title="KM Recorridos (Total)" value={kpiData.totalKm.toLocaleString('es-AR')} iconPath="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" color="bg-green-500" />
          <KpiCard title="Horas de Estadía (Total)" value={String(kpiData.totalHoras)} iconPath="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" color="bg-yellow-500" />
          <KpiCard title="Facturación Pendiente" value={`$${kpiData.montoTotalFinalizadas.toLocaleString('es-AR')}`} iconPath="M2.25 18.75a60.07 60.07 0 0115.797 2.108c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-12 6h9m-9 3h9m-9 3h9M3.75 6a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75c0 .414-.336.75-.75.75h-.75a.75.75 0 01-.75-.75V6z" color="bg-red-500" />
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900">Cargas Recientes</h3>
          <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-lg">
            {loading ? (
              <p className="p-6 text-center">Cargando cargas...</p>
            ) : error ? (
              <p className="p-6 text-center text-red-500">{error}</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {cargas.map((carga) => (
                    <tr key={carga.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{carga.code}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${carga.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {carga.estado}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Link href={`/cargas/${carga.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Layout>
      <ModalNuevaCarga
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCargaCreada={() => {
          setIsModalOpen(false);
          fetchCargas();
        }}
      />

    </>
  );
}

export default withAuth(DashboardPage);
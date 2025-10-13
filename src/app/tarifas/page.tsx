'use client';
import { useState } from 'react';
import withAuth from '@/components/withAuth';
import { usePathname } from 'next/navigation';
import Layout from '@/components/Layout';
// Asumimos que tenés un componente ModalTarifa y ConfirmationModal

const mockTarifas = [
  { id: 1, nombre: 'Valor por KM Recorrido', valor: 150.50 },
  { id: 2, nombre: 'Valor por Hora de Estadía', valor: 2500.00 },
  { id: 3, nombre: 'Costo por Boca (Cliente)', valor: 500.00 },
];

function TarifasPage() {
  const [tarifas, setTarifas] = useState(mockTarifas);
  const pathname = usePathname();
  // Aquí irían los estados para los modales

  return (
    <Layout>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Tarifas</h2>
          <button className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            + Agregar Tarifa
          </button>
        </div>

        <div className="mt-8">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre de la Tarifa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Valor Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tarifas.map((tarifa) => (
                  <tr key={tarifa.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{tarifa.nombre}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      ${tarifa.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-4">
                      <button className="cursor-pointer text-indigo-600 hover:text-indigo-900">Editar</button>
                      <button className="cursor-pointer text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </Layout>
  );
}

export default withAuth(TarifasPage);
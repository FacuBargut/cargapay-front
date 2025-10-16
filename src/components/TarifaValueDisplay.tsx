'use client';

import { Tarifa } from "@/app/tarifas/page";


export default function TarifaValueDisplay({ tarifa }: { tarifa: Tarifa }) {
  if (tarifa.configuracion_escalonada && tarifa.configuracion_escalonada.niveles.length > 0) {
    return (
      <ul className="space-y-1 text-xs">
        {tarifa.configuracion_escalonada.niveles.map((nivel, index) => (
          <li key={index}>
            <span className="font-semibold">De {nivel.desde} a {nivel.hasta} bocas:</span>
            <span className="font-mono"> ${nivel.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tarifa.value !== null) {
    return (
      <span>
        ${tarifa.value?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </span>
    );
  }

  return <span className="text-gray-400">No establecido</span>;
}
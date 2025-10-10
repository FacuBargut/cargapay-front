'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/'); // Redirige al login
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/cargas', label: 'Cargas' },
    { href: '/tarifas', label: 'Tarifas' },
  ];

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col bg-gray-800 p-4 text-white md:flex">
      <div>
        <h1 className="text-2xl font-bold">CargaPay</h1>
        <nav className="mt-8 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md py-2 px-3 hover:bg-gray-700 ${
                pathname === link.href ? 'bg-gray-900' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full rounded-md py-2 px-3 text-left text-red-400 hover:bg-gray-700 hover:text-red-300"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
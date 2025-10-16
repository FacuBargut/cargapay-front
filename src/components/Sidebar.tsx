'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/cargas', label: 'Cargas' },
    { href: '/tarifas', label: 'Tarifas' },
  ];

  return (
    <>     
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col flex-shrink-0 transform flex-col bg-gray-800 p-4 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">CargaPay</h1>
          <nav className="mt-8 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={toggle}
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
            className="cursor-pointer w-full rounded-md py-2 px-3 text-left text-red-400 hover:bg-gray-700 hover:text-red-300"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggle}
        ></div>
      )}
    </>
  );
}
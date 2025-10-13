'use client';
import { useState } from "react";
import Sidebar from "./Sidebar";

const HamburgerIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 2. Pasamos el estado y la función de toggle al Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* 3. Header que solo es visible en móvil para mostrar el botón */}
        <header className="flex items-center justify-between bg-white p-4 shadow-md md:hidden">
          <h1 className="text-xl font-bold text-gray-800">CargaPay</h1>
          <button onClick={toggleSidebar} className="cursor-pointer text-gray-500">
            <HamburgerIcon />
          </button>
        </header>

        {/* 4. Contenido principal */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
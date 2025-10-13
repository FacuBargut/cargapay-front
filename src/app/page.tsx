'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';


export default function LoginPage() {

    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Evita que la página se recargue
        setError(''); // Limpiamos errores previos
    
        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            mail: mail,
            password: password, // Asegurate que los nombres coincidan con tu DTO y API
          });
    
          // Si el login es exitoso...
          const { access_token } = response.data;
          
          // Guardamos el token en el almacenamiento local del navegador
          localStorage.setItem('token', access_token);
    
          // Redirigimos al usuario a la página de dashboard
          router.push('/dashboard');
    
        } catch (err: any) {
          // Si hay un error (ej. credenciales incorrectas)
          console.error('Error en el login:', err);
          const errorMessage = err.response?.data?.message || 'Error al iniciar sesión. Intentá de nuevo.';
          setError(errorMessage);
        }
      };

      useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
          // Si encontramos un token, redirigimos al dashboard
          router.push('/dashboard');
        }else{
          setLoading(false);
        }
      }, [router]);

      if (loading) {
        return <div className="flex h-screen items-center justify-center bg-gray-100">Cargando...</div>;
      }
      return (
        <div className="min-h-screen w-full bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
            {/* Columna Izquierda: El Formulario */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-12">
              <div className="w-full max-w-md">
                {/* Logo y Nombre de la App */}
                <div className="mb-8 flex items-center justify-start">
                  <svg className="h-8 w-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="#1F2937" />
                    <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="white" />
                  </svg>
                  <span className="ml-3 text-2xl font-semibold text-gray-900">
                    CargaPay
                  </span>
                </div>
    
                <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
    
                {/* 5. Conectamos la función al formulario */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                  {/* Campo Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mail
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="tu-mail@ejemplo.com"
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                      />
                    </div>
                  </div>
    
                  {/* Campo Contraseña */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contraseña
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* 6. Bloque para mostrar errores */}
                  {error && (
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}
    
                  {/* Botón de Submit */}
                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-md bg-gray-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              </div>
            </div>
    
            {/* Columna Derecha: El Panel de Bienvenida */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-gray-900 text-white p-12">
              <div className="w-full max-w-md">
                <div className="mb-10 flex justify-center">
                  <svg className="h-24 w-auto" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0L32 16L16 32L0 16L16 0Z" fill="#FFFFFF" />
                    <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="#1F2937" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-center">Bienvenido a CargaPay</h2>
                <p className="mt-4 text-center text-gray-400">
                  La solución integral para la facturación de tu logística.
                  Organizá tus viajes, controlá tus gastos y facturá sin complicaciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
}
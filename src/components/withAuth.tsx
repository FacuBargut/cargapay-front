// src/components/withAuth.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthComponent = (props: any) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      } else {
        setIsLoading(false);
      }
    }, [router]);

    if (isLoading) {
      // Podés mostrar un spinner de carga mientras se verifica el token
      return <div className="flex h-screen items-center justify-center">Cargando...</div>;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
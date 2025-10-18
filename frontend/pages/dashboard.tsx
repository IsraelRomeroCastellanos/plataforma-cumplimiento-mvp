// frontend/pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Panel de Control</h1>
      <p>Bienvenido, <strong>{user.email}</strong></p>
      <p>Rol: {user.role}</p>
      {user.empresaId && <p>Empresa ID: {user.empresaId}</p>}
      <button onClick={handleLogout} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        Cerrar Sesión
      </button>
    </div>
  );
}
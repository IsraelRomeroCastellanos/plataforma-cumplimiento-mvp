// frontend/pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Bienvenido al Sistema</h1>
        <p>Tu sesión está activa. Usa el menú para navegar.</p>
      </div>
    </div>
  );
}
// frontend/pages/admin/matrices.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function Matrices() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') {
      router.push('/login');
    }
  }, [router]);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Matrices de Riesgo</h1>
        <p>Próximamente: generación y gestión de matrices de riesgo por cliente.</p>
      </div>
    </div>
  );
}
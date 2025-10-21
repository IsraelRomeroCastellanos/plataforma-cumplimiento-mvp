// frontend/pages/admin/barridos.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

export default function Barridos() {
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
        <h1>Barridos de Listas</h1>
        <p>Próximamente: configuración y ejecución de barridos PPE, sanciones y países de riesgo.</p>
      </div>
    </div>
  );
}
// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchUsuarios = async () => {
      try {
        const res = await axios.get('/api/admin/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(res.data.usuarios);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar usuarios');
      }
    };

    fetchUsuarios();
  }, [router]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Consola Administrativa</h1>
      <p>Gestión de Usuarios</p>
      <table
        style={{
          marginTop: '1rem',
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ccc'
        }}
      >
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Rol</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Empresa ID</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Creado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u: any) => (
            <tr key={u.id}>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.email}</td>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.rol}</td>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.empresa_id || '—'}</td>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                {new Date(u.creado_en).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
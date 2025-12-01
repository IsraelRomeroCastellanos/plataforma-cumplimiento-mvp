// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : '{}';
    const user = userRaw ? JSON.parse(userRaw) : {};

    if (!token || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchUsuarios = async () => {
      try {
        const res = await axios.get('/api/admin/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuarios(res.data.usuarios || []);
      } catch (err: any) {
        console.error('Error al cargar usuarios:', err);
        setError(err.response?.data?.error || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [router]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Gestión de Usuarios</h1>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        {usuarios.length === 0 ? (
          <p>No se encontraron usuarios.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Email</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nombre</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Rol</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Empresa</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Activo</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{usuario.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{usuario.email}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{usuario.nombre_completo}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{usuario.rol}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{usuario.empresa_id || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                    {usuario.activo ? '✅' : '❌'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                    <button
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
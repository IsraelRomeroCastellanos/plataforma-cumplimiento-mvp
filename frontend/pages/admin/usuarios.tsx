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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');
        
        if (!token || !userRaw) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userRaw);
        if (user.role !== 'admin') {
          router.push('/login');
          return;
        }

        // ✅ Asegura que la solicitud incluya el token
        const response = await axios.get('/api/admin/usuarios', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // ✅ Procesa la respuesta correctamente
        if (response.data && Array.isArray(response.data.usuarios)) {
          setUsuarios(response.data.usuarios);
        } else {
          setError('Formato de respuesta inválido');
        }
      } catch (err: any) {
        console.error('Error detallado:', err);
        if (err.response) {
          setError(err.response.data?.error || 'Error del servidor');
        } else if (err.request) {
          setError('No se recibió respuesta del servidor');
        } else {
          setError('Error al configurar la solicitud');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem' }}>Cargando usuarios...</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
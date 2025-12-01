// frontend/pages/cliente/clientes.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : '{}';
    const user = userRaw ? JSON.parse(userRaw) : {};

    if (!token || !['admin', 'consultor', 'cliente'].includes(user.role)) {
      router.push('/login');
      return;
    }

    const fetchClientes = async () => {
      try {
        setError('');
        const res = await axios.get('/api/cliente/mis-clientes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClientes(res.data.clientes || []);
      } catch (err: any) {
        console.error('Error al cargar clientes:', err);
        setError(err.response?.data?.error || 'Error al cargar clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Mis Clientes</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => router.push('/cliente/registrar')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Registrar Cliente
            </button>
            <button
              onClick={() => router.push('/cliente/carga-masiva')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Carga Masiva
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        {clientes.length === 0 ? (
          <p>No se encontraron clientes.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nombre</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Tipo</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Actividad</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Estado</th>
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cliente.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cliente.nombre_entidad}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cliente.tipo_cliente}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{cliente.actividad_economica}</td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                    {cliente.estado === 'activo' ? '✅' : '❌'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                    <button
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: cliente.estado === 'activo' ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Lógica para activar/desactivar
                      }}
                    >
                      {cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
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
// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

        const response = await axios.get('/api/admin/usuarios', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && Array.isArray(response.data.usuarios)) {
          setUsuarios(response.data.usuarios);
        } else {
          setError('Formato de respuesta inválido');
        }
      } catch (err: any) {
        console.error('Error detallado:', err);
        setError(err.response?.data?.error || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleToggleEstado = async (usuario: any) => {
    if (usuario.email === 'admin@cumplimiento.com') {
      alert('El usuario raíz no puede desactivarse');
      return;
    }

    const nuevoEstado = !usuario.activo;
    const token = localStorage.getItem('token');

    try {
      await axios.put(`/api/admin/usuarios/${usuario.id}`, { activo: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: nuevoEstado } : u));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const handleResetPassword = async (usuarioId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/admin/usuarios/${usuarioId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTempPassword(res.data.temporalPassword);
      setShowResetModal(true);
      setSelectedUserId(usuarioId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer contraseña');
    }
  };

  const handleEdit = (usuario: any) => {
    router.push(`/admin/editar-usuario/${usuario.id}`);
  };

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
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(usuario)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleEstado(usuario)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: usuario.activo ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(usuario.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Restablecer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showResetModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>Contraseña temporal generada</h3>
              <p><strong>{tempPassword}</strong></p>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
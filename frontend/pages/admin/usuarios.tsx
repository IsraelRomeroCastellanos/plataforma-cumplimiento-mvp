// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUsuarios(storedToken);
    } else {
      router.push('/login');
    }
  }, []);

  const fetchUsuarios = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/usuarios', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (response.data && Array.isArray(response.data.usuarios)) {
        setUsuarios(response.data.usuarios);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.response?.data?.error || 'Error al cargar usuarios');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;
    
    try {
      await axios.put(`/api/admin/usuarios/${id}/desactivar`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Usuario desactivado correctamente');
      fetchUsuarios(token);
    } catch (err: any) {
      console.error('Error al desactivar usuario:', err);
      toast.error(err.response?.data?.error || 'Error al desactivar usuario');
    }
  };

  const handleEditar = (id: number) => {
    router.push(`/admin/editar-usuario/${id}`);
  };

  const handleVerDetalle = (id: number) => {
    router.push(`/admin/usuarios/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <button
              onClick={() => router.push('/admin/crear-usuario')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Usuario
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rol</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Empresa</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {usuario.nombre_completo}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">{usuario.email}</td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.rol === 'admin' ? 'bg-green-100 text-green-800' :
                        usuario.rol === 'consultor' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {usuario.empresa_id ? `Empresa ${usuario.empresa_id}` : 'N/A'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerDetalle(usuario.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditar(usuario.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        {usuario.activo && (
                          <button
                            onClick={() => handleDesactivar(usuario.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {usuarios.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron usuarios
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
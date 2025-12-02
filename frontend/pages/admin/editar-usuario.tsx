// frontend/pages/admin/editar-usuario.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { ToastContainer, toast } from 'react-toastify';

// Definir el tipo para el usuario
interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  empresa_id?: number | null;
  activo: boolean;
}

export default function EditarUsuario() {
  const [usuario, setUsuario] = useState<Usuario>({
    id: 0,
    nombre_completo: '',
    email: '',
    rol: '',
    empresa_id: null,
    activo: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { id } = router.query;
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      if (id) {
        fetchUsuario(storedToken);
      }
    } else {
      router.push('/login');
    }
  }, [id]);

  const fetchUsuario = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (response.data && response.data.usuario) {
        setUsuario(response.data.usuario);
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err: any) {
      console.error('Error al cargar usuario:', err);
      setError(err.response?.data?.error || 'Error al cargar usuario');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/usuarios/${id}`, usuario, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Usuario actualizado correctamente');
      setTimeout(() => router.push('/admin/usuarios'), 1500);
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar caso especial para checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUsuario((prev: Usuario) => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Manejar caso especial para empresa_id que puede ser null
    if (name === 'empresa_id' && value === '') {
      setUsuario((prev: Usuario) => ({ ...prev, empresa_id: null }));
      return;
    }
    
    // Manejo estándar para otros tipos
    if (name === 'empresa_id') {
      setUsuario((prev: Usuario) => ({ ...prev, [name]: value ? parseInt(value) : null }));
    } else if (name === 'activo') {
      setUsuario((prev: Usuario) => ({ ...prev, [name]: value === 'true' }));
    } else {
      setUsuario((prev: Usuario) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando usuario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
            <p className="mt-1 text-sm text-gray-500">Actualiza la información del usuario</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    id="nombre_completo"
                    value={usuario.nombre_completo}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={usuario.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    name="rol"
                    id="rol"
                    value={usuario.rol}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="admin">Administrador</option>
                    <option value="consultor">Consultor</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="empresa_id" className="block text-sm font-medium text-gray-700">
                    Empresa (solo para clientes)
                  </label>
                  <input
                    type="number"
                    name="empresa_id"
                    id="empresa_id"
                    value={usuario.empresa_id || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ID de la empresa"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Solo es necesario para usuarios con rol de cliente
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="activo" className="flex items-center">
                    <input
                      type="checkbox"
                      name="activo"
                      id="activo"
                      checked={usuario.activo}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
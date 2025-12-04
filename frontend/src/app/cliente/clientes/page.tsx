'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { FiFilePlus, FiUpload, FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

interface Cliente {
  id: number;
  nombre_entidad: string;
  tipo_cliente: string;
  actividad_economica: string;
  estado_bien: string;
  alias?: string;
  creado_en: string;
}

export default function GestionClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'detalle' | 'crear'>('detalle');
  const [formData, setFormData] = useState({
    nombre_entidad: '',
    tipo_cliente: 'persona_fisica',
    actividad_economica: '',
    estado_bien: 'activo',
    alias: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.rol === 'cliente' || user.rol === 'admin' || user.rol === 'consultor') {
        setToken(storedToken);
        fetchClientes(storedToken);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchClientes = async (authToken: string) => {
    try {
      setLoading(true);
      const data = await api.get('/api/cliente', authToken);
      
      if (data.clientes && Array.isArray(data.clientes)) {
        setClientes(data.clientes);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.message || 'Error al cargar clientes');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalType('detalle');
    setShowModal(true);
  };

  const handleCrearCliente = () => {
    setModalType('crear');
    setShowModal(true);
    setFormData({
      nombre_entidad: '',
      tipo_cliente: 'persona_fisica',
      actividad_economica: '',
      estado_bien: 'activo',
      alias: ''
    });
  };

  const handleCargarMasiva = () => {
    router.push('/cliente/carga-masiva');
  };

  const handleSubmitCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/api/cliente', formData, token);
      
      toast.success('Cliente creado exitosamente');
      setShowModal(false);
      fetchClientes(token);
    } catch (err: any) {
      console.error('Error al crear cliente:', err);
      toast.error(err.message || 'Error al crear cliente');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando clientes...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleCargarMasiva}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <FiUpload size={18} />
              <span>Carga Masiva</span>
            </button>
            <button
              onClick={handleCrearCliente}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiFilePlus size={18} />
              <span>Registrar Cliente</span>
            </button>
          </div>
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
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actividad</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Alias</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {cliente.nombre_entidad}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      cliente.tipo_cliente === 'persona_fisica' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {cliente.tipo_cliente === 'persona_fisica' ? 'Persona Física' : 'Persona Moral'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{cliente.actividad_economica}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      cliente.estado_bien === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cliente.estado_bien.charAt(0).toUpperCase() + cliente.estado_bien.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{cliente.alias || 'N/A'}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {new Date(cliente.creado_en).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerDetalle(cliente)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Ver detalles"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/cliente/editar-cliente/${cliente.id}`)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Editar cliente"
                      >
                        <FiEdit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clientes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron clientes
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'detalle' ? 'Detalles del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <FiX size={24} />
              </button>
            </div>

            {modalType === 'detalle' && selectedCliente && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCliente.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre de la Entidad</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCliente.nombre_entidad}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo de Cliente</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedCliente.tipo_cliente === 'persona_fisica' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedCliente.tipo_cliente === 'persona_fisica' ? 'Persona Física' : 'Persona Moral'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Actividad Económica</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedCliente.actividad_economica}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedCliente.estado_bien === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCliente.estado_bien.charAt(0).toUpperCase() + selectedCliente.estado_bien.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Alias</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCliente.alias || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedCliente.creado_en).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {modalType === 'crear' && (
              <form onSubmit={handleSubmitCrear} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nombre_entidad" className="block text-sm font-medium text-gray-700">
                      Nombre de la Entidad
                    </label>
                    <input
                      id="nombre_entidad"
                      name="nombre_entidad"
                      type="text"
                      required
                      value={formData.nombre_entidad}
                      onChange={(e) => setFormData({...formData, nombre_entidad: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="tipo_cliente" className="block text-sm font-medium text-gray-700">
                      Tipo de Cliente
                    </label>
                    <select
                      id="tipo_cliente"
                      name="tipo_cliente"
                      value={formData.tipo_cliente}
                      onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="persona_fisica">Persona Física</option>
                      <option value="persona_moral">Persona Moral</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="actividad_economica" className="block text-sm font-medium text-gray-700">
                      Actividad Económica
                    </label>
                    <input
                      id="actividad_economica"
                      name="actividad_economica"
                      type="text"
                      required
                      value={formData.actividad_economica}
                      onChange={(e) => setFormData({...formData, actividad_economica: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ejemplo: venta_de_inmuebles, servicios_profesionales
                    </p>
                  </div>

                  <div>
                    <label htmlFor="estado_bien" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="estado_bien"
                      name="estado_bien"
                      value={formData.estado_bien}
                      onChange={(e) => setFormData({...formData, estado_bien: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                      Alias (Opcional)
                    </label>
                    <input
                      id="alias"
                      name="alias"
                      type="text"
                      value={formData.alias}
                      onChange={(e) => setFormData({...formData, alias: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Nombre corto para identificar al cliente
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Registrar Cliente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
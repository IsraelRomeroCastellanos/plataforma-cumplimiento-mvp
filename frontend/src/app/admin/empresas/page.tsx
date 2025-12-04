'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

export default function GestionEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'detalle' | 'crear'>('detalle');
  const [formData, setFormData] = useState({
    nombre_legal: '',
    rfc: '',
    direccion: '',
    tipo_entidad: 'persona_moral',
    estado: 'activo'
  });

  const fetchEmpresas = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin/empresas', authToken);
      
      if (data.empresas && Array.isArray(data.empresas)) {
        setEmpresas(data.empresas);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar empresas:', err);
      setError(err.message || 'Error al cargar empresas');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.rol === 'admin') {
        setToken(storedToken);
        fetchEmpresas(storedToken);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchEmpresas]);

  const handleVerDetalle = (empresa: any) => {
    setSelectedEmpresa(empresa);
    setModalType('detalle');
    setShowModal(true);
  };

  const handleEditar = (id: number) => {
    router.push(`/admin/editar-empresa/${id}`);
  };

  const handleCrearEmpresa = () => {
    setModalType('crear');
    setShowModal(true);
    setFormData({
      nombre_legal: '',
      rfc: '',
      direccion: '',
      tipo_entidad: 'persona_moral',
      estado: 'activo'
    });
  };

  const handleSubmitCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/api/admin/empresas', formData, token);
      
      toast.success('Empresa creada exitosamente');
      setShowModal(false);
      fetchEmpresas(token);
    } catch (err: any) {
      console.error('Error al crear empresa:', err);
      toast.error(err.message || 'Error al crear empresa');
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
              <span>Cargando empresas...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <button
            onClick={handleCrearEmpresa}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiPlus size={18} />
            <span>Crear Empresa</span>
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
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre Legal</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">RFC</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dirección</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo Entidad</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {empresa.nombre_legal}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{empresa.rfc}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {empresa.direccion ? empresa.direccion : 'Sin dirección registrada'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      empresa.tipo_entidad === 'persona_moral' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {empresa.tipo_entidad === 'persona_moral' ? 'Persona Moral' : 'Persona Física'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      empresa.estado === 'activo' ? 'bg-green-100 text-green-800' :
                      empresa.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerDetalle(empresa)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Ver detalles"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditar(empresa.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Editar empresa"
                      >
                        <FiEdit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {empresas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron empresas
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
                {modalType === 'detalle' ? 'Detalles de la Empresa' : 'Crear Nueva Empresa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <FiX size={24} />
              </button>
            </div>

            {modalType === 'detalle' && selectedEmpresa && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEmpresa.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre Legal</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEmpresa.nombre_legal}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">RFC</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEmpresa.rfc}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Dirección</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedEmpresa.direccion || 'Sin dirección registrada'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo de Entidad</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedEmpresa.tipo_entidad === 'persona_moral' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {selectedEmpresa.tipo_entidad === 'persona_moral' ? 'Persona Moral' : 'Persona Física'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedEmpresa.estado === 'activo' ? 'bg-green-100 text-green-800' :
                    selectedEmpresa.estado === 'suspendido' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmpresa.estado.charAt(0).toUpperCase() + selectedEmpresa.estado.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedEmpresa.creado_en).toLocaleDateString('es-MX', {
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
                    <label htmlFor="nombre_legal" className="block text-sm font-medium text-gray-700">
                      Nombre Legal
                    </label>
                    <input
                      id="nombre_legal"
                      name="nombre_legal"
                      type="text"
                      required
                      value={formData.nombre_legal}
                      onChange={(e) => setFormData({...formData, nombre_legal: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">
                      RFC
                    </label>
                    <input
                      id="rfc"
                      name="rfc"
                      type="text"
                      required
                      value={formData.rfc}
                      onChange={(e) => setFormData({...formData, rfc: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <textarea
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Dirección completa de la empresa
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tipo_entidad" className="block text-sm font-medium text-gray-700">
                      Tipo de Entidad
                    </label>
                    <select
                      id="tipo_entidad"
                      name="tipo_entidad"
                      value={formData.tipo_entidad}
                      onChange={(e) => setFormData({...formData, tipo_entidad: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="persona_moral">Persona Moral</option>
                      <option value="persona_fisica">Persona Física</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="suspendido">Suspendido</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
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
                    Crear Empresa
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
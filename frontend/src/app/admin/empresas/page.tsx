'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function GestionEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');

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
  }, []);

  const fetchEmpresas = async (authToken: string) => {
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
  };

  const handleCrearEmpresa = () => {
    router.push('/admin/crear-empresa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Cargando empresas...</div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Crear Empresa
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
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Activa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {empresa.nombre_legal}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{empresa.rfc}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">{empresa.direccion}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      empresa.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {empresa.activa ? 'Activa' : 'Inactiva'}
                    </span>
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
    </div>
  );
}
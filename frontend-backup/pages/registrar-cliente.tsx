import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FormData {
  email: string;
  password: string;
  nombre_completo: string;
  nombre_empresa: string;
  rfc: string;
  tipo_entidad: string;
  nombre_cliente: string;
  tipo_cliente: string;
  actividad_economica: string;
}

export default function RegistrarCliente() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre_completo: '',
    nombre_empresa: '',
    rfc: '',
    tipo_entidad: 'persona_moral',
    nombre_cliente: '',
    tipo_cliente: 'persona_fisica',
    actividad_economica: ''
  });
  const [mensaje, setMensaje] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/cliente', formData);
      setMensaje('✅ Cliente registrado exitosamente');
      toast.success('Cliente registrado exitosamente');
      
      setFormData({
        email: '',
        password: '',
        nombre_completo: '',
        nombre_empresa: '',
        rfc: '',
        tipo_entidad: 'persona_moral',
        nombre_cliente: '',
        tipo_cliente: 'persona_fisica',
        actividad_economica: ''
      });
    } catch (err: any) {
      console.error('Error al registrar cliente:', err);
      const errorMessage = err.response?.data?.error || 'Falló el registro';
      setMensaje(`❌ Error: ${errorMessage}`);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Nuevo Cliente</h1>
            
            {mensaje && (
              <div className={`mb-4 p-3 rounded-md ${
                mensaje.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {mensaje}
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="nombre_completo"
                      id="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="nombre_empresa" className="block text-sm font-medium text-gray-700">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      name="nombre_empresa"
                      id="nombre_empresa"
                      value={formData.nombre_empresa}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rfc" className="block text-sm font-medium text-gray-700">
                      RFC
                    </label>
                    <input
                      type="text"
                      name="rfc"
                      id="rfc"
                      value={formData.rfc}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="tipo_entidad" className="block text-sm font-medium text-gray-700">
                      Tipo de Entidad
                    </label>
                    <select
                      name="tipo_entidad"
                      id="tipo_entidad"
                      value={formData.tipo_entidad}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="persona_moral">Persona Moral</option>
                      <option value="persona_fisica">Persona Física</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="nombre_cliente" className="block text-sm font-medium text-gray-700">
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      name="nombre_cliente"
                      id="nombre_cliente"
                      value={formData.nombre_cliente}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="tipo_cliente" className="block text-sm font-medium text-gray-700">
                      Tipo de Cliente
                    </label>
                    <select
                      name="tipo_cliente"
                      id="tipo_cliente"
                      value={formData.tipo_cliente}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
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
                      type="text"
                      name="actividad_economica"
                      id="actividad_economica"
                      value={formData.actividad_economica}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ejemplo: venta_de_inmuebles, servicios_profesionales, comercio_al_por_mayor
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Registrar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
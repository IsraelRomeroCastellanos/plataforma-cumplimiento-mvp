// frontend/pages/cliente/clientes.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_entidad: '',
    tipo_cliente: 'persona_fisica',
    actividad_economica: '',
    alias: '',
    fecha_nacimiento_constitucion: '',
    nacionalidad: '',
    domicilio_mexico: '',
    ocupacion: '',
    empresa_id: ''
  });

  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmpresaId, setUserEmpresaId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUserRole(user.role);
        setUserEmpresaId(user.empresaId || null);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};

    if (!token || !['admin', 'consultor', 'cliente'].includes(user.role)) {
      router.push('/login');
      return;
    }

    const fetchClientes = async () => {
      try {
        const res = await axios.get('/api/cliente/mis-clientes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClientes(res.data.clientes);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar clientes');
      }
    };

    fetchClientes();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};

    let empresaId;
    if (user.role === 'cliente') {
      if (!user.empresaId) {
        setError('Tu usuario no tiene una empresa asignada');
        return;
      }
      empresaId = user.empresaId;
    } else {
      if (!formData.empresa_id) {
        setError('Selecciona una empresa');
        return;
      }
      empresaId = formData.empresa_id;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/cliente/registrar', { ...formData, empresa_id: empresaId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const res = await axios.get('/api/cliente/mis-clientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(res.data.clientes);
      setShowModal(false);
      setFormData({
        nombre_entidad: '',
        tipo_cliente: 'persona_fisica',
        actividad_economica: '',
        alias: '',
        fecha_nacimiento_constitucion: '',
        nacionalidad: '',
        domicilio_mexico: '',
        ocupacion: '',
        empresa_id: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente (handleCreate, handleToggleEstado, etc.) ...
};
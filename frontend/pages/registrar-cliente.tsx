import { useState } from 'react';
import axios from 'axios';

export default function RegistrarCliente() {
  const [formData, setFormData] = useState({
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
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/cliente', formData);
      setMensaje('✅ Cliente registrado exitosamente');
    } catch (err) {
      setMensaje('❌ Error: ' + (err.response?.data?.error || 'Falló el registro'));
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Registrar Nuevo Cliente</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email: <input name="email" value={formData.email} onChange={handleChange} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Contraseña: <input name="password" type="password" value={formData.password} onChange={handleChange} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nombre completo: <input name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nombre de la empresa: <input name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>RFC: <input name="rfc" value={formData.rfc} onChange={handleChange} /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Tipo de entidad:
            <select name="tipo_entidad" value={formData.tipo_entidad} onChange={handleChange}>
              <option value="persona_fisica">Persona Física</option>
              <option value="persona_moral">Persona Moral</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nombre del cliente: <input name="nombre_cliente" value={formData.nombre_cliente} onChange={handleChange} required /></label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Tipo de cliente:
            <select name="tipo_cliente" value={formData.tipo_cliente} onChange={handleChange}>
              <option value="persona_fisica">Persona Física</option>
              <option value="persona_moral">Persona Moral</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Actividad económica: <input name="actividad_economica" value={formData.actividad_economica} onChange={handleChange} /></label>
        </div>
        <button type="submit">Registrar Cliente</button>
      </form>
      {mensaje && <p style={{ marginTop: '1rem', color: mensaje.includes('✅') ? 'green' : 'red' }}>{mensaje}</p>}
    </div>
  );
}

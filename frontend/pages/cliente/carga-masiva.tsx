// frontend/pages/cliente/carga-masiva.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function CargaMasiva() {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');

    // Leer el archivo como texto (UTF-8)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(selectedFile, 'utf-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!csvContent) {
      setError('Selecciona un archivo CSV válido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/api/carga-directa', { csvContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`✅ ${res.data.message}`);
      // Limpiar formulario
      setFile(null);
      setCsvContent('');
      (document.getElementById('fileInput') as HTMLInputElement).value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Carga Masiva de Clientes</h1>
        <p>Sube un archivo CSV con la siguiente estructura:</p>
        <ul>
          <li><strong>Campos obligatorios</strong>: nombre_entidad, tipo_cliente, actividad_economica</li>
          <li><strong>Ejemplo</strong>:
            <pre style={{ backgroundColor: '#f1f1f1', padding: '0.5rem', fontSize: '0.9rem' }}>
nombre_entidad,tipo_cliente,actividad_economica
Juan Pérez,persona_fisica,venta_de_inmuebles
            </pre>
          </li>
        </ul>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="fileInput">Seleccionar archivo CSV:</label>
            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ marginLeft: '0.5rem', width: '100%', maxWidth: '300px' }}
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading || !csvContent}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Procesando...' : 'Subir Clientes'}
          </button>
        </form>
      </div>
    </div>
  );
}
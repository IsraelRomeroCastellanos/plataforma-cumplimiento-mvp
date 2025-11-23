// frontend/pages/cliente/carga-masiva.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function CargaMasiva() {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión');
        return;
      }
      
      const response = await fetch('/api/cliente/plantilla', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_clientes.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo descargar la plantilla');
    }
  };

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const lines = text.split('\n').slice(0, 5);
      setPreview(lines);
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
      setFile(null);
      setCsvContent('');
      setPreview([]);
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
        </ul>

        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={downloadTemplate}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📥 Descargar Plantilla Excel (.xlsx)
          </button>
        </div>

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

          {preview.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <strong>Vista previa (primeras 5 líneas):</strong>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {preview.join('\n')}
              </pre>
            </div>
          )}

          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
          {success && <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>}
          
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
              marginTop: '1rem'
            }}
          >
            {loading ? 'Procesando...' : 'Subir Clientes'}
          </button>
        </form>
      </div>
    </div>
  );
}
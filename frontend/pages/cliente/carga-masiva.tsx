// frontend/pages/cliente/carga-masiva.tsx
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function CargaMasiva() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Leer y previsualizar el archivo
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validar encabezados mínimos
      const requiredHeaders = ['nombre_entidad', 'tipo_cliente', 'actividad_economica'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        setError(`Faltan columnas requeridas: ${missing.join(', ')}`);
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {}; // 👈 Tipado explícito
        headers.forEach((header, i) => {
          row[header] = values[i] ? values[i].trim() : '';
        });
        return row;
      });

      setPreview(data.slice(0, 5)); // Mostrar solo primeras 5 filas
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona un archivo CSV');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/cliente/carga-masiva', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(`✅ ${res.data.successCount} clientes cargados exitosamente`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      setPreview([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el archivo');
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
          <li><strong>Campos opcionales</strong>: alias, fecha_nacimiento_constitucion, nacionalidad, domicilio_mexico, ocupacion</li>
          <li><strong>Ejemplo</strong>:
            <pre style={{ backgroundColor: '#f1f1f1', padding: '0.5rem' }}>
nombre_entidad,tipo_cliente,actividad_economica,alias
Juan Pérez,persona_fisica,venta_de_inmuebles,JP
            </pre>
          </li>
        </ul>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          {preview.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Vista previa (primeras 5 filas):</h3>
              <table style={{ width: '100%', border: '1px solid #ccc', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} style={{ border: '1px solid #ccc', padding: '0.25rem' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{ border: '1px solid #ccc', padding: '0.25rem' }}>{val}</td> // ✅ val es string
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Cargando...' : 'Subir Clientes'}
          </button>
        </form>
      </div>
    </div>
  );
}
/**
 * Componente de Facturación SAT
 * 
 * Permite:
 * - Emitir facturas para reservas
 * - Ver estado de facturación
 * - Descargar PDFs
 * - Ver reportes de impuestos
 * 
 * Uso:
 * <SatFacturacion reservationId={123} onSuccess={() => alert('Factura emitida')} />
 */

import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SatFacturacion = ({ reservationId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /**
   * Obtiene el estado de facturación de una reserva
   */
  const obtenerEstadoFactura = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/sat/reservas/${parseInt(reservationId)}/factura-estado`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setEstado(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error obteniendo estado');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Emite una factura en SAT para la reserva
   */
  const emitirFactura = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post(
        `${API_URL}/sat/facturas/emitir/${reservationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSuccess('¡Factura emitida exitosamente!');
      setEstado({
        facturada: true,
        sat_uuid: response.data.uuid,
        numero_factura: response.data.numeroFactura,
        monto_iva: response.data.montoIva,
        total: response.data.total,
        pdf_url: response.data.pdfUrl,
      });
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error emitiendo factura');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descarga el PDF de la factura
   */
  const descargarPDF = async () => {
    if (!estado?.pdf_url) {
      setError('No hay URL de PDF disponible');
      return;
    }
    
    setLoading(true);
    try {
      const filename = estado.pdf_url.split('/').pop();
      const response = await axios.get(
        `${API_URL}/sat/pdf/${filename}`,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${estado.numero_factura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Error descargando PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sat-facturacion-container">
      <style>{`
        .sat-facturacion-container {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
          margin: 20px 0;
        }

        .sat-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }

        .sat-estado {
          background-color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 4px solid #4CAF50;
        }

        .sat-estado.no-facturada {
          border-left-color: #ff9800;
        }

        .sat-estado-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 0.95em;
        }

        .sat-estado-label {
          font-weight: 600;
          color: #555;
          min-width: 150px;
        }

        .sat-estado-valor {
          color: #333;
          word-break: break-word;
        }

        .sat-acciones {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .btn-sat {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 0.95em;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .btn-emitir {
          background-color: #4CAF50;
          color: white;
        }

        .btn-emitir:hover:not(:disabled) {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-descargar {
          background-color: #2196F3;
          color: white;
        }

        .btn-descargar:hover:not(:disabled) {
          background-color: #0b7dda;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-consultar {
          background-color: #FF9800;
          color: white;
        }

        .btn-consultar:hover:not(:disabled) {
          background-color: #e68900;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-sat:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 0.95em;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }

        .alert-success {
          background-color: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
        }

        .loading {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loader::after {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          background-color: currentColor;
          border-radius: 50%;
          margin-left: 4px;
          animation: blink 1.4s infinite;
        }

        @keyframes blink {
          0%, 20%, 50%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.85em;
          font-weight: 600;
          margin-left: 10px;
        }

        .badge-success {
          background-color: #c8e6c9;
          color: #2e7d32;
        }

        .badge-warning {
          background-color: #ffe0b2;
          color: #e65100;
        }

        .divider {
          height: 1px;
          background-color: #ddd;
          margin: 15px 0;
        }
      `}</style>

      <div className="sat-title">
        📋 Facturación SAT
      </div>

      {/* Alertas */}
      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Estado actual */}
      {estado ? (
        <div className={`sat-estado ${estado.facturada ? '' : 'no-facturada'}`}>
          <div className="sat-estado-row">
            <span className="sat-estado-label">Estado:</span>
            <span className="sat-estado-valor">
              {estado.facturada ? (
                <span>
                  Facturada
                  <span className="badge badge-success">✓</span>
                </span>
              ) : (
                <span>
                  Sin facturar
                  <span className="badge badge-warning">⚠</span>
                </span>
              )}
            </span>
          </div>

          {estado.facturada && (
            <>
              <div className="sat-estado-row">
                <span className="sat-estado-label">Número de Factura:</span>
                <span className="sat-estado-valor">{estado.numero_factura}</span>
              </div>
              <div className="sat-estado-row">
                <span className="sat-estado-label">UUID SAT:</span>
                <span className="sat-estado-valor" style={{ fontSize: '0.85em' }}>
                  {estado.sat_uuid?.substring(0, 20)}...
                </span>
              </div>
              <div className="sat-estado-row">
                <span className="sat-estado-label">IVA (15%):</span>
                <span className="sat-estado-valor">
                  Q {estado.monto_iva?.toFixed(2)}
                </span>
              </div>
              <div className="sat-estado-row">
                <span className="sat-estado-label">Total con IVA:</span>
                <span className="sat-estado-valor" style={{ fontWeight: 'bold' }}>
                  Q {estado.total?.toFixed(2)}
                </span>
              </div>
              <div className="sat-estado-row">
                <span className="sat-estado-label">Emitida en:</span>
                <span className="sat-estado-valor">
                  {estado.emitida_en
                    ? new Date(estado.emitida_en).toLocaleString()
                    : 'No disponible'}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="sat-estado no-facturada">
          <p>Carga el estado de facturación para ver los detalles</p>
        </div>
      )}

      <div className="divider"></div>

      {/* Acciones */}
      <div className="sat-acciones">
        <button
          className="btn-sat btn-consultar"
          onClick={obtenerEstadoFactura}
          disabled={loading}
        >
          {loading ? <span className="loader">Cargando</span> : '🔍 Consultar Estado'}
        </button>

        {!estado?.facturada && (
          <button
            className="btn-sat btn-emitir"
            onClick={emitirFactura}
            disabled={loading}
          >
            {loading ? <span className="loader">Emitiendo</span> : '📤 Emitir Factura'}
          </button>
        )}

        {estado?.facturada && (
          <button
            className="btn-sat btn-descargar"
            onClick={descargarPDF}
            disabled={loading || !estado?.pdf_url}
          >
            {loading ? <span className="loader">Descargando</span> : '📥 Descargar PDF'}
          </button>
        )}
      </div>

      {/* Info adicional */}
      <div className="divider"></div>
      <div style={{ fontSize: '0.85em', color: '#666' }}>
        <p>
          <strong>📌 Información:</strong><br/>
          • Las facturas se emiten automáticamente en el Sistema SAT<br/>
          • El IVA se calcula automáticamente (15% para hoteles)<br/>
          • El PDF está firmado digitalmente por SAT<br/>
          • Puedes descargar el PDF en cualquier momento
        </p>
      </div>
    </div>
  );
};

export default SatFacturacion;

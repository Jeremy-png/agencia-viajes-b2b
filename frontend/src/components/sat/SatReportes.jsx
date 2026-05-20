/**
 * Componente de Reportes de Impuestos SAT
 * 
 * Permite:
 * - Ver impuestos pagados en un período
 * - Exportar reportes
 * - Gráficos de impuestos
 * 
 * Uso:
 * <SatReportes />
 */

import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SatReportes = () => {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene el reporte de impuestos para el período
   */
  const obtenerReporte = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/sat/reportes/periodo`,
        {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setReporte(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error obteniendo reporte');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exporta el reporte a CSV
   */
  const exportarCSV = () => {
    if (!reporte?.facturas) return;

    const headers = [
      'Fecha',
      'Número Factura',
      'Cliente',
      'Tipo Servicio',
      'Subtotal',
      'IVA',
      'Total',
    ];

    const rows = reporte.facturas.map((f) => [
      new Date(f.fechaEmision).toLocaleDateString(),
      f.numeroFactura,
      f.nombreCliente,
      f.tipoServicio,
      f.subtotal.toFixed(2),
      f.montoIva.toFixed(2),
      f.total.toFixed(2),
    ]);

    const csv =
      [headers, ...rows]
        .map((row) => row.map((val) => `"${val}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `reporte-impuestos-${fechaInicio}-${fechaFin}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  };

  /**
   * Exporta el reporte a JSON
   */
  const exportarJSON = () => {
    if (!reporte) return;

    const json = JSON.stringify(reporte, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `reporte-impuestos-${fechaInicio}-${fechaFin}.json`
    );
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  };

  return (
    <div className="sat-reportes-container">
      <style>{`
        .sat-reportes-container {
          padding: 20px;
          background-color: #f5f5f5;
        }

        .sat-reportes-title {
          font-size: 1.8em;
          font-weight: bold;
          margin-bottom: 20px;
          color: #333;
        }

        .filtros-section {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .filtros-row {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .filtro-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filtro-label {
          font-weight: 600;
          color: #555;
          font-size: 0.95em;
        }

        .filtro-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95em;
        }

        .btn-obtener {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-obtener:hover:not(:disabled) {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-obtener:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reporte-section {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .reporte-resumenes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .resumen-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .resumen-card.impuestos {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .resumen-card.ventas {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .resumen-card.porcentaje {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .resumen-label {
          font-size: 0.9em;
          opacity: 0.9;
          margin-bottom: 8px;
        }

        .resumen-valor {
          font-size: 1.8em;
          font-weight: bold;
        }

        .tabla-section {
          margin-top: 25px;
        }

        .tabla-titulo {
          font-size: 1.2em;
          font-weight: 600;
          margin-bottom: 15px;
          color: #333;
        }

        .tabla-responsive {
          overflow-x: auto;
        }

        .tabla-facturas {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95em;
        }

        .tabla-facturas thead {
          background-color: #f5f5f5;
        }

        .tabla-facturas th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #ddd;
        }

        .tabla-facturas td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .tabla-facturas tbody tr:hover {
          background-color: #f9f9f9;
        }

        .valor-moneda {
          font-weight: 600;
          color: #2e7d32;
        }

        .acciones-reporte {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn-exportar {
          padding: 10px 18px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.95em;
        }

        .btn-exportar:hover {
          background-color: #0b7dda;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .alert {
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .alert-error {
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }

        .alert-info {
          background-color: #e3f2fd;
          color: #1976d2;
          border-left: 4px solid #1976d2;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .empty-state-icon {
          font-size: 3em;
          margin-bottom: 10px;
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
      `}</style>

      <div className="sat-reportes-title">📊 Reporte de Impuestos SAT</div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Desde:</label>
            <input
              type="date"
              className="filtro-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Hasta:</label>
            <input
              type="date"
              className="filtro-input"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <button
            className="btn-obtener"
            onClick={obtenerReporte}
            disabled={loading}
          >
            {loading ? <span className="loader">Cargando</span> : '🔍 Obtener Reporte'}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && <div className="alert alert-error">❌ {error}</div>}

      {/* Reporte */}
      {reporte && (
        <div className="reporte-section">
          {/* Resúmenes */}
          <div className="reporte-resumenes">
            <div className="resumen-card">
              <div className="resumen-label">Total de Facturas</div>
              <div className="resumen-valor">
                {reporte.cantidad_facturas}
              </div>
            </div>
            <div className="resumen-card impuestos">
              <div className="resumen-label">Total Impuestos</div>
              <div className="resumen-valor">
                Q {reporte.total_impuestos.toFixed(2)}
              </div>
            </div>
            <div className="resumen-card ventas">
              <div className="resumen-label">Total Ventas</div>
              <div className="resumen-valor">
                Q {reporte.total_ventas.toFixed(2)}
              </div>
            </div>
            <div className="resumen-card porcentaje">
              <div className="resumen-label">% Promedio</div>
              <div className="resumen-valor">
                {reporte.porcentaje_impuesto_promedio.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Tabla de facturas */}
          {reporte.cantidad_facturas > 0 ? (
            <div className="tabla-section">
              <div className="tabla-titulo">Detalles de Facturas</div>
              <div className="tabla-responsive">
                <table className="tabla-facturas">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Número Factura</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'right' }}>IVA</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.facturas.map((factura) => (
                      <tr key={factura.uuid}>
                        <td>
                          {new Date(factura.fechaEmision).toLocaleDateString()}
                        </td>
                        <td>{factura.numeroFactura}</td>
                        <td>{factura.nombreCliente}</td>
                        <td>{factura.tipoServicio}</td>
                        <td style={{ textAlign: 'right' }}>
                          Q {factura.subtotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }} className="valor-moneda">
                          Q {factura.montoIva.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          Q {factura.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botones de exportación */}
              <div className="acciones-reporte">
                <button className="btn-exportar" onClick={exportarCSV}>
                  📥 Exportar a CSV
                </button>
                <button className="btn-exportar" onClick={exportarJSON}>
                  📥 Exportar a JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>No hay facturas en este período</p>
            </div>
          )}
        </div>
      )}

      {!reporte && !loading && !error && (
        <div className="reporte-section">
          <div className="alert alert-info">
            👆 Selecciona un período y haz clic en "Obtener Reporte" para ver
            los impuestos pagados
          </div>
        </div>
      )}
    </div>
  );
};

export default SatReportes;

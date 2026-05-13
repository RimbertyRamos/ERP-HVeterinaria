import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { FichaAtencion, RegistroSOAP, ConsumoConsulta, LaboratorioOrden, CatalogoExamen, Producto } from '../types';
import './Consultation.scss';

interface TabState {
  soap?: Partial<RegistroSOAP>;
  consumos: ConsumoConsulta[];
  ordenes: LaboratorioOrden[];
  recetaIndicaciones?: string;
}

const Consultation: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rol = user?.rol?.nombre;

  const [fichas, setFichas] = useState<FichaAtencion[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<FichaAtencion | null>(null);
  const [tabs, setTabs] = useState<TabState>({
    consumos: [],
    ordenes: [],
  });
  const [activeTab, setActiveTab] = useState<'soap' | 'consumos' | 'laboratorio' | 'receta'>('soap');
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [examenes, setExamenes] = useState<CatalogoExamen[]>([]);
  const [historialFichas, setHistorialFichas] = useState<FichaAtencion[]>([]);

  const isVeterinario = rol === 'VETERINARIO';
  const isLaboratorista = rol === 'LABORATORISTA';

  useEffect(() => {
    loadFichas();
    if (isVeterinario) {
      api.getProductos().then(p => setProductos(p.filter(x => ['INSUMO_MEDICO', 'VACUNA'].includes(x.categoria?.tipo_item))));
      api.getExamenes().then(setExamenes);
    }
  }, []);

  const loadFichas = async () => {
    try {
      setLoading(true);
      const result = await api.getFichas({ estado: 'EN_CURSO' });
      const filtered = isVeterinario ? result.filter((f: FichaAtencion) => f.doctor?.id === user.id) : result;
      setFichas(filtered);
    } catch (e: any) {
      console.error('Error cargando fichas:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectFicha = async (ficha: FichaAtencion) => {
    setSelectedFicha(ficha);
    setTabs({ consumos: ficha.consumos || [], ordenes: ficha.ordenes_lab || [] });
    if (isVeterinario && ficha.id) {
      try {
        const [soapResult, consumosResult] = await Promise.allSettled([
          api.getSoap(ficha.id),
          api.getConsumos(ficha.id),
        ]);

        const soap =
          soapResult.status === 'fulfilled' ? soapResult.value : undefined;
        const consumos =
          consumosResult.status === 'fulfilled' ? consumosResult.value : [];

        setTabs(prev => ({ ...prev, soap, consumos }));
        const prev3 = await api.getFichas({ estado: 'COMPLETADA' });
        setHistorialFichas(prev3.filter((f: any) => f.mascota_id === ficha.mascota.id).slice(0, 3));
      } catch (e) {
        console.error('Error cargando detalles:', e);
      }
    }
  };

  const saveSoap = async () => {
    if (!selectedFicha?.id || !tabs.soap) return;
    try {
      await api.upsertSoap(selectedFicha.id, tabs.soap);
      alert('SOAP guardado');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const addConsumo = async (producto: Producto) => {
    if (!selectedFicha?.id) return;
    try {
      const consumo = await api.addConsumo(selectedFicha.id, { producto_id: producto.id, cantidad: 1 });
      setTabs(prev => ({ ...prev, consumos: [...prev.consumos, consumo] }));
      setProductSearch('');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const removeConsumo = async (consumoId: string) => {
    if (!selectedFicha?.id) return;
    try {
      await api.removeConsumo(selectedFicha.id, consumoId);
      setTabs(prev => ({ ...prev, consumos: prev.consumos.filter(c => c.id !== consumoId) }));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const addOrden = async (examenId: string) => {
    if (!selectedFicha?.id) return;
    try {
      const orden = await api.createOrden({ ficha_id: selectedFicha.id, examen_id: examenId, prioridad: 'NORMAL' });
      setTabs(prev => ({ ...prev, ordenes: [...prev.ordenes, orden] }));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const saveReceta = async () => {
    if (!selectedFicha?.id || !tabs.recetaIndicaciones) return;
    try {
      await api.createReceta(selectedFicha.id, { indicaciones: tabs.recetaIndicaciones });
      alert('Receta guardada');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const printReceta = () => {
    if (!selectedFicha) return;
    const receta = selectedFicha.soap?.receta;
    const indicaciones = tabs.recetaIndicaciones || receta?.indicaciones || '';
    const detalles = receta?.detalles ?? [];

    const lineas = detalles
      .map((d) => `<tr><td>${d.producto.nombre}</td><td style="text-align:right;">${d.cantidad}</td><td>${d.instrucciones ?? '-'}</td></tr>`)
      .join('');

    const html = `
      <html><head><title>Receta ${selectedFicha.cod_ficha}</title>
      <style>body{font-family:Arial;padding:16px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #ddd;padding:8px;font-size:12px}h2,h3,p{margin:0 0 8px 0}</style>
      </head><body>
      <h2>Receta Medica Veterinaria</h2>
      <p><strong>Ficha:</strong> ${selectedFicha.cod_ficha}</p>
      <p><strong>Paciente:</strong> ${selectedFicha.mascota.nombre}</p>
      <p><strong>Propietario:</strong> ${selectedFicha.mascota.propietario.nombre}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
      <h3>Indicaciones</h3>
      <p>${indicaciones || 'Sin indicaciones registradas'}</p>
      <table><thead><tr><th>Medicamento</th><th>Cantidad</th><th>Instrucciones</th></tr></thead><tbody>${lineas || '<tr><td colspan="3">Sin medicamentos</td></tr>'}</tbody></table>
      </body></html>`;

    const w = window.open('', '_blank', 'width=800,height=700');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const completarConsulta = async () => {
    if (!selectedFicha?.id) return;
    try {
      await api.completarFicha(selectedFicha.id);
      alert('Consulta completada');
      await loadFichas();
      setSelectedFicha(null);
      setTabs({ consumos: [], ordenes: [] });
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const updateOrdenEstado = async (ordenId: string, estado: LaboratorioOrden['estado']) => {
    try {
      await api.updateEstadoOrden(ordenId, estado);
      setTabs(prev => ({
        ...prev,
        ordenes: prev.ordenes.map(o => o.id === ordenId ? { ...o, estado } : o),
      }));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const cargarResultado = async (ordenId: string) => {
    const hallazgos = prompt('Ingrese hallazgos:');
    if (!hallazgos) return;
    try {
      const resultado = (await api.cargarResultado(ordenId, { hallazgos, observaciones: '' })) as LaboratorioOrden['resultado'];
      setTabs(prev => ({
        ...prev,
        ordenes: prev.ordenes.map(o => o.id === ordenId ? { ...o, estado: 'FINALIZADO', resultado } : o),
      }));
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  if (!isVeterinario && !isLaboratorista) return <div>No tiene acceso a esta vista</div>;

  return (
    <div className="consultation">
      <div className="fichas-list">
        <h3>Consultas en curso</h3>
        {loading ? <p>Cargando...</p> : fichas.length === 0 ? <p>No hay consultas</p> : (
          <div className="fichas-grid">
            {fichas.map(f => (
              <div
                key={f.id}
                className={`ficha-card ${selectedFicha?.id === f.id ? 'active' : ''}`}
                onClick={() => selectFicha(f)}
              >
                <div className="mascota-name">{f.mascota.nombre}</div>
                <div className="propietario">Dueño: {f.mascota.propietario.nombre}</div>
                <div className="estado">Estado: {f.estado}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFicha && isVeterinario && (
        <div className="consultation-panel">
          <div className="left-panel">
            <div className="patient-info">
              <h4>Datos del Paciente</h4>
              <p><strong>Mascota:</strong> {selectedFicha.mascota.nombre}</p>
              <p><strong>Especie:</strong> {selectedFicha.mascota.especie.nombre}</p>
              {selectedFicha.mascota.raza && <p><strong>Raza:</strong> {selectedFicha.mascota.raza.nombre}</p>}
              <p><strong>Sexo:</strong> {selectedFicha.mascota.sexo}</p>
              {selectedFicha.mascota.alergias.length > 0 && (
                <p><strong>Alergias:</strong> {selectedFicha.mascota.alergias.map(a => a.alergia.nombre).join(', ')}</p>
              )}
            </div>

            <div className="clinical-history">
              <h4>Historial Clínico (últimas 3 fichas)</h4>
              {historialFichas.length === 0 ? <p>Sin historial previo</p> : (
                historialFichas.map(f => (
                  <div key={f.id} className="history-item">
                    <p>{new Date(f.fecha_hora).toLocaleDateString()} - {f.servicio.nombre}</p>
                    {f.soap?.diagnostico && <p className="diag">Diag: {f.soap.diagnostico}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-panel">
            <div className="tabs">
              <button className={`tab ${activeTab === 'soap' ? 'active' : ''}`} onClick={() => setActiveTab('soap')}>SOAP</button>
              <button className={`tab ${activeTab === 'consumos' ? 'active' : ''}`} onClick={() => setActiveTab('consumos')}>Insumos</button>
              <button className={`tab ${activeTab === 'laboratorio' ? 'active' : ''}`} onClick={() => setActiveTab('laboratorio')}>Laboratorio</button>
              <button className={`tab ${activeTab === 'receta' ? 'active' : ''}`} onClick={() => setActiveTab('receta')}>Receta</button>
            </div>

            <div className="tab-content">
              {activeTab === 'soap' && (
                <div className="soap-form">
                  <input type="number" placeholder="Peso (kg)" value={tabs.soap?.peso || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, peso: e.target.valueAsNumber } }))} />
                  <input type="number" placeholder="Temperatura (°C)" value={tabs.soap?.temperatura || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, temperatura: e.target.valueAsNumber } }))} />
                  <input type="number" placeholder="FC (bpm)" value={tabs.soap?.fc || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, fc: e.target.valueAsNumber } }))} />
                  <input type="number" placeholder="FR (rpm)" value={tabs.soap?.fr || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, fr: e.target.valueAsNumber } }))} />
                  <textarea placeholder="Diagnóstico" value={tabs.soap?.diagnostico || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, diagnostico: e.target.value } }))} />
                  <textarea placeholder="Tratamiento" value={tabs.soap?.tratamiento || ''} onChange={e => setTabs(p => ({ ...p, soap: { ...p.soap, tratamiento: e.target.value } }))} />
                  <button onClick={saveSoap}>Guardar SOAP</button>
                </div>
              )}

              {activeTab === 'consumos' && (
                <div className="consumos-form">
                  <div className="search-box">
                    <input type="text" placeholder="Buscar insumo..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    {productSearch && (
                      <div className="search-results">
                        {productos
                          .filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                            <div key={p.id} className="search-result" onClick={() => addConsumo(p)}>
                              {p.nombre} ({p.stock_actual} en stock)
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="consumos-list">
                    {tabs.consumos.map(c => (
                      <div key={c.id} className="consumo-item">
                        <span>{c.producto.nombre} x{c.cantidad}</span>
                        <button onClick={() => removeConsumo(c.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'laboratorio' && (
                <div className="lab-form">
                  <div className="examen-selector">
                    <select onChange={e => e.target.value && addOrden(e.target.value)}>
                      <option value="">Solicitar examen...</option>
                      {examenes.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ordenes-list">
                    {tabs.ordenes.map(o => (
                      <div key={o.id} className="orden-item">
                        <div>{o.examen.nombre} - {o.estado}</div>
                        {o.estado === 'SOLICITADO' && <button onClick={() => updateOrdenEstado(o.id, 'EN_PROCESO')}>Iniciar</button>}
                        {o.estado === 'EN_PROCESO' && <button onClick={() => cargarResultado(o.id)}>Cargar Resultado</button>}
                        {o.resultado?.hallazgos && <p className="hallazgos">{o.resultado.hallazgos}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'receta' && (
                <div className="receta-form">
                  <textarea placeholder="Indicaciones..." value={tabs.recetaIndicaciones || ''} onChange={e => setTabs(p => ({ ...p, recetaIndicaciones: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveReceta}>Guardar Receta</button>
                    <button onClick={printReceta}>Imprimir Receta</button>
                  </div>
                  {selectedFicha.soap?.receta?.detalles && (
                    <div className="receta-detalles">
                      {selectedFicha.soap.receta.detalles.map((d, i) => (
                        <div key={i}>{d.producto.nombre} - {d.cantidad} {d.instrucciones}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="btn-complete" onClick={completarConsulta}>Completar Consulta</button>
          </div>
        </div>
      )}

      {isLaboratorista && (
        <div className="lab-view">
          <h3>Órdenes de Laboratorio</h3>
          <div className="ordenes-cards">
            {fichas.flatMap(f => (f.ordenes_lab || []).map(o => (
              <div key={o.id} className="orden-card">
                <div className="card-header">
                  <div className="paciente">{f.mascota.nombre}</div>
                  <div className="propietario">{f.mascota.propietario.nombre}</div>
                </div>
                <div className="card-body">
                  <p><strong>Examen:</strong> {o.examen.nombre}</p>
                  <p><strong>Estado:</strong> {o.estado}</p>
                  <p><strong>Prioridad:</strong> {o.prioridad}</p>
                </div>
                <div className="card-actions">
                  {o.estado === 'SOLICITADO' && <button onClick={() => updateOrdenEstado(o.id, 'EN_PROCESO')}>Iniciar</button>}
                  {o.estado === 'EN_PROCESO' && <button onClick={() => cargarResultado(o.id)}>Cargar Resultado</button>}
                </div>
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;

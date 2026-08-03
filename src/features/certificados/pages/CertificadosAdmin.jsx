import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarDiplomados } from '../../diplomados/api'
import { listarPlantillas, crearPlantilla, subirImagenPlantilla, listarCertificados, listarEstudiantesCertificables, emitirCertificado } from '../api'

const TABS = [
  { key: 'emitir', label: 'Emitir certificados' },
  { key: 'plantillas', label: 'Plantillas' },
]

export default function CertificadosAdmin() {
  const [tab, setTab] = useState('emitir')

  return (
    <div>
      <PageHeader title="Certificados" subtitle="Plantillas, emisión y verificación por código QR." />
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'emitir' && <EmitirTab />}
      {tab === 'plantillas' && <PlantillasTab />}
    </div>
  )
}

function EmitirTab() {
  const [diplomados, setDiplomados] = useState(null)
  const [plantillas, setPlantillas] = useState([])
  const [diplomadoId, setDiplomadoId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [estudiantes, setEstudiantes] = useState(null)
  const [emitidos, setEmitidos] = useState([])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    listarDiplomados().then(setDiplomados)
    listarPlantillas().then(setPlantillas)
  }, [])

  async function cargarEstudiantes(id) {
    setDiplomadoId(id)
    if (!id) return setEstudiantes(null)
    const [est, certs] = await Promise.all([listarEstudiantesCertificables(id), listarCertificados()])
    setEstudiantes(est)
    setEmitidos(certs.filter((c) => c.diplomado_id === id).map((c) => c.estudiante_id))
  }

  async function handleEmitir(estudianteId) {
    setMensaje('')
    try {
      await emitirCertificado(estudianteId, diplomadoId, plantillaId || null)
      setEmitidos((e) => [...e, estudianteId])
      setMensaje('Certificado emitido correctamente.')
    } catch (err) {
      setMensaje(err.message)
    }
  }

  if (diplomados === null) return <Spinner />

  return (
    <div>
      <div className="card mb-4 flex flex-wrap items-end gap-3 !p-4">
        <div className="min-w-[200px]">
          <label className="label">Diplomado</label>
          <select className="input" value={diplomadoId} onChange={(e) => cargarEstudiantes(e.target.value)}>
            <option value="">Selecciona un diplomado</option>
            {diplomados.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="label">Plantilla</label>
          <select className="input" value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
            <option value="">Predeterminada</option>
            {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      </div>

      {mensaje && <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm font-medium text-brand">{mensaje}</p>}

      {!diplomadoId ? (
        <EmptyState icon="award" title="Selecciona un diplomado para ver a sus estudiantes" />
      ) : estudiantes.length === 0 ? (
        <EmptyState icon="users" title="Este diplomado no tiene estudiantes matriculados" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Estudiante</th><th></th></tr></thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium text-ink">{e.nombre_completo}</td>
                  <td>
                    {emitidos.includes(e.id) ? (
                      <span className="text-sm font-medium text-success-700">Certificado emitido</span>
                    ) : (
                      <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => handleEmitir(e.id)}>
                        <Icon name="award" className="h-4 w-4" /> Emitir certificado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PlantillasTab() {
  const { profile } = useAuth()
  const [plantillas, setPlantillas] = useState(null)
  const [form, setForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [textoPlantilla, setTextoPlantilla] = useState('Otorga el presente certificado a {{nombre_estudiante}} por haber completado satisfactoriamente el diplomado de {{nombre_diplomado}}.')
  const [logo, setLogo] = useState(null)
  const [firma1Nombre, setFirma1Nombre] = useState('')
  const [firma1Cargo, setFirma1Cargo] = useState('')
  const [firma1Archivo, setFirma1Archivo] = useState(null)
  const [firma2Nombre, setFirma2Nombre] = useState('')
  const [firma2Cargo, setFirma2Cargo] = useState('')
  const [firma2Archivo, setFirma2Archivo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function cargar() {
    setPlantillas(await listarPlantillas())
  }

  useEffect(() => { cargar() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const logoUrl = logo ? await subirImagenPlantilla(profile.institucion_id, logo) : null
    const firma1Url = firma1Archivo ? await subirImagenPlantilla(profile.institucion_id, firma1Archivo) : null
    const firma2Url = firma2Archivo ? await subirImagenPlantilla(profile.institucion_id, firma2Archivo) : null
    await crearPlantilla({
      institucion_id: profile.institucion_id, nombre, texto_plantilla: textoPlantilla,
      logo_url: logoUrl, firma1_nombre: firma1Nombre || null, firma1_cargo: firma1Cargo || null, firma1_url: firma1Url,
      firma2_nombre: firma2Nombre || null, firma2_cargo: firma2Cargo || null, firma2_url: firma2Url,
    })
    setForm(false)
    setBusy(false)
    cargar()
  }

  if (plantillas === null) return <Spinner />

  return (
    <div>
      <div className="card mb-4 !p-4">
        {!form ? (
          <button className="btn-secondary" onClick={() => setForm(true)}><Icon name="plus" className="h-4 w-4" /> Nueva plantilla</button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="label">Nombre de la plantilla</label>
              <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="label">Texto (usa {'{{nombre_estudiante}}'} y {'{{nombre_diplomado}}'})</label>
              <textarea className="input" rows={3} value={textoPlantilla} onChange={(e) => setTextoPlantilla(e.target.value)} />
            </div>
            <div>
              <label className="label">Logo</label>
              <input type="file" accept="image/*" className="input" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="label !mb-0">Firma 1</label>
                <input className="input" placeholder="Nombre" value={firma1Nombre} onChange={(e) => setFirma1Nombre(e.target.value)} />
                <input className="input" placeholder="Cargo" value={firma1Cargo} onChange={(e) => setFirma1Cargo(e.target.value)} />
                <input type="file" accept="image/*" className="input" onChange={(e) => setFirma1Archivo(e.target.files?.[0] || null)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label !mb-0">Firma 2</label>
                <input className="input" placeholder="Nombre" value={firma2Nombre} onChange={(e) => setFirma2Nombre(e.target.value)} />
                <input className="input" placeholder="Cargo" value={firma2Cargo} onChange={(e) => setFirma2Cargo(e.target.value)} />
                <input type="file" accept="image/*" className="input" onChange={(e) => setFirma2Archivo(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={busy} className="btn-primary">{busy ? 'Guardando…' : 'Crear plantilla'}</button>
              <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {plantillas.length === 0 ? (
        <EmptyState icon="award" title="Sin plantillas todavía" description="Se usará el formato predeterminado mientras no crees una." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plantillas.map((p) => (
            <div key={p.id} className="card">
              <p className="font-medium text-ink">{p.nombre}</p>
              <p className="mt-1 text-sm text-ink-soft">{p.texto_plantilla}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

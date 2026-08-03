import { useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import ConceptosTab from '../components/ConceptosTab'
import PagosTab from '../components/PagosTab'
import OfrendasTab from '../components/OfrendasTab'

const TABS = [
  { key: 'pagos', label: 'Pagos' },
  { key: 'conceptos', label: 'Conceptos de pago' },
  { key: 'ofrendas', label: 'Ofrendas' },
]

export default function FinancieroAdmin() {
  const [tab, setTab] = useState('pagos')

  return (
    <div>
      <PageHeader title="Financiero" subtitle="Matrículas, pagos por módulo, ofrendas y aprobaciones." />

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pagos' && <PagosTab />}
      {tab === 'conceptos' && <ConceptosTab />}
      {tab === 'ofrendas' && <OfrendasTab />}
    </div>
  )
}

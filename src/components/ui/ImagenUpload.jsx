import { useRef, useState } from 'react'
import Icon from './Icon'
import { subirArchivo, urlPublica, slugArchivo } from '../../lib/storage'

const TIPOS_ACEPTADOS = 'image/png,image/jpeg,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

// Selector + previsualización + subida de una imagen a un bucket público. Lo comparten la
// agenda de eventos y los devocionales; si en el futuro lo necesita otra pantalla, se le pasa
// otro bucket y ya. Sube al elegir el archivo (no al guardar el formulario) para que la
// previsualización sea la imagen real y no un objectURL que después podría no coincidir.
export default function ImagenUpload({ bucket, institucionId, valor, onChange, etiqueta = 'Imagen' }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function handleArchivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (!TIPOS_ACEPTADOS.split(',').includes(file.type)) {
      setError('Formato no admitido. Usa PNG, JPG, WEBP o GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen supera los 5 MB. Comprímela e inténtalo de nuevo.')
      return
    }

    setSubiendo(true)
    try {
      const path = `${institucionId}/${slugArchivo(file.name)}`
      await subirArchivo(bucket, path, file)
      onChange(urlPublica(bucket, path))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
      // Permite volver a elegir el mismo archivo si hubo un error y se reintenta.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="label">{etiqueta}</label>

      {valor ? (
        <div className="relative overflow-hidden rounded-md border border-slate-200">
          <img src={valor} alt="" className="block max-h-56 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-md bg-ink/70 px-2 py-1 text-xs font-medium text-white hover:bg-ink"
          >
            Quitar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-ink-soft transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          <Icon name="upload" className="h-5 w-5" />
          {subiendo ? 'Subiendo…' : 'Elegir imagen'}
          <span className="text-xs text-ink-faint">PNG, JPG, WEBP o GIF · hasta 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_ACEPTADOS}
        className="hidden"
        onChange={handleArchivo}
      />

      {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  )
}

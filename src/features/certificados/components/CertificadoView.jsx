import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

function interpolar(texto, valores) {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, clave) => valores[clave] || '')
}

export default function CertificadoView({ certificado }) {
  const [qr, setQr] = useState(null)
  const plantilla = certificado.plantilla

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}#/verificar/${certificado.codigo_verificacion}`
    QRCode.toDataURL(url, { margin: 1, width: 128 }).then(setQr)
  }, [certificado.codigo_verificacion])

  const texto = plantilla?.texto_plantilla
    ? interpolar(plantilla.texto_plantilla, {
        nombre_estudiante: certificado.estudiante?.nombre_completo,
        nombre_diplomado: certificado.diplomado?.nombre,
      })
    : `Otorga el presente certificado a ${certificado.estudiante?.nombre_completo} por haber completado satisfactoriamente el diplomado de ${certificado.diplomado?.nombre}.`

  return (
    <div className="mx-auto aspect-[1.414/1] w-full max-w-3xl border-8 border-brand bg-white p-10 text-center shadow-popover print:shadow-none">
      {plantilla?.logo_url && <img src={plantilla.logo_url} alt="Logo" className="mx-auto mb-4 h-16 object-contain" />}
      <p className="text-sm uppercase tracking-widest text-ink-faint">{certificado.institucion?.nombre}</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Certificado de finalización</h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-ink">{texto}</p>
      <p className="mt-6 text-sm text-ink-faint">Emitido el {certificado.fecha_emision}</p>

      <div className="mt-10 flex items-end justify-between px-8">
        <Firma nombre={plantilla?.firma1_nombre} cargo={plantilla?.firma1_cargo} url={plantilla?.firma1_url} />
        {qr && (
          <div className="flex flex-col items-center gap-1">
            <img src={qr} alt="Código QR de verificación" className="h-20 w-20" />
            <p className="text-[10px] text-ink-faint">Verificar autenticidad</p>
          </div>
        )}
        <Firma nombre={plantilla?.firma2_nombre} cargo={plantilla?.firma2_cargo} url={plantilla?.firma2_url} />
      </div>
    </div>
  )
}

function Firma({ nombre, cargo, url }) {
  if (!nombre) return <div className="w-32" />
  return (
    <div className="flex w-40 flex-col items-center">
      {url && <img src={url} alt="Firma" className="h-10 object-contain" />}
      <div className="mt-1 w-full border-t border-ink pt-1">
        <p className="text-sm font-medium text-ink">{nombre}</p>
        {cargo && <p className="text-xs text-ink-faint">{cargo}</p>}
      </div>
    </div>
  )
}

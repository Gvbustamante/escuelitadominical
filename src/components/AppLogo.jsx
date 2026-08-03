import { useAuth } from '../contexts/AuthContext'
import Icon from './ui/Icon'

export default function AppLogo({ institucion, className = 'h-8 w-8 object-contain rounded-md' }) {
  const { institucion: activa } = useAuth()
  const inst = institucion ?? activa

  if (inst?.logo_url) {
    return <img src={inst.logo_url} alt={inst?.nombre ? `Logo de ${inst.nombre}` : 'Logo del instituto'} className={className} />
  }
  return (
    <div className={`flex items-center justify-center rounded-md bg-brand text-white ${className}`}>
      <Icon name="book" className="h-1/2 w-1/2" />
    </div>
  )
}

const DEFAULT_PRIMARY = '#2952e3'
const DEFAULT_SECONDARY = '#0ea5a4'

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(value, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function mix(hexA, hexB, weightA) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const r = Math.round(a.r * weightA + b.r * (1 - weightA))
  const g = Math.round(a.g * weightA + b.g * (1 - weightA))
  const bl = Math.round(a.b * weightA + b.b * (1 - weightA))
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function applyBrand(institucion) {
  const root = document.documentElement
  const primary = institucion?.color_primario || DEFAULT_PRIMARY
  const secondary = institucion?.color_secundario || DEFAULT_SECONDARY

  root.style.setProperty('--brand-primary', primary)
  root.style.setProperty('--brand-secondary', secondary)
  root.style.setProperty('--brand-primary-50', mix(primary, '#ffffff', 0.08))
  root.style.setProperty('--brand-primary-100', mix(primary, '#ffffff', 0.16))
  root.style.setProperty('--brand-primary-600', mix(primary, '#000000', 0.88))
  root.style.setProperty('--brand-primary-700', mix(primary, '#000000', 0.76))
}

export function resetBrand() {
  applyBrand(null)
}

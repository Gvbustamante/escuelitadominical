import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '🎒', title: 'Clases y niveles', text: 'Organiza a los peques por edad, con su docente asignada.' },
  { icon: '✅', title: 'Asistencia', text: 'La docente marca presentes tocando la pantalla, en segundos.' },
  { icon: '🎨', title: 'Actividades', text: 'Fotos y lo que aprendieron, directo para los papás.' },
  { icon: '🌱', title: 'Progreso', text: 'Comportamiento, emociones y logros de cada niño/a.' },
  { icon: '🙏', title: 'Devocionales', text: 'Reflexiones pensadas para niños, con su versículo.' },
  { icon: '📖', title: 'Versículo del día', text: 'Una palabra distinta cada día, para toda la familia.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* HERO */}
      <header className="relative overflow-hidden bg-sky-400 px-6 pb-24 pt-16 text-center text-white">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sunshine-400/30" />
        <div className="relative mx-auto max-w-3xl">
          <span className="text-6xl">📖</span>
          <h1 className="mt-4 text-4xl uppercase tracking-tight sm:text-6xl">
            Access <span className="text-sunshine-300">Kids</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-white/90 sm:text-xl">
            Un espacio propicio para que los peques aprendan la Palabra de Dios —
            y todo el equipo de la escuelita, en orden y sin enredos.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="btn bg-white text-sky-600 shadow-[0_4px_0_0_theme(colors.sky.700)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_theme(colors.sky.700)] active:shadow-[0_1px_0_0_theme(colors.sky.700)]">
              Ingresar a mi cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="mx-auto mt-14 max-w-5xl px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-2 text-lg">{f.title}</h3>
              <p className="mt-1 text-ink/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORIA */}
      <section className="mx-auto mt-20 max-w-3xl px-6 text-center">
        <span className="badge bg-coral-100 text-coral-600">Nuestra historia</span>
        <h2 className="mt-3 text-3xl uppercase text-coral-500">Nació en el corazón</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          Access Kids nació de un deseo sencillo: que los niños de la iglesia tengan un espacio propio,
          ordenado y bonito para conocer a Dios — y que las docentes y los padres, sin necesitar ser expertos
          en tecnología, puedan acompañar ese proceso sin enredos ni papeles perdidos.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          Esta plataforma es un trabajo hecho con cariño y entregado como ofrenda al Señor, para servir en
          Sus asuntos: que la Palabra se imparta de una forma bonita, y que la estadía de cada niño/a en la
          iglesia sea más amena, cuidada y llena de amor.
        </p>
        <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-coral-500">
          — Gisella Bustamante, creadora de Access Kids
        </p>
      </section>

      {/* OFRENDA */}
      <section className="mx-auto mt-20 max-w-3xl px-6">
        <div className="card border-4 border-sunshine-300 bg-sunshine-50 text-center">
          <span className="text-4xl">💛</span>
          <h2 className="mt-2 text-2xl uppercase text-sunshine-700">¿Quieres bendecir este proyecto?</h2>
          <p className="mx-auto mt-3 max-w-lg text-ink/70">
            Access Kids se entrega como ofrenda, de corazón — no es un pago obligatorio. Si esta herramienta
            bendice a tu iglesia y deseas sembrar en este proyecto para que siga creciendo y llegando a más
            escuelitas, puedes hacerlo con la libertad que Dios ponga en tu corazón.
          </p>
          <div className="mx-auto mt-5 inline-flex flex-col items-center gap-1 rounded-chunky bg-white px-6 py-4 shadow-card">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink/40">Llave / Cuenta</span>
            <span className="text-2xl font-extrabold tracking-wide text-sunshine-700">1140869398</span>
            <span className="text-sm font-bold text-ink/60">Gisella Bustamante</span>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <footer className="mt-20 bg-ink px-6 py-14 text-center text-white">
        <h2 className="text-2xl uppercase">¿Listo/a para tu escuelita?</h2>
        <p className="mt-2 text-white/60">Entra con tu cuenta o pide que te inviten.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">
          Ingresar
        </Link>
        <p className="mt-8 text-xs text-white/30">Access Kids — hecho como ofrenda, para la gloria de Dios.</p>
      </footer>
    </div>
  )
}

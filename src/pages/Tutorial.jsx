import { useAuth } from '../contexts/AuthContext'

function Step({ number, icon, title, children, color = 'sky' }) {
  const bg = {
    sky: 'bg-sky-400',
    grass: 'bg-grass-400',
    sunshine: 'bg-sunshine-400',
    coral: 'bg-coral-400',
    grape: 'bg-grape-400',
  }[color]

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg} text-xl font-bold text-white shadow-pop`}>
          {number}
        </div>
        <div className="mt-2 w-0.5 flex-1 bg-ink/10 last:hidden" />
      </div>
      <div className="card mb-6 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="text-ink/60">{children}</div>
      </div>
    </div>
  )
}

function AdminGuide() {
  return (
    <>
      <Step number="1" icon="🎒" title="Crea tus clases" color="grass">
        Ve a <strong>Clases</strong> → <em>+ Nueva clase</em>. Ponle nombre y el rango de edad (ej. "Exploradores", 3 a 5 años).
        Puedes crear todas las que necesite tu escuelita.
      </Step>
      <Step number="2" icon="🍎" title="Invita a tus docentes" color="sunshine">
        Ve a <strong>Docentes</strong> → <em>+ Invitar</em>. Escribe su nombre y correo. Le va a llegar un correo para que cree
        su contraseña — tú no necesitas dársela.
      </Step>
      <Step number="3" icon="🔗" title="Asigna cada docente a su clase" color="sky">
        En <strong>Clases</strong>, edita una clase y marca qué docente(s) la llevan. Así ella solo verá su propia clase.
      </Step>
      <Step number="4" icon="🧒" title="Registra a los niños" color="coral">
        Ve a <strong>Niños</strong> → <em>+ Nuevo niño/a</em>. Escribe su nombre, fecha de nacimiento, clase y alergias si
        tiene. Desde aquí también puedes desactivar a un niño si ya no asiste, sin borrar su historial.
      </Step>
      <Step number="5" icon="👪" title="Invita a los padres" color="grape">
        En la tarjeta de cada niño, botón <em>+ Padre</em>. Escribe el correo del papá/mamá — queda vinculado
        automáticamente a ese niño apenas acepte la invitación.
      </Step>
      <Step number="6" icon="✅" title="Supervisa la asistencia" color="grass">
        En <strong>Asistencia</strong> puedes ver, por fecha y por clase, quién vino cada domingo — sin tener que
        preguntarle a cada docente.
      </Step>
    </>
  )
}

function DocenteGuide() {
  return (
    <>
      <Step number="1" icon="🏠" title="Revisa tus clases" color="sky">
        En el inicio ves las clases que el admin te asignó, con cuántos niños activos tiene cada una.
      </Step>
      <Step number="2" icon="✅" title="Toma la asistencia" color="grass">
        Ve a <strong>Asistencia</strong>, elige la clase y la fecha (por defecto es hoy). Toca a cada niño para marcarlo
        presente — se pone verde. Al final, toca <em>Guardar asistencia</em>.
      </Step>
      <Step number="3" icon="🎨" title="Publica una actividad" color="sunshine">
        Ve a <strong>Actividades</strong> → <em>+ Nueva actividad</em>. Ponle título, cuenta qué hicieron, y puedes subir
        varias fotos o archivos a la vez. Los padres la van a ver enseguida.
      </Step>
      <Step number="4" icon="📅" title="Agenda un evento" color="grape">
        Ve a <strong>Agenda</strong> → <em>+ Nuevo evento</em> para avisar de un paseo, presentación o actividad especial
        próxima.
      </Step>
    </>
  )
}

function PadreGuide() {
  return (
    <>
      <Step number="1" icon="📧" title="Acepta la invitación" color="sky">
        La escuelita te manda un correo de invitación. Ábrelo, crea tu contraseña y listo — ya tienes cuenta.
      </Step>
      <Step number="2" icon="🏠" title="Mira la información de tu hijo/a" color="grass">
        En el inicio ves su nombre, edad, clase y alergias registradas.
      </Step>
      <Step number="3" icon="🎨" title="Reacciona a sus actividades" color="coral">
        En <strong>Actividades</strong> ves fotos y lo que hicieron en clase. Toca un emoji (❤️ 👏 🙌 😍) para reaccionar.
      </Step>
      <Step number="4" icon="📅" title="Entérate de los próximos eventos" color="grape">
        En <strong>Agenda</strong> ves paseos, presentaciones y fechas importantes de la clase de tu hijo/a.
      </Step>
    </>
  )
}

const GUIDES = {
  admin: { title: 'Guía para Administrador', Guide: AdminGuide },
  coordinador: { title: 'Guía para Coordinador', Guide: AdminGuide },
  docente: { title: 'Guía para Docente', Guide: DocenteGuide },
  padre: { title: 'Guía para Padres', Guide: PadreGuide },
}

export default function Tutorial() {
  const { profile } = useAuth()
  const { title, Guide } = GUIDES[profile.role] || GUIDES.padre

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Tutorial 🎓</h1>
        <p className="text-ink/50">{title} — paso a paso</p>
      </div>

      <div className="max-w-2xl">
        <Guide />
      </div>

      <div className="card max-w-2xl bg-sky-50">
        <p className="font-bold">¿Tienes dudas?</p>
        <p className="text-ink/60">Pídele ayuda al administrador de tu escuelita, o vuelve a esta página cuando la necesites.</p>
      </div>
    </div>
  )
}

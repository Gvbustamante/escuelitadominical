
const supabaseUrl = 'https://czqkumizijgvplrenzvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cWt1bWl6aWpndnBscmVuenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MjA1OTAsImV4cCI6MjA2MTI5NjU5MH0.nZpjWm3bkMgVkimIB65Eu5-Czf6nZbLbP_VBCh8-Jd4';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Traer Clases Bíblicas
async function fetchClases() {
    let { data, error } = await supabase
        .from('clases_biblicas')
        .select('*')
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    const clasesList = document.getElementById('clases-list');
    data.forEach(clase => {
        const div = document.createElement('div');
        div.className = 'col-md-4';
        div.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${clase.titulo}</h5>
                    <p><strong>Versículo:</strong> ${clase.versiculo_clave}</p>
                    <p><strong>Grupo:</strong> ${clase.grupo_edad}</p>
                </div>
            </div>
        `;
        clasesList.appendChild(div);
    });
}

// Traer Notas del Mural
async function fetchMural() {
    let { data, error } = await supabase
        .from('mural_notas')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    const muralList = document.getElementById('mural-list');
    data.forEach(nota => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${nota.mensaje} — (${nota.autor})`;
        muralList.appendChild(li);
    });
}

fetchClases();
fetchMural();

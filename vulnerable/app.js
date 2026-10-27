// Las tres fallas son intencionales para la exposición local.
const { descargar } = require('../compartido/http');

function obtenerNota(notas, id, usuario) {
  const nota = notas[id];
  if (!nota) return { estado: 404, error: 'Nota inexistente' };
  // FALLA: estar autenticado no significa poder leer cualquier nota.
  return { estado: 200, nota };
}

function mostrarComentario(texto) {
  // FALLA: el navegador interpretará la entrada como HTML.
  return texto;
}

async function consultarRecurso(url, destinosPermitidos) {
  // FALLA: el usuario decide a qué servidor se conecta el backend.
  return descargar(url, { redirect: 'follow' });
}

module.exports = { obtenerNota, mostrarComentario, consultarRecurso };

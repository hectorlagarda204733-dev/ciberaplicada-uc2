const { descargar } = require('../compartido/http');
const { escaparHTML } = require('../compartido/html');

function obtenerNota(notas, id, usuario) {
  const nota = notas[id];
  if (!nota) return { estado: 404, error: 'Nota inexistente' };
  // La identidad viene de la sesión validada en el servidor.
  if (nota.propietario !== usuario) {
    return { estado: 403, error: 'Acceso denegado: esta nota pertenece a otro usuario.' };
  }
  return { estado: 200, nota };
}

function mostrarComentario(texto) {
  // Se inserta en contenido HTML, no en JS, CSS ni atributos.
  return escaparHTML(texto);
}

async function consultarRecurso(url, destinosPermitidos) {
  // Coincidencia EXACTA; no startsWith, includes ni expresión regular.
  // Los destinos de este laboratorio usan IP literal y ruta fija:
  // no hay una segunda resolución DNS ni cambios de host controlados por el usuario.
  if (!destinosPermitidos.has(url)) {
    const error = new Error('Destino bloqueado: solo se permite el catálogo configurado.');
    error.status = 403;
    throw error;
  }
  const destinoFijo = destinosPermitidos.get(url);
  return descargar(destinoFijo, { redirect: 'error' });
}

const CSP = "default-src 'none'; script-src 'none'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

module.exports = { obtenerNota, mostrarComentario, consultarRecurso, CSP };

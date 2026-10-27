async function descargar(direccion, { redirect }) {
  let url;
  try { url = new URL(direccion); }
  catch { throw Object.assign(new Error('URL inválida'), { status: 400 }); }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw Object.assign(new Error('Solo HTTP o HTTPS'), { status: 400 });
  }
  const respuesta = await fetch(url, {
    redirect,
    signal: AbortSignal.timeout(3000),
    headers: { Accept: 'text/plain, application/json' }
  });
  if (!respuesta.ok) throw new Error(`Servicio respondió HTTP ${respuesta.status}`);
  const partes = [];
  let bytes = 0;
  for await (const parte of respuesta.body) {
    bytes += parte.length;
    if (bytes > 65536) throw new Error('Respuesta demasiado grande');
    partes.push(Buffer.from(parte));
  }
  return Buffer.concat(partes).toString('utf8');
}
module.exports = { descargar };

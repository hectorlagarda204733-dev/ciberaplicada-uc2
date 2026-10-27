const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { escaparHTML: e, pagina, css } = require('./html');

const notas = Object.freeze({
  '1': { id: 1, propietario: 'ana', texto: 'Nota de Ana: preparar la exposición de Ciberseguridad.' },
  '2': { id: 2, propietario: 'bruno', texto: 'CONFIDENCIAL SIMULADO: presupuesto de Bruno = $7,500.' }
});
const PAYLOAD = '<img src=x onerror="alert(\'XSS de laboratorio\')">';

function crearAplicacion(modo, { publico, interno }) {
  const politica = require(`../${modo}/app`);
  const sesiones = new Map();
  const cookieNombre = `uc2_${modo}`;
  const catalogo = `${publico}/catalogo`;
  const secreto = `${interno}/secreto`;
  const permitidos = new Map([[catalogo, catalogo]]);

  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (politica.CSP) res.setHeader('Content-Security-Policy', politica.CSP);
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => {
      const i = c.indexOf('=');
      return i < 0 ? ['', ''] : [c.slice(0, i).trim(), c.slice(i + 1)];
    }));
    const sesion = sesiones.get(cookies[cookieNombre]);
    const usuario = sesion && sesion.expira > Date.now() ? sesion.usuario : null;
    const enviar = (estado, cuerpo, tipo = 'text/html; charset=utf-8') => {
      res.writeHead(estado, { 'Content-Type': tipo }); res.end(cuerpo);
    };
    const html = (estado, titulo, cuerpo) => enviar(estado, pagina(titulo, cuerpo, modo, usuario));

    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/estilos.css') return enviar(200, css, 'text/css; charset=utf-8');
      if (url.pathname === '/login' && req.method === 'POST') {
        let datos = '';
        for await (const fragmento of req) {
          datos += fragmento;
          if (datos.length > 4096) return html(413, 'Formulario demasiado grande', '');
        }
        const campos = new URLSearchParams(datos);
        const nombre = campos.get('usuario');
        if (!['ana', 'bruno'].includes(nombre) || campos.get('clave') !== 'demo123') {
          return html(401, 'Credenciales incorrectas', '<a href="/login">Intentar otra vez</a>');
        }
        sesiones.delete(cookies[cookieNombre]);
        const token = randomBytes(32).toString('hex');
        sesiones.set(token, { usuario: nombre, expira: Date.now() + 3600000 });
        // HTTP local: Secure se añadiría al desplegar bajo HTTPS.
        res.setHeader('Set-Cookie', `${cookieNombre}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);
        res.writeHead(303, { Location: '/' }); return res.end();
      }
      if (req.method !== 'GET') return html(405, 'Método no permitido', '');
      if (url.pathname === '/login') return html(200, 'Iniciar sesión', `
        <p>Cuentas ficticias: <b>ana</b> y <b>bruno</b>. Contraseña para ambas: <code>demo123</code>.</p>
        <form method="post" action="/login"><label>Usuario<input name="usuario" value="ana" required></label>
        <label>Contraseña<input type="password" name="clave" value="demo123" required></label><button>Entrar</button></form>`);
      if (url.pathname === '/') return html(200, 'Tres fallas, tres correcciones', `
        <div class="tarjeta"><h2>1. Broken Access Control · A01:2021</h2><p>Inicia sesión como Ana. Abre su nota y cambia el ID a 2.</p><a href="/login">Iniciar sesión</a> · <a href="/notas/1">Nota 1</a> · <a href="/notas/2">Nota 2</a></div>
        <div class="tarjeta"><h2>2. XSS + CSP · A03:2021</h2><p>Compara interpretar HTML con mostrar texto. Verifica además el bloqueo independiente por CSP.</p><a href="/xss">Comentario</a> · <a href="/csp-prueba">Prueba CSP</a></div>
        <div class="tarjeta"><h2>3. SSRF · A10:2021</h2><p>Haz que el backend consulte el catálogo y después el servicio interno simulado.</p><a href="/ssrf">Consultar recurso</a></div>`);

      const notaRuta = url.pathname.match(/^\/(api\/)?notas\/(\d+)$/);
      if (notaRuta) {
        const resultado = usuario ? politica.obtenerNota(notas, notaRuta[2], usuario) : { estado: 401, error: 'Primero inicia sesión.' };
        if (notaRuta[1]) return enviar(resultado.estado, JSON.stringify(resultado), 'application/json; charset=utf-8');
        return html(resultado.estado, 'Control de acceso por objeto', `<p class="estado">HTTP ${resultado.estado}</p>
          <pre>${e(resultado.nota ? JSON.stringify(resultado.nota, null, 2) : resultado.error)}</pre>
          <a href="/notas/1">Nota 1</a> · <a href="/notas/2">Nota 2</a> · <a href="/login">Cambiar usuario</a>`);
      }
      if (url.pathname === '/xss') {
        const texto = url.searchParams.get('q');
        return html(200, 'XSS reflejado: comentario', `<p>Entrada de demostración:</p><pre>${e(PAYLOAD)}</pre>
          <form action="/xss"><label>Comentario<textarea name="q">${e(texto ?? PAYLOAD)}</textarea></label><button>Mostrar comentario</button></form>
          ${texto === null ? '' : `<h2>Resultado</h2><div id="resultado" class="resultado">${politica.mostrarComentario(texto)}</div>`}`);
      }
      if (url.pathname === '/csp-prueba') return html(200, 'Comprobación independiente de CSP', `
        <p>Esta página contiene deliberadamente un script inline fijo e inocuo.</p>
        <p>Vulnerable: aparece una alerta. Mitigado: no aparece y la consola (F12) muestra el bloqueo.</p>
        <pre>${e(politica.CSP || 'Sin encabezado Content-Security-Policy')}</pre>
        <script>alert('Prueba CSP: script ejecutado')</script>`);
      if (url.pathname === '/ssrf') {
        const destino = url.searchParams.get('url');
        let salida = '', estado = 200;
        if (destino !== null) {
          try { salida = await politica.consultarRecurso(destino, permitidos); }
          catch (error) { estado = error.status || 502; salida = error.message; }
        }
        return html(estado, 'SSRF: petición realizada por el servidor', `
          <p>Catálogo permitido:</p><pre>${e(catalogo)}</pre><p>Servicio interno simulado:</p><pre>${e(secreto)}</pre>
          <form action="/ssrf"><label>URL a consultar<input name="url" value="${e(destino ?? catalogo)}" required></label><button>Consultar desde el backend</button></form>
          ${destino === null ? '' : `<p class="estado">HTTP ${estado}</p><pre id="respuesta">${e(salida)}</pre>`}`);
      }
      return html(404, 'Página no encontrada', '<a href="/">Inicio</a>');
    } catch (error) {
      if (!res.headersSent) html(500, 'Error del laboratorio', `<pre>${e(error.message)}</pre>`);
      else res.end();
    }
  });
}
module.exports = { crearAplicacion, PAYLOAD };

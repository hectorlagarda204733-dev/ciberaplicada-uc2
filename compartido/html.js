function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[caracter]);
}

function pagina(titulo, contenido, modo, usuario) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escaparHTML(titulo)} | UC2</title><link rel="stylesheet" href="/estilos.css"></head>
    <body><header><span class="marca">ITSON · Ciberseguridad Aplicada</span>
    <strong class="${modo}">${modo.toUpperCase()}</strong></header>
    <nav><a href="/">Inicio</a><a href="/notas/1">Control de acceso</a>
    <a href="/xss">XSS</a><a href="/csp-prueba">Prueba CSP</a><a href="/ssrf">SSRF</a><a href="/login">Sesión: ${escaparHTML(usuario || 'sin iniciar')}</a></nav>
    <main><h1>${escaparHTML(titulo)}</h1>${contenido}</main>
    <footer>Laboratorio educativo local · Todos los datos son ficticios</footer></body></html>`;
}
const css = `:root{font-family:Segoe UI,Arial,sans-serif;color:#e8edf7;background:#0b1220;font-size:18px}body{max-width:1100px;margin:auto;padding:24px}header,nav{display:flex;gap:22px;align-items:center;flex-wrap:wrap}header{justify-content:space-between;padding:18px 0}nav{border-block:1px solid #334155;padding:16px 0}a{color:#67e8f9}main{padding:24px 0;min-height:60vh}h1{font-size:36px}h2{font-size:24px}.marca{color:#94a3b8}.vulnerable{color:#fda4af}.mitigado{color:#6ee7b7}.tarjeta,pre,.resultado{background:#162136;padding:22px;border-radius:12px;margin:18px 0}pre,code{font-family:Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}input,textarea,button{font:inherit;padding:12px;border-radius:6px;border:1px solid #64748b}input,textarea{box-sizing:border-box;width:100%;background:#0b1220;color:white;margin:10px 0 18px}textarea{min-height:100px}button{background:#67e8f9;color:#0b1220;cursor:pointer;font-weight:600}label{display:block}footer{color:#94a3b8;font-size:14px}li{margin:12px 0}.estado{font-weight:bold;color:#fbbf24}`;
module.exports = { escaparHTML, pagina, css };

const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const pptxgen = require('pptxgenjs');
const { chromium } = require('playwright');
const { escaparHTML: e } = require('../compartido/html');

const fuentes = [
  ['OWASP A01:2021 · Broken Access Control', 'https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/'],
  ['OWASP A03:2021 · Injection (incluye XSS)', 'https://owasp.org/Top10/2021/A03_2021-Injection/'],
  ['OWASP A10:2021 · SSRF', 'https://owasp.org/Top10/2021/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/'],
  ['OWASP · Authorization Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html'],
  ['OWASP · XSS Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'],
  ['OWASP · Content Security Policy Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html'],
  ['OWASP · SSRF Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html']
];

const slides = [
  {
    section: 'ITSON / CIBERSEGURIDAD APLICADA', title: 'Vulnerabilidades críticas', subtitle: 'Exposición, demostración y mitigación',
    left: ['Broken Access Control', 'Cross-Site Scripting + CSP', 'Server-Side Request Forgery', '15 minutos · OWASP Top 10:2021'],
    panelTitle: 'EQUIPO · INGENIERÍA EN SOFTWARE', right: ['[Nombre completo 1] — [Matrícula 1]', '[Nombre completo 2] — [Matrícula 2]', '[Nombre completo 3] — [Matrícula 3]', 'Completar antes de entregar. Máximo 3 integrantes.'],
    takeaway: 'En cada tema: teoría → OWASP → código y exploit → corrección.',
    notes: '0:00–0:30. Presentar integrantes y objetivo. Sustituir los marcadores de nombres y matrículas. Todos deben participar.'
  },
  {
    section: 'EL LABORATORIO', title: 'Una aplicación, dos versiones',
    left: ['Vulnerable: 127.0.0.1:3000', 'Mitigado: 127.0.0.1:3001', 'Sesión: ana / demo123', 'JavaScript / Node.js · Sin Internet al exponer'],
    panelTitle: 'FLUJO DE LA DEMOSTRACIÓN', right: ['Navegador → aplicación web', 'Aplicación → catálogo local (:9100)', 'Aplicación → servicio interno simulado (:9101)', 'Notas, cuentas y secretos ficticios. Todo escucha en 127.0.0.1.'],
    takeaway: 'El servicio interno es una simulación local; no representa una red aislada real.',
    notes: '0:30–1:00. Mostrar las dos pestañas. Iniciar sesión en ambas antes de exponer. Explicar que quien hace la segunda petición SSRF es el backend.'
  },
  {
    section: '01 / FUNDAMENTO · A01:2021', title: 'Broken Access Control',
    left: ['Fallo al aplicar los permisos de un usuario.', 'Autenticación: ¿quién eres?', 'Autorización: ¿qué puedes hacer?', 'Impacto: leer, modificar o borrar datos ajenos.'],
    panelTitle: 'EJEMPLO: IDOR', right: ['Ana inicia sesión correctamente.', 'GET /notas/1 → nota de Ana', 'Cambia el identificador:', 'GET /notas/2 → nota de Bruno', 'El ID selecciona el objeto; no concede permiso.'],
    takeaway: 'OWASP A01:2021 · Validar permisos por objeto y por operación en el servidor.',
    notes: '1:00–1:45. Explicar IDOR: referencia directa insegura a un objeto. Un login correcto no autoriza a consultar todo.'
  },
  {
    section: '01 / CÓDIGO VULNERABLE + DEMO', title: 'Cambiar un ID expone otra nota',
    left: ['Abrir :3000/notas/1 como Ana.', 'Cambiar el último número a 2.', 'Resultado: HTTP 200 y presupuesto de Bruno.', 'Falta comprobar la propiedad del objeto.'],
    panelTitle: 'vulnerable/app.js · obtenerNota (fragmento)', code: `const nota = notas[id];
if (!nota) {
  return { estado: 404,
           error: 'Nota inexistente' };
}

// No comprueba al propietario.
return { estado: 200, nota };`,
    takeaway: 'Demostración: una sesión válida accede a información ajena.',
    notes: '1:45–3:30. Cambiar el ID en la barra de direcciones. Señalar usuario Ana y propietario Bruno. No cambiar la sesión.'
  },
  {
    section: '01 / MITIGACIÓN INMEDIATA', title: 'Autorizar antes de devolver el objeto',
    left: ['La identidad viene de la sesión del servidor.', 'Comprobar el propietario de cada nota.', 'Ana + nota 1 → HTTP 200.', 'Ana + nota 2 → HTTP 403.'],
    panelTitle: 'mitigado/app.js · obtenerNota (fragmento)', code: `if (nota.propietario !== usuario) {
  return {
    estado: 403,
    error: 'Acceso denegado: esta nota '
      + 'pertenece a otro usuario.'
  };
}

return { estado: 200, nota };`,
    takeaway: 'Ocultar botones o usar UUID no sustituye la autorización en backend.',
    notes: '3:30–5:00. Repetir con 3001. La API aplica el mismo control. Comparar el fallo y la corrección sin perder la operación legítima.'
  },
  {
    section: '02 / FUNDAMENTO · A03:2021', title: 'XSS: datos que el navegador ejecuta',
    left: ['Entrada no confiable se interpreta como HTML ejecutable.', 'Tipos: reflejado, almacenado y basado en DOM.', 'Nuestra demo: XSS reflejado.', 'Impacto: alterar la página o actuar con la sesión de la víctima.'],
    panelTitle: 'DEL DATO AL CÓDIGO', right: ['Usuario envía un comentario.', 'El servidor lo inserta sin codificar.', 'El navegador crea una etiqueta HTML.', 'Un evento ejecuta JavaScript bajo el origen de la aplicación.'],
    takeaway: 'OWASP A03:2021 · Injection incluye XSS (CWE-79).',
    notes: '5:00–5:45. XSS no tiene categoría independiente en 2021. Explicar que aquí se ejecuta en el navegador, no en Node.js.'
  },
  {
    section: '02 / CÓDIGO VULNERABLE + DEMO', title: 'Un comentario provoca una alerta',
    left: ['Abrir :3000/xss.', 'Enviar el comentario precargado.', 'La imagen falla al cargar y ejecuta onerror.', 'El alert es una prueba inocua de ejecución.'],
    panelTitle: 'vulnerable/app.js + entrada de prueba', code: `function mostrarComentario(texto) {
  return texto; // Se inserta en un div.
}

// Entrada en el formulario:
<img src=x
  onerror="alert('XSS de laboratorio')">`,
    takeaway: 'No hace falta una etiqueta <script> para ejecutar JavaScript.',
    notes: '5:45–7:00. Pulsar Mostrar comentario y cerrar la alerta. HttpOnly no elimina XSS: limita lectura de cookies, no las acciones desde la página.'
  },
  {
    section: '02 / MITIGACIÓN + COMPROBACIÓN CSP', title: 'Codificar la salida y añadir CSP',
    left: ['En :3001/xss, la entrada se muestra como texto.', 'Escape contextual: < se representa como &lt;.', 'CSP es una defensa adicional.', 'En /csp-prueba: comparar alertas y abrir F12 → Console.'],
    panelTitle: 'mitigado/app.js · salida y directivas clave', code: `function mostrarComentario(texto) {
  return escaparHTML(texto);
}

Content-Security-Policy:
  default-src 'none';
  script-src 'none';
  style-src 'self';
  object-src 'none';
  base-uri 'none'`,
    takeaway: 'La app no necesita scripts. CSP no sustituye el escape ni la sanitización contextual.',
    notes: '7:00–9:00. Mostrar la salida codificada. Probar /csp-prueba en ambas versiones: script fijo ejecutado en 3000 y bloqueado en 3001. El código aplica la política completa como encabezado HTTP, incluyendo img-src, frame-ancestors y form-action. Si se necesitan scripts legítimos, usar nonces o hashes.'
  },
  {
    section: '03 / FUNDAMENTO · A10:2021', title: 'SSRF: el servidor hace la petición',
    left: ['El usuario controla un destino consultado por el backend.', 'Se aprovecha la conectividad del servidor.', 'Impacto: acceso a servicios internos o metadatos.', 'La demo utiliza un secreto totalmente ficticio.'],
    panelTitle: '¿QUIÉN SE CONECTA?', right: ['Usuario → URL elegida', 'Aplicación → petición HTTP al destino', 'Servicio interno → respuesta a la aplicación', 'Aplicación → datos devueltos al usuario'],
    takeaway: 'OWASP A10:2021 · En SSRF actúa el servidor; en XSS actúa el navegador.',
    notes: '9:00–9:45. Distinguir SSRF de CSRF. No afirmar que el servicio simulado sea inaccesible desde el navegador local.'
  },
  {
    section: '03 / CÓDIGO VULNERABLE + DEMO', title: 'De consultar un catálogo a leer un secreto',
    left: ['Abrir :3000/ssrf.', 'Consultar :9100/catalogo → productos.', 'Cambiar por :9101/secreto.', 'Resultado: SECRETO-DE-LABORATORIO-123.'],
    panelTitle: 'vulnerable/app.js · consultarRecurso (fragmento)', code: `// La URL proviene del usuario.
return descargar(url, {
  redirect: 'follow'
});

// Catálogo legítimo:
http://127.0.0.1:9100/catalogo

// Servicio interno simulado:
http://127.0.0.1:9101/secreto`,
    takeaway: 'Permitir HTTP/HTTPS y añadir un timeout no autoriza el destino.',
    notes: '9:45–11:00. Demostrar primero el catálogo y después el secreto. La URL elegida se envía al backend, que hace la segunda conexión.'
  },
  {
    section: '03 / MITIGACIÓN INMEDIATA', title: 'Destinos fijos, sin redirecciones',
    left: ['Allowlist exacta: esquema, IP, puerto y ruta.', 'IP literal: sin resolución DNS en esta demo.', 'Catálogo permitido → HTTP 200.', 'Servicio interno → HTTP 403.', 'Complemento real: restricciones de salida de red.'],
    panelTitle: 'mitigado/app.js · consultarRecurso (fragmento)', code: `if (!destinosPermitidos.has(url)) {
  const error = new Error(
    'Destino bloqueado'
  );
  error.status = 403;
  throw error;
}
const destinoFijo =
  destinosPermitidos.get(url);
return descargar(destinoFijo, {
  redirect: 'error'
});`,
    takeaway: 'Con dominios: controlar IP efectiva, IPv4/IPv6, DNS rebinding y rangos reservados.',
    notes: '11:00–13:00. Repetir catálogo y secreto en 3001. Explicar coincidencia exacta y redirecciones desactivadas. El catálogo local es una excepción específica, no un permiso para toda la red privada. El firewall es una recomendación adicional; no está implementado en esta demo.'
  },
  {
    section: 'CONCLUSIONES', title: 'Tres límites de confianza',
    left: ['Acceso roto: usuario → objeto ajeno.', 'XSS: dato → código del navegador.', 'SSRF: entrada → conexión del servidor.'],
    panelTitle: 'CONTROL QUE CORRIGE CADA FALLA', right: ['Autorización por objeto en backend.', 'Salida codificada según el contexto + CSP.', 'Destinos permitidos y redirecciones bloqueadas.', 'Verificar siempre: ataque rechazado y uso legítimo conservado.'],
    takeaway: 'No confiar en la entrada del cliente para decidir permisos, código o destinos.',
    notes: '13:00–14:00. Recapitular el impacto y la mitigación de cada tema. Cada demostración compara resultado vulnerable y mitigado.'
  },
  {
    section: 'TRANSPARENCIA / USO DE IA', title: 'Prompt, resultados y revisión',
    left: ['Herramienta: GPT-6 Astra mediante OpenCode.', 'Contexto: consigna completa de la actividad.', 'Resultados: código, presentación, guion y pruebas.', 'Equipo: [anotar revisiones y adaptaciones reales].'],
    panelTitle: 'INSTRUCCIÓN LITERAL UTILIZADA', right: ['“no importa la fecha. nomas haz lo que se necesita y dime que hacer o explicar.”', 'Adaptaciones del asistente: Node.js disponible, datos ficticios y servicios locales.', 'Registro ampliado: USO-IA.md. El equipo debe ensayar y explicar el código.'],
    takeaway: 'Documentar lo que realmente se utilizó y adaptó; citar fuentes técnicas oficiales.',
    notes: '14:00–14:30. Declarar el apoyo de IA sin atribuir al equipo trabajo que no realizó. Completar el campo de revisión después del ensayo.'
  },
  {
    section: 'REFERENCIAS / CIERRE', title: 'Fuentes oficiales y entrega',
    left: ['OWASP Top 10:2021: edición aceptada por la consigna.', 'Código organizado en /vulnerable y /mitigado.', 'Entrega: presentación + enlace al proyecto completo.', 'Gracias. ¿Preguntas?'],
    panelTitle: 'REFERENCIAS · ENLACES CLICABLES', links: fuentes,
    takeaway: 'Referencias completas: FUENTES.md · Plantilla de entrega: CORREO.md',
    notes: '14:30–15:00. Mostrar las fuentes. El líder debe enviar nombres y matrículas en el cuerpo del correo y el enlace público o con permiso de lectura.'
  }
];

async function generar() {
  const salida = path.resolve(__dirname, '../presentacion');
  await fs.mkdir(salida, { recursive: true });
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Equipo · Ciberseguridad Aplicada · ITSON';
  pptx.subject = 'Broken Access Control, XSS/CSP y SSRF';
  pptx.title = 'Exposición y Mitigación de Vulnerabilidades Críticas';
  pptx.lang = 'es-MX';
  pptx.theme = { headFontFace: 'Segoe UI', bodyFontFace: 'Segoe UI', lang: 'es-MX' };
  for (const [index, data] of slides.entries()) {
    const s = pptx.addSlide();
    s.background = { color: '0B1220' };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: .08, fill: { color: '22D3EE' }, line: { color: '22D3EE' } });
    const text = (t, x, y, w, h, size = 21, color = 'E8EDF7', other = {}) => s.addText(t, { x, y, w, h, fontFace: 'Segoe UI', fontSize: size, color, margin: 0, breakLine: false, valign: 'top', ...other });
    text(data.section, .65, .32, 12, .3, 12, '67E8F9', { bold: true, charSpacing: 1.5 });
    text(data.title, .65, .85, 12.1, .75, 31, 'FFFFFF', { bold: true });
    if (data.subtitle) text(data.subtitle, .65, 1.52, 12, .4, 20, '94A3B8');
    const inicio = data.subtitle ? 2.2 : 1.95;
    data.left.forEach((item, j) => text('•  ' + item, .65, inicio + j * .84, 4.65, .77, 21));
    s.addShape(pptx.ShapeType.roundRect, { x: 5.65, y: 1.85, w: 7.02, h: 4.6, radius: .15, rectRadius: .15, fill: { color: '162136' }, line: { color: '26384F', width: 1 } });
    text(data.panelTitle, 5.95, 2.08, 6.42, .48, 12, '67E8F9', { bold: true });
    if (data.code) text(data.code, 5.95, 2.68, 6.42, 3.5, 16, 'D1FAE5', { fontFace: 'Consolas', breakLine: false, lineSpacingMultiple: 1.06 });
    if (data.right) text(data.right.join('\n\n'), 5.95, 2.72, 6.42, 3.5, 20, 'E8EDF7', { lineSpacingMultiple: 1.0, fit: 'shrink' });
    if (data.links) data.links.forEach(([label, url], j) => text(label, 5.95, 2.73 + j * .46, 6.42, .37, 16, '67E8F9', { hyperlink: { url } }));
    text(data.takeaway, .65, 6.65, 12.1, .38, 15, '67E8F9');
    text('ITSON  /  Ciberseguridad Aplicada  /  UC2', .65, 7.14, 9, .2, 10, '94A3B8');
    text(String(index + 1).padStart(2, '0') + ' / 14', 11.6, 7.10, 1.05, .3, 11, '94A3B8', { align: 'right' });
    s.addNotes(data.notes);
  }
  await pptx.writeFile({ fileName: path.join(salida, 'Exposicion-UC2.pptx') });

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Exposición UC2</title>
  <style>
  @page{size:13.333333in 7.5in;margin:0}*{box-sizing:border-box}body{margin:0;background:#253145;font-family:'Segoe UI',Arial,sans-serif;color:#e8edf7}.slide{width:1280px;height:720px;position:relative;background:#0b1220;margin:24px auto;overflow:hidden;break-after:page;border-top:8px solid #22d3ee}.section{position:absolute;left:62px;top:24px;color:#67e8f9;font-size:16px;letter-spacing:2px;font-weight:700}h1{position:absolute;left:62px;top:66px;width:1160px;margin:0;font-size:40px;line-height:1.15}.subtitle{position:absolute;left:62px;top:137px;color:#94a3b8;font-size:25px}.left{position:absolute;left:62px;top:178px;width:445px}.left.has-subtitle{top:202px}.left p{font-size:27px;line-height:1.2;margin:0 0 24px;padding-left:23px;position:relative}.left p:before{content:'•';position:absolute;left:0;color:#67e8f9}.panel{position:absolute;left:542px;top:170px;width:674px;height:442px;padding:24px 29px;border:1px solid #26384f;background:#162136;border-radius:14px}.panel h2{font-size:16px;line-height:1.3;color:#67e8f9;margin:0 0 24px;min-height:33px}.panel p{font-size:25px;line-height:1.25;margin:0 0 18px}.panel pre{font-family:Consolas,monospace;font-size:21px;line-height:1.28;color:#d1fae5;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.links a{display:block;color:#67e8f9;font-size:21px;margin-bottom:17px;text-decoration:none}.takeaway{position:absolute;left:62px;top:633px;width:1160px;color:#67e8f9;font-size:19px;line-height:1.2}.footer{position:absolute;left:62px;bottom:16px;color:#94a3b8;font-size:13px}.number{position:absolute;right:64px;bottom:16px;color:#94a3b8;font-size:14px}.speaker{display:none}@media print{body{background:white}.slide{margin:0;break-inside:avoid}.slide:last-child{break-after:auto}}
  </style></head><body>${slides.map((data, i) => `<section class="slide"><div class="section">${e(data.section)}</div><h1>${e(data.title)}</h1>${data.subtitle ? `<div class="subtitle">${e(data.subtitle)}</div>` : ''}<div class="left ${data.subtitle ? 'has-subtitle' : ''}">${data.left.map(t => `<p>${e(t)}</p>`).join('')}</div><div class="panel"><h2>${e(data.panelTitle)}</h2>${data.code ? `<pre>${e(data.code)}</pre>` : ''}${data.right ? data.right.map(t => `<p>${e(t)}</p>`).join('') : ''}${data.links ? `<div class="links">${data.links.map(([label, url]) => `<a href="${e(url)}">${e(label)}</a>`).join('')}</div>` : ''}</div><div class="takeaway">${e(data.takeaway)}</div><div class="footer">ITSON / Ciberseguridad Aplicada / UC2</div><div class="number">${String(i + 1).padStart(2, '0')} / 14</div><aside class="speaker">${e(data.notes)}</aside></section>`).join('')}</body></html>`;
  const htmlPath = path.join(salida, 'Exposicion-UC2.html');
  await fs.writeFile(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 800 } });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => document.fonts.ready);
    const desbordes = await page.evaluate(() => [...document.querySelectorAll('.slide')].flatMap((s, i) => {
      const errores = [];
      const panel = s.querySelector('.panel');
      if (panel.scrollHeight > panel.clientHeight) errores.push(`Diapositiva ${i + 1}: panel desbordado`);
      const last = panel.lastElementChild.getBoundingClientRect();
      if (last.bottom > panel.getBoundingClientRect().bottom - 10) errores.push(`Diapositiva ${i + 1}: texto toca borde de panel`);
      if (s.querySelector('.left').getBoundingClientRect().bottom > s.querySelector('.takeaway').getBoundingClientRect().top - 5) errores.push(`Diapositiva ${i + 1}: columna izquierda desbordada`);
      if (s.querySelector('h1').getBoundingClientRect().bottom > panel.getBoundingClientRect().top - 10) errores.push(`Diapositiva ${i + 1}: título demasiado largo`);
      return errores;
    }));
    if (desbordes.length) throw new Error(desbordes.join('\n'));
    await page.pdf({ path: path.join(salida, 'Exposicion-UC2.pdf'), printBackground: true, preferCSSPageSize: true });
    await page.locator('.slide').nth(7).screenshot({ path: path.join(salida, 'Vista-previa.png') });
    console.log(`Generadas 14 diapositivas: PPTX (con notas), PDF y HTML. Verificación de desbordes HTML/PDF: OK.\n${salida}`);
  } finally { await browser.close(); }
}
generar().catch(error => { console.error(error); process.exitCode = 1; });

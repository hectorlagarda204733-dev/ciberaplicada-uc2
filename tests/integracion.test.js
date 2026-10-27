const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('../iniciar');
const { PAYLOAD } = require('../compartido/servidor');
const mitigado = require('../mitigado/app');
let lab;
const cookies = {};

before(async () => {
  lab = await iniciar({ silencioso: true, puertos: { vulnerable: 0, mitigado: 0, publico: 0, interno: 0 } });
  for (const modo of ['vulnerable', 'mitigado']) {
    const r = await fetch(`${lab[modo]}/login`, {
      method: 'POST', body: new URLSearchParams({ usuario: 'ana', clave: 'demo123' }), redirect: 'manual'
    });
    assert.equal(r.status, 303);
    cookies[modo] = r.headers.get('set-cookie').split(';')[0];
  }
});
after(async () => { await lab?.cerrar(); });

test('sin sesión: ambas APIs rechazan el acceso', async () => {
  for (const modo of ['vulnerable', 'mitigado']) {
    assert.equal((await fetch(`${lab[modo]}/api/notas/1`)).status, 401);
  }
});
test('Ana puede leer su nota en ambas versiones', async () => {
  for (const modo of ['vulnerable', 'mitigado']) {
    const r = await fetch(`${lab[modo]}/api/notas/1`, { headers: { Cookie: cookies[modo] } });
    assert.equal(r.status, 200); assert.equal((await r.json()).nota.propietario, 'ana');
  }
});
test('IDOR: vulnerable expone a Bruno; mitigado rechaza también en API', async () => {
  const v = await fetch(`${lab.vulnerable}/api/notas/2`, { headers: { Cookie: cookies.vulnerable } });
  assert.equal(v.status, 200); assert.equal((await v.json()).nota.propietario, 'bruno');
  const m = await fetch(`${lab.mitigado}/api/notas/2`, { headers: { Cookie: cookies.mitigado } });
  assert.equal(m.status, 403); assert.ok(!(await m.text()).includes('7,500'));
});
test('la identidad no se puede elegir mediante una cookie inventada o parámetro', async () => {
  assert.equal((await fetch(`${lab.mitigado}/api/notas/2`, { headers: { Cookie: 'uc2_mitigado=bruno' } })).status, 401);
  assert.equal((await fetch(`${lab.mitigado}/api/notas/2?usuario=bruno`, { headers: { Cookie: cookies.mitigado } })).status, 403);
});
test('Bruno sí puede acceder a su propia nota en mitigado', async () => {
  const login = await fetch(`${lab.mitigado}/login`, { method: 'POST', redirect: 'manual', body: new URLSearchParams({ usuario: 'bruno', clave: 'demo123' }) });
  const r = await fetch(`${lab.mitigado}/api/notas/2`, { headers: { Cookie: login.headers.get('set-cookie').split(';')[0] } });
  assert.equal(r.status, 200); assert.equal((await r.json()).nota.propietario, 'bruno');
});
test('XSS: HTML ejecutable frente a salida codificada y CSP', async () => {
  const path = '/xss?q=' + encodeURIComponent(PAYLOAD);
  const v = await fetch(lab.vulnerable + path);
  assert.ok((await v.text()).includes(`<div id="resultado" class="resultado">${PAYLOAD}</div>`));
  assert.equal(v.headers.get('content-security-policy'), null);
  const m = await fetch(lab.mitigado + path);
  assert.ok(m.headers.get('content-security-policy').includes("script-src 'none'"));
  const texto = await m.text();
  assert.ok(texto.includes('&lt;img src=x')); assert.ok(!texto.includes(PAYLOAD));
});
test('SSRF: la funcionalidad legítima del catálogo continúa disponible', async () => {
  for (const modo of ['vulnerable', 'mitigado']) {
    const r = await fetch(`${lab[modo]}/ssrf?url=${encodeURIComponent(lab.publico + '/catalogo')}`);
    assert.equal(r.status, 200); assert.ok((await r.text()).includes('Cuaderno'));
  }
});
test('SSRF: exposición interna vulnerable y bloqueo antes de conectar en mitigado', async () => {
  const ruta = '/ssrf?url=' + encodeURIComponent(lab.interno + '/secreto');
  const v = await fetch(lab.vulnerable + ruta);
  assert.equal(v.status, 200); assert.ok((await v.text()).includes('SECRETO-DE-LABORATORIO-123'));
  const antes = lab.estadisticas.consultasInternas;
  const m = await fetch(lab.mitigado + ruta);
  assert.equal(m.status, 403); assert.ok(!(await m.text()).includes('SECRETO-DE-LABORATORIO-123'));
  assert.equal(lab.estadisticas.consultasInternas, antes);
});
test('SSRF: variantes de ruta, credenciales, host y query no pasan la allowlist', async () => {
  for (const destino of [lab.publico + '/catalogo?url=' + lab.interno, lab.publico + '/catalogo/../redirigir', lab.publico.replace('127.0.0.1', 'localhost') + '/catalogo', lab.publico.replace('http://', 'http://usuario@') + '/catalogo', lab.publico + '/redirigir', 'file:///etc/passwd']) {
    assert.equal((await fetch(`${lab.mitigado}/ssrf?url=${encodeURIComponent(destino)}`)).status, 403);
  }
});
test('SSRF: una redirección incluso desde un destino permitido no se sigue', async () => {
  const origen = `${lab.publico}/redirigir`;
  const antes = lab.estadisticas.consultasInternas;
  await assert.rejects(mitigado.consultarRecurso(origen, new Map([[origen, origen]])));
  assert.equal(lab.estadisticas.consultasInternas, antes);
});
test('SSRF vulnerable también evidencia el salto por redirección', async () => {
  const r = await fetch(`${lab.vulnerable}/ssrf?url=${encodeURIComponent(lab.publico + '/redirigir')}`);
  assert.ok((await r.text()).includes('SECRETO-DE-LABORATORIO-123'));
});

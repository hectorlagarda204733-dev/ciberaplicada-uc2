const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { iniciar } = require('../iniciar');
const { PAYLOAD } = require('../compartido/servidor');

(async () => {
  const lab = await iniciar({ silencioso: true, puertos: { vulnerable: 0, mitigado: 0, publico: 0, interno: 0 } });
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const dialogos = [], errores = [];
    page.on('dialog', async d => { dialogos.push(d.message()); await d.dismiss(); });
    page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    await page.goto(lab.vulnerable + '/xss?q=' + encodeURIComponent(PAYLOAD));
    await page.waitForLoadState('networkidle');
    assert.deepEqual(dialogos, ['XSS de laboratorio']);
    await page.goto(lab.mitigado + '/xss?q=' + encodeURIComponent(PAYLOAD));
    await page.waitForLoadState('networkidle');
    assert.equal(dialogos.length, 1);
    assert.equal(await page.locator('#resultado').textContent(), PAYLOAD);
    assert.equal(await page.locator('#resultado img').count(), 0);
    // Aislar el escape de salida de CSP: incluso retirando CSP, no se ejecuta.
    await page.route('**/xss?**', async route => {
      const r = await route.fetch();
      const headers = { ...r.headers() }; delete headers['content-security-policy'];
      await route.fulfill({ response: r, headers });
    });
    await page.goto(lab.mitigado + '/xss?q=' + encodeURIComponent(PAYLOAD));
    await page.waitForLoadState('networkidle');
    assert.equal(dialogos.length, 1);
    await page.unroute('**/xss?**');
    await page.goto(lab.vulnerable + '/csp-prueba');
    assert.equal(dialogos.at(-1), 'Prueba CSP: script ejecutado');
    const antes = dialogos.length;
    await page.goto(lab.mitigado + '/csp-prueba');
    await page.waitForLoadState('networkidle');
    assert.equal(dialogos.length, antes);
    assert.ok(errores.some(e => /content security policy/i.test(e)));
    for (const modo of ['vulnerable', 'mitigado']) {
      await page.goto(lab[modo] + '/login');
      await page.getByRole('button', { name: 'Entrar' }).click();
      await page.goto(lab[modo] + '/notas/2');
      assert.ok((await page.locator('main').textContent()).includes(modo === 'vulnerable' ? '7,500' : 'HTTP 403'));
      await page.goto(lab[modo] + '/ssrf');
      await page.locator('input[name="url"]').fill(lab.interno + '/secreto');
      await page.getByRole('button', { name: 'Consultar desde el backend' }).click();
      assert.ok((await page.locator('#respuesta').textContent()).includes(modo === 'vulnerable' ? 'SECRETO-DE-LABORATORIO-123' : 'Destino bloqueado'));
    }
    console.log('OK: Edge real verificó XSS, escape sin CSP, bloqueo CSP, IDOR y SSRF en ambas versiones.');
  } finally { await browser?.close(); await lab.cerrar(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

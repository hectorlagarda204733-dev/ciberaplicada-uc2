const http = require('node:http');
const { crearAplicacion } = require('./compartido/servidor');

async function iniciar({ silencioso = false, puertos = {} } = {}) {
  const servidores = [];
  const estadisticas = { consultasInternas: 0 };
  async function escuchar(servidor, puerto) {
    servidores.push(servidor);
    await new Promise((resolve, reject) => {
      servidor.once('error', reject);
      servidor.listen(puerto, '127.0.0.1', resolve);
    });
    return `http://127.0.0.1:${servidor.address().port}`;
  }
  async function cerrar() {
    await Promise.all(servidores.map(s => new Promise(resolve => {
      s.close(resolve); s.closeAllConnections();
    })));
  }
  try {
    const interno = await escuchar(http.createServer((req, res) => {
      estadisticas.consultasInternas++;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.url !== '/secreto') { res.writeHead(404); return res.end('{}'); }
      res.end(JSON.stringify({ servicio: 'administracion-interna-SIMULADA', dato: 'SECRETO-DE-LABORATORIO-123', aviso: 'Dato ficticio, sin credenciales reales.' }, null, 2));
    }), puertos.interno ?? 9101);
    const publico = await escuchar(http.createServer((req, res) => {
      if (req.url === '/redirigir') { res.writeHead(302, { Location: `${interno}/secreto` }); return res.end(); }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (req.url !== '/catalogo') { res.writeHead(404); return res.end('{}'); }
      res.end(JSON.stringify({ servicio: 'catalogo-permitido', productos: ['Cuaderno', 'Pluma'], origen: 'datos ficticios' }, null, 2));
    }), puertos.publico ?? 9100);
    const vulnerable = await escuchar(crearAplicacion('vulnerable', { publico, interno }), puertos.vulnerable ?? 3000);
    const mitigado = await escuchar(crearAplicacion('mitigado', { publico, interno }), puertos.mitigado ?? 3001);
    if (!silencioso) console.log(`\nLABORATORIO UC2\nVulnerable: ${vulnerable}\nMitigado:   ${mitigado}\nUsuario: ana | Contraseña: demo123\nServicios simulados: ${publico} y ${interno}\nTodos los servidores escuchan exclusivamente en 127.0.0.1.\nDeja esta ventana abierta. Ctrl+C para terminar.\n`);
    return { vulnerable, mitigado, publico, interno, estadisticas, cerrar };
  } catch (error) { await cerrar(); throw error; }
}
if (require.main === module) {
  iniciar().then(lab => {
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await lab.cerrar(); process.exit(0); });
    if (process.argv.includes('--abrir') && process.platform === 'win32') {
      const { spawn } = require('node:child_process');
      for (const url of [lab.vulnerable, lab.mitigado]) {
        const navegador = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' });
        navegador.on('error', () => console.log(`Abre manualmente ${url} en tu navegador.`));
      }
    }
  }).catch(error => { console.error('No se pudo iniciar:', error.message, '\nSi un puerto está ocupado, cierra la otra instancia del laboratorio.'); process.exitCode = 1; });
}
module.exports = { iniciar };

# Verificación del material preparado

## Comprobaciones ejecutadas por el asistente

Entorno: Windows, Node.js 24.13.0 y Microsoft Edge mediante Playwright.

### Integración — 11 pruebas aprobadas

Comando: `npm.cmd test`.

- Ambas versiones exigen sesión para consultar notas.
- Ana accede a su propia nota en ambas versiones.
- La versión vulnerable expone la nota de Bruno; la mitigada devuelve 403 sin sus datos, incluso en la API.
- Una cookie inventada o un parámetro `usuario=bruno` no cambian la identidad autenticada.
- Bruno conserva acceso a su propia nota en mitigado.
- El HTML de XSS se inserta en vulnerable y se codifica en mitigado; se comprueba el encabezado CSP.
- Ambas versiones conservan la consulta legítima al catálogo.
- La petición SSRF interna funciona en vulnerable y se rechaza **antes de contactar el servicio interno** en mitigado.
- Variantes de host, usuario en URL, ruta, query y protocolo no evaden la allowlist.
- Una redirección desde un destino expresamente permitido tampoco se sigue en mitigado.
- La versión vulnerable sí sigue una redirección hacia el servicio interno.

### Navegador real — aprobado

Comando: `npm.cmd run test:browser`.

- Se observó la alerta XSS en vulnerable.
- En mitigado, el payload se mostró como texto, sin crear una imagen ni ejecutar la alerta.
- Se retiró CSP únicamente durante una prueba interceptada para verificar que el **escape HTML por sí mismo** impide ejecutar ese payload.
- La prueba independiente de CSP ejecutó la alerta en vulnerable y la bloqueó en mitigado; se observó el error correspondiente en consola.
- Se verificaron los flujos de acceso roto y SSRF en ambas interfaces.

### Presentación y dependencias

- Se generaron 14 diapositivas en PPTX con notas del presentador, PDF y HTML.
- Se verificó automáticamente que las columnas, paneles y títulos del HTML/PDF no se desborden; se revisó visualmente una diapositiva de XSS/CSP.
- El PPTX fue generado, pero no se abrió en PowerPoint en este entorno. Revisar el formato al abrirlo en el editor que utilizará el equipo.
- `npm install` informó **0 vulnerabilidades conocidas** en las dependencias instaladas tras fijar la dependencia transitiva corregida. Este resultado no convierte la carpeta `/vulnerable` en segura: sus fallas son intencionales.

Estas comprobaciones documentan el trabajo del asistente. El equipo aún debe realizar su propio ensayo y actualizar `USO-IA.md` con sus revisiones reales.

## Edición portable en USB

- Proyecto copiado a `E:\CiberAplicada-UC2`, con Node.js oficial 24.13.0 para Windows x64 y las dependencias de desarrollo incluidas.
- ZIP oficial verificado contra su SHA256 publicado: `ca2742695be8de44027d71b3f53a4bdb36009b95575fe1ae6f7f0b5ce091cb88`.
- Se retiró Node del `PATH` durante la comprobación para simular una computadora sin instalación global.
- Las 11 pruebas de integración y las pruebas reales en Edge pasaron ejecutándose con `E:\CiberAplicada-UC2\runtime\node.exe`.
- Se inició `E:\INICIAR-EXPOSICION.cmd --sin-navegador` desde otra carpeta: ambas páginas respondieron HTTP 200 y se confirmó que el proceso utilizaba el ejecutable Node del USB. La opción utilizada evita abrir pestañas durante la comprobación; el doble clic normal sí las abre.
- Los procesos iniciados para la comprobación se cerraron al terminar.
- Los lanzadores usan rutas relativas a su ubicación; no dependen de que la unidad conserve la letra E:.

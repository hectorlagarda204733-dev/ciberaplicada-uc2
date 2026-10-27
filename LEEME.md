# Exposición y mitigación de vulnerabilidades críticas

**ITSON · Ingeniería en Software · Ciberseguridad Aplicada**

## 1. Empieza aquí

1. Haz doble clic en **INICIAR.cmd** y deja abierta la consola.
2. Se abrirán **http://127.0.0.1:3000** (vulnerable) y **http://127.0.0.1:3001** (mitigado) en el navegador. Si no aparecen, abre esas direcciones manualmente.
3. En ambas versiones inicia sesión con **ana / demo123**.
4. Abre **presentacion/Exposicion-UC2.pptx** o **presentacion/Exposicion-UC2.pdf**.
5. Sigue **GUION.md**: indica exactamente qué mostrar, qué decir y el resultado esperado.

**La edición USB incluye Node.js en `runtime` y las herramientas en `node_modules`: funciona en Windows 10/11 de 64 bits sin instalar Node, sin permisos de administrador y sin Internet.** Usa un navegador disponible en Windows para las demostraciones y el PDF/HTML. El lanzador encuentra todo por su ubicación, aunque el USB cambie de letra o copies la carpeta completa a otra computadora.

Para ejecutar desde PowerShell, abre una terminal dentro de la carpeta del USB:

```powershell
.\runtime\node.exe iniciar.js
```

Detén los cuatro servidores con **Ctrl+C**. Al reiniciar se eliminan las sesiones; vuelve a iniciar sesión. Usa siempre `127.0.0.1`, como indican los enlaces.

En una copia de código que no incluya `runtime`, el lanzador utiliza Node.js 22 o superior instalado en la computadora. Las instrucciones rápidas del USB están en `GUIA-USB.txt`.

## 2. Qué debes completar tú

- En la portada del PPTX, reemplaza los marcadores por **nombres completos y matrículas**. Borra las filas sobrantes si son menos de tres.
- Distribuye los temas: integrante 1, control de acceso; integrante 2, XSS/CSP; integrante 3, SSRF. Si son dos, repartan las demostraciones y explicaciones.
- Ensaya con el guion y cronómetro; cada persona debe explicar y participar.
- Revisa la diapositiva de IA y completa `USO-IA.md` con las adaptaciones que realmente hagan. El material generado ya está declarado; no atribuyan al equipo revisiones que no hayan hecho.
- Después de editar el PPTX, exporta tu PDF actualizado desde PowerPoint, LibreOffice o Canva. El PDF inicial no se actualiza solo.
- Sube **la carpeta completa** a Drive (lectura para el docente) o a un repositorio público. Incluye `/vulnerable`, `/mitigado` y `/compartido`: los dos primeros importan utilidades del tercero.
- Completa y envía el correo de `CORREO.md` con la presentación y el enlace al código.

## 3. Pruebas rápidas para ensayar

| Tema | Acción | Vulnerable | Mitigado |
|---|---|---|---|
| Acceso | Como Ana, abrir `/notas/2` | HTTP 200, nota de Bruno | HTTP 403, sin datos de Bruno |
| XSS | En `/xss`, enviar el comentario precargado | Alerta `XSS de laboratorio` | Código mostrado como texto |
| CSP | Abrir `/csp-prueba` | Alerta por script inline | Sin alerta; bloqueo en consola F12 |
| SSRF legítimo | Consultar `http://127.0.0.1:9100/catalogo` | Catálogo | Catálogo |
| SSRF ataque | Consultar `http://127.0.0.1:9101/secreto` | `SECRETO-DE-LABORATORIO-123` | HTTP 403, destino bloqueado |

La página de prueba CSP incluye deliberadamente un script fijo para verificar el encabezado por separado. La corrección principal de XSS es **codificar la salida en contexto HTML**, no depender solo de CSP.

## 4. Archivos

```text
vulnerable/app.js                 Tres implementaciones vulnerables
mitigado/app.js                   Tres correcciones y política CSP
compartido/servidor.js            Rutas, autenticación de laboratorio e interfaz
compartido/html.js                Escape HTML y estilos
compartido/http.js                Cliente HTTP con tiempo y tamaño limitados
iniciar.js                       Arranque y servicios simulados
INICIAR.cmd                      Arranque con doble clic en Windows
CONSOLA-PORTABLE.cmd              Terminal con Node y npm del USB
GUIA-USB.txt                      Instrucciones rápidas del USB
runtime/                         Node.js portable y sus licencias (edición USB)
presentacion/Exposicion-UC2.pptx   Presentación editable
presentacion/Exposicion-UC2.pdf    Presentación lista para leer/imprimir
presentacion/Exposicion-UC2.html   Copia navegable e imprimible
GUION.md                         Pasos, tiempos, explicación y preguntas
USO-IA.md                        Prompt, resultados y revisión del equipo
FUENTES.md                       Referencias oficiales
CORREO.md                        Plantilla de entrega
tests/                           Verificación de seguridad y navegador
herramientas/                     Generador de presentación
```

## 5. Alcance y decisiones técnicas

- Se usa **OWASP Top 10:2021**, permitido por la consigna, de forma consistente: A01, A03 y A10. XSS está dentro de Injection; no tiene categoría independiente en esa edición.
- Las sesiones se guardan en el servidor con identificadores aleatorios. `usuario` no se toma de un parámetro controlado por el cliente. Las cuentas y contraseñas fijas son exclusivamente de demostración.
- La autorización se comprueba tanto en la página como en la API. Ocultar un enlace no bastaría.
- El escape implementado sirve para **texto dentro de HTML**. No debe reutilizarse como solución universal para JavaScript, CSS o URLs. Si la aplicación requiere HTML enriquecido, debe utilizar un sanitizador mantenido y configurado.
- La aplicación no necesita JavaScript legítimo: `script-src 'none'` es adecuado. Si lo necesitara, habría que permitir scripts concretos con nonces o hashes y evitar `unsafe-inline`.
- SSRF se mitiga con **URL fija en una allowlist exacta**: esquema, IP, puerto y ruta están predefinidos. Se desactivan redirecciones. Usar IP literal local evita resolución DNS en este ejemplo.
- El destino local del catálogo es una **excepción explícita del laboratorio**, no una recomendación de permitir toda la red privada. Para servicios reales con dominios: controlar la resolución/conexión, IPv4/IPv6, DNS rebinding y destinos privados/reservados según la política; añadir restricciones de salida en red.
- Los cuatro procesos HTTP se ejecutan en el mismo proceso Node y escuchan solo en `127.0.0.1`. El servicio “interno” **simula** un recurso interno: también puede abrirse desde el navegador de esta computadora. No se afirma que haya una red privada aislada. El punto demostrado es que **el backend hace la petición elegida por el usuario**.
- Los límites de 3 segundos y 64 KiB contienen el consumo de recursos; por sí mismos **no corrigen SSRF**.
- `/vulnerable` contiene fallos intencionales; utiliza el laboratorio local con datos ficticios.

## 6. Verificación y regeneración opcionales

En la edición USB abre **CONSOLA-PORTABLE.cmd**: la terminal usa Node y npm del USB. Puedes ejecutar las siguientes instrucciones sin instalaciones. Pruebas de integración:

```powershell
npm.cmd test
```

Pruebas en Edge y regeneración de PPTX/PDF/HTML (las herramientas ya están incluidas en el USB):

```powershell
npm.cmd run test:browser
npm.cmd run slides
```

Estas herramientas usan `pptxgenjs` y `playwright`; el PDF y la prueba visual requieren Microsoft Edge instalado. No se necesitan para exponer ni para ejecutar el laboratorio. `image-size` se fija en una versión corregida mediante `overrides`.

En una copia del código sin `node_modules`, ejecuta primero `npm.cmd ci` con Internet para descargar esas herramientas de desarrollo. Para entregar únicamente el código al docente, puedes omitir `runtime` y `node_modules`; conserva ambas carpetas en el USB para mantenerlo portable.

**Atención al regenerar:** `npm.cmd run slides` reemplaza los tres archivos generados. Si ya personalizaste el PPTX directamente, exporta desde el editor o cambia también el generador antes de regenerar.

## 7. Si algo falla durante el ensayo

- **Puerto ocupado / EADDRINUSE:** cierra la consola de una ejecución anterior y vuelve a iniciar. Se usan 3000, 3001, 9100 y 9101.
- **HTTP 401 en notas:** inicia sesión en esa versión; cada versión tiene su propia cookie.
- **No aparece alerta XSS:** verifica que estés en el puerto **3000**, presiona “Mostrar comentario” y permite diálogos del sitio si los desactivaste antes.
- **No encuentras CSP:** abre F12 → Red/Network → recarga `/csp-prueba` en 3001 → documento → encabezados de respuesta. Busca `Content-Security-Policy`; en Console se ve la infracción.
- **SSRF bloquea el catálogo:** utiliza exactamente la URL mostrada, sin barra final ni parámetros adicionales.
- **Sin PowerPoint:** abre el PDF o el HTML. Puedes importar el PPTX en Canva o Google Slides y revisar el formato.

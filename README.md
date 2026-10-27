# Exposición y mitigación de vulnerabilidades críticas

**Ciberseguridad Aplicada · Ingeniería en Software · ITSON**

Laboratorio local y exposición de 15 minutos con código vulnerable, demostración y corrección para cada tema:

| Tema | OWASP Top 10:2021 | Corrección demostrada |
|---|---|---|
| Broken Access Control / IDOR | A01 | Comprobar la propiedad del recurso en el servidor |
| XSS y CSP | A03: Injection | Escape de salida HTML y CSP como defensa adicional |
| SSRF | A10 | Lista exacta de destinos permitidos y bloqueo de redirecciones |

## Ejecutar el código de este repositorio

Requiere **Node.js 22 o superior**. Descarga o clona el repositorio y, dentro de su carpeta, ejecuta:

```sh
node iniciar.js
```

En Windows también puedes hacer doble clic en `INICIAR.cmd`.

- Vulnerable: http://127.0.0.1:3000
- Mitigado: http://127.0.0.1:3001
- Usuario: **ana** · Contraseña: **demo123**, en ambas versiones.
- Detener: **Ctrl+C**.

El laboratorio no necesita paquetes adicionales ni Internet para funcionar. Todos los servicios escuchan en `127.0.0.1` y utilizan datos ficticios. Las fallas de `/vulnerable` son intencionales para las demostraciones.

## Presentación y material

- [Presentación PDF](presentacion/Exposicion-UC2.pdf)
- [Presentación editable PPTX, con notas](presentacion/Exposicion-UC2.pptx)
- [Guion: qué hacer y explicar durante los 15 minutos](GUION.md)
- [Instrucciones completas y resultados esperados](LEEME.md)
- [Fuentes oficiales OWASP y MDN](FUENTES.md)
- [Declaración de uso de IA](USO-IA.md)
- [Plantilla de correo](CORREO.md)
- [Comprobaciones realizadas](VERIFICACION.md)

Antes de entregar, completa nombres y matrículas en la presentación y registra la revisión real del equipo en `USO-IA.md`.

## Organización del código

```text
vulnerable/     Implementaciones con fallas
mitigado/       Implementaciones corregidas
compartido/     Servidor, interfaz y utilidades de ambas versiones
tests/         Pruebas de integración y navegador
presentacion/  PPTX, PDF y HTML
herramientas/  Generador de presentación
```

## Pruebas y herramientas opcionales

Pruebas de integración, sin instalar dependencias:

```sh
node --test tests/integracion.test.js
```

Para las pruebas de navegador y el generador de presentaciones:

```sh
npm ci
npm run test:browser
npm run slides
```

Estas dos últimas tareas utilizan Microsoft Edge instalado. El generador reemplaza el PPTX, PDF y HTML; conserva tus ediciones antes de regenerar.

## Edición USB

La edición USB preparada incluye `runtime/` con Node.js oficial para Windows x64 y `node_modules/` con las herramientas. Se inicia mediante `INICIAR-EXPOSICION.cmd` en la raíz del USB o `INICIAR.cmd` dentro del proyecto. No requiere instalar Node ni descargar paquetes.

El repositorio contiene el código y los materiales; `runtime/` y `node_modules/` están excluidos mediante `.gitignore`. Para ejecutar una descarga de GitHub, sigue los requisitos del apartado inicial. Para trasladar la edición portable, copia la carpeta completa del USB.

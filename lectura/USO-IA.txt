# Declaración de uso de IA

## Herramienta

Asistente de IA GPT-6 Astra mediante OpenCode. Se utilizó como apoyo para preparar el laboratorio y los materiales.

## Prompt utilizado

Primero se proporcionó la consigna de **“Actividad: Exposición y Mitigación de Vulnerabilidades Críticas”**, con estos requisitos: Broken Access Control, XSS/CSP y SSRF; teoría, referencia OWASP 2021 o 2025, exploit en vivo y código corregido por cada tema; exposición de 15 minutos, máximo tres integrantes; presentación PDF/PPTX y repositorio con `/vulnerable` y `/mitigado`; declaración del uso de IA.

Después se dio esta instrucción literal:

> no importa la fecha. nomas haz lo que se necesita y dime que hacer o explicar.

La diapositiva 13 reproduce la instrucción y resume el contexto y los resultados.

Después se solicitó literalmente:

> OCUPA HACER TODO ESTO PORTABLE Y QUE ESTE EN UN USB EN EL E:\

Se adaptó el proyecto para USB en Windows x64: Node.js oficial incluido, dependencias disponibles sin descargas, lanzadores con rutas relativas, apertura del navegador e instrucciones de uso.

## Resultados generados y utilizados

- Laboratorio local en JavaScript/Node.js, con versiones vulnerable y mitigada.
- Ejemplos de IDOR, XSS reflejado, CSP y SSRF con servicios simulados.
- Presentación de 14 diapositivas en PPTX, PDF y HTML.
- Guion de exposición, fuentes, plantilla de correo y pruebas automatizadas.

## Adaptaciones incorporadas al material por el asistente

- Se cambió la propuesta inicial de Python a Node.js, disponible en el equipo.
- Se eligió OWASP 2021, permitido por la consigna.
- Se sustituyeron recursos reales por notas ficticias y servicios locales.
- Se añadieron sesión en servidor y comprobaciones de propiedad, escape HTML, CSP sin scripts y allowlist exacta sin redirecciones.
- Se prepararon pruebas de integración y de navegador para contrastar fallo y corrección.

## Revisión y adaptación del equipo — completar después del ensayo

No se debe presentar esta sección como terminada hasta realizar las acciones.

- Integrantes que revisaron el código: **[completar]**.
- Cambios efectuados al código o presentación: **[describir los cambios reales; si no hubo cambios de código, indicarlo]**.
- Demostraciones reproducidas por el equipo: **[completar]**.
- Qué comprendimos y verificamos de las mitigaciones: **[completar]**.
- Reparto de participación en la exposición: **[completar]**.

Las referencias técnicas proceden de OWASP y MDN, listadas en `FUENTES.md`; la IA no se utiliza como sustituto de esas fuentes.

# Guion de exposición — 15 minutos

## Preparación antes de pasar

1. Abre `INICIAR.cmd`. No cierres esa consola.
2. Abre 3000 y 3001; inicia sesión como **ana / demo123 en ambas**.
3. Abre `vulnerable/app.js` y `mitigado/app.js` en el editor, con fuente grande. Los fragmentos también aparecen en las diapositivas.
4. Ten la presentación lista y el navegador al 110–125 % según el proyector.
5. Deja a mano este guion. No es necesario escribir payloads de memoria: el de XSS ya está precargado y las URLs SSRF están visibles.

## 0:00–1:00 · Diapositivas 1–2 · Introducción

**Di:** “Vamos a demostrar tres fallas: acceso a información ajena, ejecución de código en el navegador y peticiones no autorizadas desde el servidor. En cada una veremos teoría, referencia OWASP, código vulnerable, explotación local y corrección.”

**Di:** “Usamos OWASP Top 10 de 2021. Tenemos dos versiones de la misma aplicación: vulnerable en el puerto 3000 y mitigada en el 3001. Todos los datos son ficticios.”

Muestra el esquema: navegador → aplicación; aplicación → catálogo o servicio interno simulado.

## 1:00–5:00 · Diapositivas 3–5 · Broken Access Control

### Teoría y OWASP · 45 segundos

**Di:** “Autenticación significa saber quién eres; autorización significa comprobar qué puedes hacer. Broken Access Control ocurre cuando una aplicación permite actuar fuera de tus permisos. Es **A01:2021**. Nuestro ejemplo es IDOR: cambiar el identificador de un objeto permite consultar el de otra persona.”

### Código vulnerable y explotación · 1 minuto 45 segundos

1. Muestra `obtenerNota` en `vulnerable/app.js`.
2. Señala que busca `notas[id]` y devuelve la nota sin comparar propietario.
3. En 3000 abre `http://127.0.0.1:3000/notas/1`: se ve la nota de Ana.
4. Cambia solamente el último número a **2** en la barra de direcciones.
5. Se ve **HTTP 200** y el presupuesto ficticio de Bruno.

**Di:** “Seguimos autenticados como Ana. Solo cambiamos un ID. El servidor confundió estar autenticado con tener permiso sobre cualquier objeto. El impacto es exposición de información; en operaciones de escritura también podría permitir modificar o borrar datos ajenos.”

### Corrección y verificación · 1 minuto 30 segundos

1. Muestra `obtenerNota` en `mitigado/app.js`: compara `nota.propietario !== usuario` y devuelve 403.
2. En 3001 abre `/notas/1`: funciona.
3. En 3001 abre `/notas/2`: **HTTP 403**, sin contenido de Bruno.

**Di:** “La identidad procede de una sesión validada en el servidor. Antes de devolver el objeto comprobamos su propietario. Así se conserva el acceso legítimo y se rechaza el ajeno. Ocultar botones o usar IDs difíciles de adivinar no reemplaza este control. En una base de datos podríamos consultar por ID y propietario simultáneamente.”

**Opcional si preguntan:** `/api/notas/2` también devuelve 403; el control no vive solo en la interfaz. Un 404 también puede emplearse para no revelar la existencia del objeto.

## 5:00–9:00 · Diapositivas 6–8 · XSS y CSP

### Teoría y OWASP · 45 segundos

**Di:** “XSS aparece cuando datos no confiables se interpretan como contenido ejecutable en el navegador. Puede ser reflejado, almacenado o basado en DOM. Hoy demostramos XSS reflejado: el comentario viaja en la petición y vuelve en la respuesta. En 2021 está incluido en **A03:2021, Injection**, asociado a CWE-79.”

### Código vulnerable y explotación · 1 minuto 15 segundos

1. Muestra `mostrarComentario` vulnerable: devuelve el texto sin codificar; la ruta `/xss` lo inserta dentro de un `div`.
2. Abre `http://127.0.0.1:3000/xss`.
3. El comentario precargado es:

```html
<img src=x onerror="alert('XSS de laboratorio')">
```

4. Pulsa **Mostrar comentario**. Aparece la alerta; ciérrala.

**Di:** “El navegador intenta cargar una imagen que no existe. El evento `onerror` ejecuta JavaScript. El alert solo demuestra ejecución: un XSS real puede alterar la página o realizar acciones con la sesión de la víctima. No significa que todas las cookies puedan leerse; HttpOnly restringe su lectura, pero no elimina XSS.”

### Corrección y CSP · 2 minutos

1. Muestra `mostrarComentario` mitigado y `escaparHTML` en `compartido/html.js`.
2. Explica que `<` se convierte en `&lt;` y el navegador muestra el texto en vez de crear la etiqueta.
3. Repite el envío en `http://127.0.0.1:3001/xss`: aparece el payload como texto, sin alerta.
4. Muestra el encabezado CSP en `mitigado/app.js` y su aplicación en `compartido/servidor.js`.
5. Abre `/csp-prueba` en 3000: hay alerta. Ciérrala.
6. Abre `/csp-prueba` en 3001: no hay alerta. Abre **F12 → Console** para mostrar el bloqueo.

**Di:** “La corrección principal es codificar la salida según su contexto; aquí es texto HTML. CSP añade otra capa. Como esta aplicación no necesita scripts, usamos `script-src 'none'`. `default-src 'none'` restringe recursos por defecto, `object-src 'none'` bloquea objetos y `base-uri 'none'` impide cambiar la base de URLs.”

**Di:** “No afirmamos que CSP por sí sola elimine todos los XSS. La página especial de prueba contiene un script fijo para verificar CSP por separado; el comentario normal ya está corregido mediante escape. Si necesitáramos JavaScript legítimo, diseñaríamos una política con nonces o hashes.”

## 9:00–13:00 · Diapositivas 9–11 · SSRF

### Teoría y OWASP · 45 segundos

**Di:** “En SSRF el atacante hace que el servidor envíe una petición a un destino no previsto. Es **A10:2021**. A diferencia de XSS, aquí el componente que realiza la acción es el backend. El impacto puede incluir lectura de servicios internos, exposición de metadatos o interacción con sistemas accesibles desde ese servidor.”

### Código vulnerable y explotación · 1 minuto 15 segundos

1. Muestra `consultarRecurso` vulnerable: envía la URL proporcionada por el usuario a `descargar`.
2. Abre `http://127.0.0.1:3000/ssrf`.
3. Consulta `http://127.0.0.1:9100/catalogo`: se ve Cuaderno y Pluma.
4. Reemplaza la URL por `http://127.0.0.1:9101/secreto` y consulta.
5. Se muestra **SECRETO-DE-LABORATORIO-123**.

**Di:** “El formulario se envía a nuestra aplicación. Es el backend el que después consulta el puerto 9101 y nos devuelve el resultado. Todos los servicios están en esta computadora: el servicio interno es una simulación, no una red aislada real. No usamos secretos reales.”

### Corrección y verificación · 2 minutos

1. Muestra `consultarRecurso` mitigado: comprueba la pertenencia exacta en un `Map` de destinos permitidos.
2. Señala que usa el destino configurado, no una URL arbitraria, y `redirect: 'error'`.
3. Abre `http://127.0.0.1:3001/ssrf` y consulta el catálogo: funciona.
4. Consulta el servicio interno: **HTTP 403** y “Destino bloqueado”.

**Di:** “Nuestra función solo necesita un catálogo, así que reducimos los destinos posibles a una URL fija. Incluimos esquema, IP, puerto y ruta; no usamos búsquedas parciales del texto. Desactivamos redirecciones para evitar que un destino permitido nos envíe a otro. En este ejemplo usamos una IP literal, por lo que no hay resolución DNS que pueda cambiar.”

**Di:** “En producción complementaríamos esto con restricciones de salida de red. Si se permiten dominios, se debe controlar a qué IP se conecta realmente, incluyendo IPv6, direcciones reservadas y DNS rebinding. El puerto local del catálogo es una excepción específica de este laboratorio; no estamos permitiendo cualquier dirección privada.”

**Opcional si preguntan:** la variante vulnerable acepta `http://127.0.0.1:9100/redirigir`, que redirige al secreto. En mitigado esa URL ni siquiera está permitida; además las pruebas verifican que una redirección desde un destino permitido tampoco se sigue.

## 13:00–14:00 · Diapositiva 12 · Conclusión

**Di:** “Las tres fallas cruzan límites de confianza distintos. En acceso roto, un usuario accede a un objeto ajeno; en XSS, los datos se convierten en código del navegador; en SSRF, una entrada controla las conexiones del servidor.”

**Di:** “Corregimos con autorización por objeto en backend, codificación contextual más CSP, y destinos explícitamente permitidos sin redirecciones. En todas las pruebas verificamos tanto que el ataque se bloquee como que la operación legítima siga funcionando.”

## 14:00–15:00 · Diapositivas 13–14 · IA, fuentes y cierre

**Di:** “Usamos asistencia de IA para generar el laboratorio, el borrador de las diapositivas y el guion. Esta diapositiva muestra el prompt y los resultados utilizados. Aquí indicamos las adaptaciones y revisiones que efectivamente realizamos como equipo.”

Completen esa última frase con acciones reales después del ensayo. No digan que escribieron manualmente todo el código si no fue así.

**Di:** “Las referencias son las categorías oficiales de OWASP 2021 y sus guías de autorización, XSS, CSP y SSRF. El repositorio incluye el código vulnerable y mitigado. Gracias.”

## Preguntas probables y respuestas cortas

**¿Por qué no basta iniciar sesión?** Porque la autenticación no determina el permiso sobre cada objeto o acción.

**¿Un UUID corrige IDOR?** No. Reduce la facilidad de adivinar IDs, pero hace falta autorización igualmente.

**¿Por qué XSS no aparece como categoría propia?** En OWASP Top 10:2021 forma parte de A03 Injection.

**¿CSP reemplaza el escape?** No. Es una defensa adicional. La corrección depende del contexto de salida y del uso de APIs seguras.

**¿Por qué no borrar la palabra script?** Hay etiquetas y atributos que ejecutan código sin contener una etiqueta script, como el `onerror` mostrado.

**¿Y si necesito HTML enriquecido?** Usa un sanitizador mantenido con una política explícita de etiquetas y atributos; no concatenes HTML sin tratar.

**¿XSS siempre roba cookies?** No. HttpOnly puede impedir leerlas, pero el script todavía puede actuar dentro del origen y la sesión de la víctima.

**¿SSRF y CSRF son lo mismo?** No. SSRF induce peticiones desde el servidor; CSRF induce acciones desde el navegador de una víctima autenticada.

**¿Por qué no validar que la URL empiece con el dominio permitido?** Las coincidencias parciales pueden aceptar hosts, credenciales o rutas inesperadas. Aquí se exige una URL exacta y configurada por el servidor.

**¿Los timeouts corrigen SSRF?** No: limitan consumo, pero no autorizan el destino.

**¿El laboratorio ya implementa firewall?** No. Implementa controles de aplicación. Las restricciones de salida de red se explican como complemento para despliegues reales.

**¿Qué pasa si el servidor DNS cambia su respuesta?** Eso puede permitir DNS rebinding si se valida una IP y luego se conecta a otra. Este ejemplo usa IP literal; con dominios hay que asegurar la resolución y la conexión efectiva.

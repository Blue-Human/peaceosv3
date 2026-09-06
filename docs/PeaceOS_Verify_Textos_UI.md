# PeaceOS Verify — Textos de la interfaz (versión humana)

> Se aplica SOLO en la capa de UI del portal. No se toca `core` ni la CLI.
> Regla de doble capa: se muestra el texto humano; el mensaje técnico crudo que
> devuelve `core` se conserva dentro de un desplegable **"Detalle técnico"** en
> cada comprobación, para expertos y auditores.

---

## Veredicto (banda principal)

- **Auténtico** (verdict = authentic)
  - Título: "Evidencia auténtica"
  - Texto: "Esta evidencia es genuina y no ha sido manipulada."

- **Con problemas, por una manipulación** (verdict = problems_detected y HAY alguna
  comprobación en "falla"/fail)
  - Título: "Se han detectado problemas"
  - Texto: "No podemos confirmar que esta evidencia sea auténtica. Revisa las
    comprobaciones marcadas en rojo."

- **Incompleta, sin manipulación** (verdict = problems_detected pero NO hay ninguna
  en fail; solo hay "sin comprobar"/not_determined)
  - Título: "Verificación incompleta"
  - Texto: "Falta información para terminar de comprobarlo. Esto no significa que la
    evidencia sea falsa: significa que aún no se ha podido comprobar del todo."
  - Nota: desde que el registro de organizaciones va incorporado por defecto, este
    caso ya no lo dispara la falta de esa carpeta (siempre hay una); solo lo disparan
    otras comprobaciones sin determinar (por ejemplo, custodia o redacciones).

*(Distinguir estos dos casos es composición de UI a partir del report, no lógica de
verificación: está permitido.)*

## Estados de cada comprobación (chip)

- ok → **"Correcto"** (verde)
- fail → **"Problema"** (rojo)
- not_determined → **"Sin comprobar"** (ámbar)
- timestamp offline → **"Sin confirmar"** (azul) — distinto del verde

## Las 8 comprobaciones, en lenguaje humano

Cada una lleva: nombre claro, "qué comprueba", "por qué importa" (esto puede ir en un
tooltip o icono de ayuda), y el texto del estado.

**1. Archivos íntegros** (integrity)
- Qué comprueba: que ningún archivo del paquete se ha modificado desde que se creó.
- Por qué importa: si alguien hubiera cambiado una foto, un vídeo o un testimonio,
  esta comprobación lo detectaría.
- Correcto: "Todos los archivos están intactos."
- Problema: "Al menos un archivo ha sido modificado."

**2. Firma de origen** (field_signature)
- Qué comprueba: que el paquete lo firmó el dispositivo que documentó la evidencia y
  que esa firma es auténtica.
- Por qué importa: garantiza que la evidencia viene de quien dice, sin que nadie haya
  podido suplantar su firma.
- Correcto: "La firma de origen es válida."
- Problema: "La firma de origen no es válida o la clave no coincide."

**3. Sello de la organización** (org_countersignature)
- Qué comprueba: que la organización responsable ha respaldado el paquete con su
  propia firma.
- Por qué importa: es la organización, con su reputación, la que avala esta evidencia.
- Correcto: "La organización ha sellado este paquete."
- Problema: "No se pudo validar el sello de la organización."
- Sin comprobar: "No se puede comprobar sin la carpeta de organizaciones de confianza."

**4. Organización verificada** (org_identity)
- Qué comprueba: que la organización que firma está en el registro público de
  confianza y es quien dice ser.
- Por qué importa: confirma que detrás de la evidencia hay una organización
  identificable y verificable, no un anónimo.
- Correcto: "La organización está en el registro de confianza."
- Problema: "La organización no aparece en el registro de confianza aportado."
- Sin comprobar: "Falta la carpeta de organizaciones de confianza para comprobarlo."

**5. Fecha y hora** (timestamp)
- Qué comprueba: que existe una prueba de cuándo se creó el paquete, ligada a su
  contenido.
- Por qué importa: impide fingir que algo se documentó antes o después de lo que
  realmente ocurrió.
- Sin confirmar (offline): "Hay una prueba de la fecha, ligada a este paquete. La
  confirmación definitiva en la red pública se comprueba aparte y aquí todavía no se
  ha confirmado."
- Problema: "La prueba de fecha no corresponde a este paquete."

**6. Identificador correcto** (package_id)
- Qué comprueba: que el identificador del paquete corresponde exactamente a su
  contenido.
- Por qué importa: un identificador que no cuadra sería señal de que el paquete se ha
  alterado o mezclado.
- Correcto: "El identificador corresponde al contenido."
- Problema: "El identificador no corresponde al contenido."

**7. Cadena de custodia** (custody)
- Qué comprueba: que queda registrado quién manejó la evidencia y en qué orden, sin
  saltos.
- Por qué importa: muestra el recorrido de la evidencia desde que se capturó, algo
  clave para que un tribunal la tome en serio.
- Correcto: "El recorrido está firmado, en orden y empieza en la captura."
- Problema: "La cadena de custodia tiene un problema de orden, firma o inicio."
- Sin eventos: "Este paquete no incluye cadena de custodia."

**8. Datos sensibles protegidos** (redactions)
- Qué comprueba: que los datos delicados (como la identidad de un testigo) están
  ocultos, pero comprometidos.
- Por qué importa: permite proteger a las personas ahora y, aun así, demostrar esos
  datos ante un juez más adelante sin exponerlos aquí.
- Correcto: "Los datos sensibles están protegidos y siguen siendo demostrables."
- Problema: "Un dato protegido no cuadra con su compromiso."
- Sin datos: "Este paquete no oculta ningún dato."

## Entradas (carga de carpetas)

- Evidencia:
  - Etiqueta: "Evidencia a verificar (carpeta .vep)"
  - Ayuda: "La carpeta que contiene la evidencia y sus sellos."
  - Es la única carga obligatoria. El registro de organizaciones de confianza ya va
    incorporado en el portal (ver más abajo); no hace falta cargarlo a mano.
- Organizaciones de confianza — opción avanzada (evitar la palabra "transparencia" a
  secas):
  - El portal siempre parte de una copia incorporada del registro público (una foto
    tomada al construir el portal). Esta sección está colapsada por defecto y solo
    hace falta abrirla si el usuario quiere aportar su propia copia como garantía
    adicional.
  - Línea de estado (siempre visible, aunque la sección esté colapsada): "Registro
    incorporado: foto del {fecha} (commit {commit})" — la fecha y el commit del
    registro tal y como se construyó el portal.
  - Enlace para abrir la sección: "Opción avanzada: cargar mi propia copia del
    registro" / para cerrarla: "Ocultar opción avanzada".
  - Dentro, al abrirla:
    - Etiqueta: "Organizaciones de confianza"
    - Ayuda: "Copia local del registro público para comprobar quién firma. Selecciona
      la carpeta completa."
    - Si ya hay una copia cargada, aviso: "Tu copia sustituye al registro incorporado
      en esta verificación." y un enlace para deshacerlo: "Usar el registro por
      defecto en su lugar" (no dice "incorporado" a secas porque en el escritorio el
      valor por defecto puede ser el registro actualizado, no el de fábrica).
  - Cuando el usuario ha cargado su copia, la línea de estado cambia a: "Usando tu
    copia cargada del registro (N archivos)".
  - **Solo en la app de escritorio** (nunca en el portal web, que no tiene forma de
    descargar nada): un botón "Actualizar organizaciones" justo debajo de la línea de
    estado, visible siempre que no haya una copia propia cargada.
    - Estado normal: "Actualizar organizaciones". Mientras se ejecuta:
      "Actualizando…" (botón deshabilitado).
    - Éxito: "Registro actualizado a la versión del {fecha} (commit {commit})." y la
      línea de estado pasa a "Registro actualizado: foto del {fecha} (commit
      {commit})".
    - Fallo (registro manipulado, sin conexión, etc.): se muestra el motivo tal cual
      lo devuelve la comprobación (fail closed — la copia anterior no se toca). No
      hay un mensaje genérico que oculte la causa real.
  - Aviso de antigüedad (en ambas plataformas, si el registro en uso —incorporado o
    actualizado, nunca el propio, porque de ese no sabemos la fecha— tiene más de 4
    semanas): "El registro en uso tiene más de {semanas} semanas. Considera
    actualizarlo." En el portal web esto es solo informativo (no hay botón); en
    escritorio invita a usar "Actualizar organizaciones".
- Estados: "Sin seleccionar" / "X archivos cargados"
- Botón: "Verificar evidencia"

## Estado inicial (antes de verificar)

- Título: "Comprueba si una evidencia es auténtica"
- Texto: "Carga la carpeta de la evidencia (.vep). El portal ya lleva incorporado el
  registro público de organizaciones; si quieres máxima garantía, puedes aportar tu
  propia copia como opción avanzada. Todo se comprueba aquí mismo, en tu navegador;
  nada se sube a ningún sitio."

## Línea de confianza (al pie de los resultados)

- "Verificado en tu propio navegador. Nada se sube a ningún servidor."

## Identificador del paquete

- Etiqueta: "Huella del paquete"
- Ayuda (tooltip): "Un identificador único calculado a partir del contenido; si el
  contenido cambia, cambia la huella."
- Se muestra el valor `sha256:…` en monoespaciado, con botón de copiar.

## Detalle técnico (desplegable en cada comprobación)

- Enlace/acordeón discreto: "Detalle técnico"
- Contenido: el `message` original que devuelve `core` para esa comprobación, tal
  cual (sin traducir). Así el experto conserva la precisión y el no técnico no se
  encuentra con jerga por defecto.
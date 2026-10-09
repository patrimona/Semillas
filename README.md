# Semillas

## Aplicación sin conexión para Windows y ACR1552U

La versión de escritorio incluye los vídeos, textos, fuentes y mapas. No necesita
el servidor Vite, un dominio ni internet. El acceso HTTP/HTTPS de su ventana está
bloqueado; todos los contenidos se cargan desde los archivos incluidos.

Abre `release/Semillas NFC-win32-x64/Semillas NFC.exe`. Para trasladar la aplicación
a otro ordenador, copia **toda la carpeta**, no solamente el ejecutable.

Conecta el lector ACS ACR1552U en modo PC/SC. Si Windows no lo reconoce, instala
el controlador CCID/PC/SC de ACS desde
<https://www.acs.com.hk/en/products/575/acr1552u-/>. La aplicación usa WinSCard
y la orden GET UID `FF CA 00 00 00`, documentada por ACS. No modifica las tarjetas.
Las pegatinas deben proporcionar un identificador estable.

En «Asignar tarjetas», acerca una tarjeta, selecciona la semilla y pulsa
«Guardar asociación». En «Ver semillas», acercar una tarjeta asignada abre
automáticamente su ficha. Retira y vuelve a acercar la tarjeta para reiniciar
la misma ficha. Una tarjeta desconocida muestra un aviso y no conserva en
pantalla la ficha de la tarjeta anterior.

Las asociaciones se guardan como `tarjetas-semillas.json` en la carpeta de datos
de la aplicación, mostrada en el panel. Cada cambio conserva la versión anterior
como `.bak`; el panel permite exportar una copia. Para restaurar o trasladar las
asociaciones, cierra la aplicación y copia el JSON exportado a esa carpeta con
el nombre `tarjetas-semillas.json`. Un archivo dañado genera un error y no se
sobrescribe automáticamente.

La copia local `config/tarjetas-semillas.json` está excluida del repositorio.
Para instalar las asociaciones exportadas en otro ordenador, copia el archivo
JSON a la carpeta de datos mostrada en el panel, con la aplicación cerrada.

Ctrl + Mayús + A cambia de modo. F11 activa o desactiva la pantalla completa.
El menú «Semillas» también permite cambiar de modo.

Para generar el ejecutable: `npm run desktop:package`.
Pruebas de almacenamiento: `npm run test:desktop`.
Las pruebas del ejecutable usan una carpeta de datos aislada y tarjetas simuladas;
la lectura física debe verificarse con el ACR1552U y las pegatinas de la instalación.

Instalación de 15 piezas, doce de ellas con vídeos centrados sobre fondo blanco y sin controles visibles. Cinco líneas negras dan paso a cuatro bloques compactos de información y un espacio cuadrado vacío para una futura foto, arriba a la derecha. La algarroba tiene su ficha completa; las demás conservan textos provisionales.

## Desarrollo

## Asignación de pegatinas NFC

Abre `?modo=nfc` para leer una pegatina, seleccionar su semilla y grabar su
enlace. El panel muestra el código proporcionado por la pegatina y su contenido
actual. Si ya contiene datos, hay que marcar la casilla de reemplazo.

La grabación usa un registro NDEF de tipo URL. Antes de escribir se vuelve a
leer la pegatina y después se comprueba el código y el enlace grabado. Mantén
la misma pegatina junto al móvil durante toda la operación. Algunas pegatinas
no proporcionan código; en ese caso no se puede comprobar su identidad por
número de serie. El botón Cancelar detiene la operación pendiente; no deshace
una escritura que ya haya terminado.

Para leer y grabar se necesita Chrome en Android, un móvil con NFC y esta
página servida mediante HTTPS. La dirección de destino debe ser la URL
publicada del interactivo; el panel rechaza enlaces de localhost. La asignación
queda guardada en la pegatina, sin depender del almacenamiento de este móvil.
Las pegatinas deben admitir NDEF y ser regrabables. No se bloquean al grabar.

Validación de la lógica NFC: `node --test scripts/nfc.test.js`.
La lectura y escritura física deben comprobarse con el móvil y las pegatinas
que se usarán en la instalación.

```sh
npm install
npm run dev
```

## Piezas

Cada vídeo se abre mediante el parámetro `pieza` de la URL. Estos enlaces se pueden grabar en las tarjetas NFC usando el dominio donde se publique la web:

| Pieza | Enlace relativo | Archivo |
| --- | --- | --- |
| Algarroba | `?pieza=algarroba` | `ALGARROBA.mp4` |
| Berenjena | `?pieza=berenjena` | `BERENJENA.mp4` |
| Cardo blanco | `?pieza=cardo_blanco` | `CARDO-bucle.mp4` |
| Cebada | `?pieza=cebada` | `cebada-2-blanco.mp4` (copia H.264 de `cebada (2).mp4` con fondo uniforme) |
| Cebolla | `?pieza=cebolla` | `cebolla.mp4` |
| Escanda | `?pieza=escanda` | `ESCANDA.mp4` |
| Faba | `?pieza=faba` | `gueyín (1).mp4` |
| Guisante | `?pieza=guisante` | `GUISANTE.mp4` |
| Maíz | `?pieza=maiz` | `MAIZ.mp4` |
| Mijo | `?pieza=mijo` | `MIJO.mp4` |
| Nabo | `?pieza=nabo` | `NABO.mp4` |
| Tomate | `?pieza=tomate` | `TOMATE.mp4` |
| Azafranero | `?pieza=azafranero` | `azafranero_semilla_360_negro_uniforme.mp4` |
| Sarraceno | `?pieza=sarraceno` | `SARRACENO.mp4` |
| Zanahoria redonda | `?pieza=zanahoria_redonda` | `daucus-carota-blanco.mp4` (copia H.264 de `Daucus carota L..mp4` con fondo uniforme) |
| Faba de vino | `?pieza=faba_vino` | `FABA VINO.mp4` |
| Altramuz azul | `?pieza=altramuz` (también `?pieza=semilla_provisional`) | `One-uncut-photoreal-macro-turntable-of-O.mp4` |
| Panís d’ensalat | `?pieza=panis` (alias `?pieza=maiz2`) | `maiz2 (1).mp4` |

Los vídeos se reproducen automáticamente, en bucle y silenciados para permitir la reproducción automática en móviles. Mantienen su proporción sin recortes.

El título aparece arriba a la izquierda, letra a letra (160 ms por letra tras una pausa inicial de 300 ms). Cuando termina, empiezan las llamadas de información, separadas por 5 segundos de reproducción acumulada. Cada línea se dibuja en 2,2 segundos y el contenido aparece suavemente; los textos y el espacio de foto permanecen visibles después. Un segundo después de que el contenido termine de aparecer, su línea y su punto se desvanecen durante 0,8 segundos. Esto también ocurre con la última llamada. La secuencia continúa entre vueltas del vídeo y se detiene al pausar o esperar datos. Sus puntos de origen son fijos: no realizan seguimiento del objeto. Las posiciones, textos y tiempos se pueden ajustar en `src/App.jsx`.

La portada, los enlaces desconocidos y las piezas `pieza-013`, `pieza-014` y `pieza-015` muestran únicamente negro. También se admiten identificadores del `pieza-001` al `pieza-012`; su numeración provisional sigue el orden de la tabla. Para las tarjetas, se recomienda usar los nombres.

Los archivos están en `src/assets` y las asociaciones en `src/data.js`.

Los contenidos se encuentran en `src/seed-details.js`, transcritos del documento
«2026 DOC Datos para pantallas escaneado semillas.docx». Incluye 18 fichas,
18 asociadas a los vídeos identificados. Altramuz azul sustituye a la semilla
provisional y conserva su enlace anterior. Panís d’ensalat reproduce `maiz2 (1).mp4` con su ficha completa.
Las cinco cajas conservan los títulos del documento, incluidas Recuperación,
Producción, Diversidad y Variedades tradicionales.
El encabezado común incluye el premio y las coordenadas de Svalbard; el pie
identifica como fuente el Inventario Nacional de Recursos Fitogenéticos para
la Agricultura y la Alimentación. Faba, escanda y faba de vino añaden SERIDA
como segunda fuente. Los puntos del mapa siguen los lugares de recolección
y conservan los ajustes visuales revisados para Lena y Belmonte de Miranda.

## Fondo blanco

Los vídeos con nombres en mayúsculas se usan directamente porque ya tienen
fondo blanco. La mezcla `multiply` los integra con el gris
`#E0E0E0` de la ficha, igual que los demás vídeos de fondo claro.

Cardo blanco usa `CARDO-bucle.mp4`: los primeros 240 fotogramas (10 segundos)
de `CARDO.mp4`, sin los 20 segundos finales vacíos. Se conserva el original.

Los enlaces habituales muestran las doce semillas sobre blanco, con textos y
líneas negros. Para comparar con el original, añade `&fondo=negro` a cualquier
enlace, por ejemplo `?pieza=algarroba&fondo=negro`.

Las copias `src/assets/*-blanco.mp4` conservan los fotogramas, la resolución y
la velocidad de sus originales. `python scripts/white-background.py --all`
genera las copias que falten; para regenerar una, usa su nombre de archivo sin
extensión, por ejemplo `python scripts/white-background.py cebolla`.
El script utiliza OpenCV, NumPy e imageio-ffmpeg instalados en `.tools/video`.
La máscara sigue el contorno exterior para preservar las manchas oscuras
interiores, con umbrales específicos para cebolla, nabo y cardo blanco.
Las hojas de revisión se guardan en `.tools/white-review`.

## Giro fluido

Las 17 fichas usan las copias `src/assets/*-fluido.mp4` y `*-constante.mp4`, asociadas en
`src/smooth-videos.js`. Se exportan a 60 fps mediante interpolación de
movimiento y mantienen la resolución, el encuadre y las escalas de cada
semilla. El fondo blanco sigue mezclándose con el gris `#E0E0E0`.
Se eliminan las pausas de fotogramas repetidos y se ajustan los cierres que
no coincidían con el inicio. Los originales se conservan para comparación.
La web precarga el vídeo y deja de actualizar las cartelas cuando termina
su animación, para reducir el trabajo durante las vueltas posteriores.

Para regenerar todas las copias: `python scripts/smooth-loops.py`.
Para una ficha: `python scripts/smooth-loops.py escanda`.
Las fuentes quedan registradas en `scripts/loop-sources.json`; el script usa
OpenCV, NumPy e imageio-ffmpeg de `.tools/video`, como el cambio de fondo.
Los informes de exportación se guardan en `.tools/smooth-loops`.

Algarroba, cardo, cebada, escanda, guisante, tomate y sarraceno usan
`*-constante.mp4`: aceleran los tramos que se frenan y compensan el resto
para conservar la duración de cada vuelta. La medición usa el movimiento
visible con flujo óptico, suavizado para evitar cambios bruscos de velocidad.
Las poses intermedias se interpolan a 60 fps. Las diez semillas que ya
giraban de forma regular mantienen sus copias anteriores.
Para regenerar el ajuste después de crear los bucles fluidos:
`python scripts/even-rotation.py`.
Este proceso conserva las copias anteriores y guarda las mediciones antes
y después en `.tools/rotation-reports`.

## Compilación

```sh
npm run build
npm run preview
```

La carpeta `dist` contiene la web compilada, incluidos los vídeos.

La ficha `?pieza=faba` reproduce directamente `gueyín (1).mp4`, que sustituye al video anterior de la faba.

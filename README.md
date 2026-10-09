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

La app final abre directamente en pantalla completa con el mensaje
«Escanea el sobre para descubrir una semilla». Acercar una pegatina asignada
abre su ficha. Retira y vuelve a acercarla para reiniciar la misma ficha.
Una pegatina desconocida devuelve la pantalla de espera.
No hay menús, paneles de asignación, exportación ni funciones para escribir NFC.
F11 activa o desactiva la pantalla completa; Alt + F4 cierra la aplicación.

El ejecutable incluye las asociaciones de `config/tarjetas-semillas.json`.
Este archivo privado sigue excluido de Git y se copia únicamente al paquete
local de la aplicación. Al copiar toda la carpeta a otro ordenador, las
pegatinas ya funcionan sin configuración adicional. Para generar la app final
es obligatorio disponer de asociaciones válidas para las 18 semillas.
La aplicación solo lee ese archivo y nunca modifica las asociaciones.

Para generar el ejecutable: `npm run desktop:package`.
Pruebas de almacenamiento: `npm run test:desktop`.
Las pruebas del ejecutable usan una carpeta de datos aislada y tarjetas simuladas;
la lectura física debe verificarse con el ACR1552U y las pegatinas de la instalación.

Instalación de 18 semillas con vídeos sobre fondo gris, cinco cartelas de datos
y un mapa del lugar de recolección. La lectura de las pegatinas es local y sin conexión.

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
| Algarroba | `?pieza=algarroba` | `algarroba-constante.mp4` |
| Berenjena | `?pieza=berenjena` | `berenjena-fluido.mp4` |
| Cardo blanco | `?pieza=cardo_blanco` | `cardo-bueno-blanco.mp4` (copia H.264 de `CARDO BUENO.mp4` con fondo uniforme) |
| Cebada | `?pieza=cebada` | `cebada-2-blanco.mp4` |
| Cebolla | `?pieza=cebolla` | `cebolla-fluido.mp4` |
| Escanda | `?pieza=escanda` | `escanda-bueno-blanco.mp4` |
| Faba | `?pieza=faba` | `gueyín (1).mp4` |
| Guisante | `?pieza=guisante` | `guisante-constante.mp4` |
| Maíz | `?pieza=maiz` | `maiz-fluido.mp4` |
| Mijo | `?pieza=mijo` | `mijo-bueno-blanco.mp4` (copia H.264 de `MIJO BUENO.mp4` con fondo uniforme) |
| Nabo | `?pieza=nabo` | `nabo-fluido.mp4` |
| Tomate | `?pieza=tomate` | `tomate-constante.mp4` |
| Azafranero | `?pieza=azafranero` | `azafranero-fluido.mp4` |
| Sarraceno | `?pieza=sarraceno` | `sarraceno-constante.mp4` |
| Zanahoria redonda | `?pieza=zanahoria_redonda` | `zanahoria-bueno-blanco.mp4` (copia H.264 de `ZANAHORIA BUENO.mp4` con fondo uniforme) |
| Faba de vino | `?pieza=faba_vino` | `faba_vino-fluido.mp4` |
| Altramuz azul | `?pieza=altramuz` (también `?pieza=semilla_provisional`) | `altramuz-fluido.mp4` |
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

Cardo blanco usa una copia de `CARDO BUENO.mp4` con fondo uniforme,
sin la sombra exterior y con el tamaño ajustado a la composición.

Los enlaces habituales muestran las 18 semillas sobre gris, con textos y
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

Las asociaciones vigentes están en `src/data.js` y `src/smooth-videos.js`.
Las copias `*-fluido.mp4` y `*-constante.mp4` se reproducen a 60 fps.
Los nuevos vídeos de cardo, escanda, mijo y zanahoria usan copias H.264
con el fondo limpio, conservando los fotogramas de sus fuentes.
El fondo blanco se mezcla con el gris `#E0E0E0`.
La web precarga el vídeo y deja de actualizar las cartelas cuando termina
su animación, para reducir el trabajo durante las vueltas posteriores.

Para regenerar todas las copias: `python scripts/smooth-loops.py`.
Para una ficha: `python scripts/smooth-loops.py escanda`.
Las fuentes quedan registradas en `scripts/loop-sources.json`; el script usa
OpenCV, NumPy e imageio-ffmpeg de `.tools/video`, como el cambio de fondo.
Los informes de exportación se guardan en `.tools/smooth-loops`.

Solo se conservan los 34 vídeos referenciados por el interactivo, incluidas
las variantes accesibles con `&fondo=negro`. Se eliminaron 47 versiones sin uso.
El empaquetado limpia la copia de trabajo antes de copiar la compilación,
para que los vídeos eliminados tampoco permanezcan en el ejecutable.

Los puntos de las flechas quedan fuera del contorno de cada semilla con un
margen visible. `src/seed-video-bounds.json` recoge el contorno exterior de
todos los fotogramas. Tras sustituir un vídeo, actualiza su medida con
`python scripts/seed-video-bounds.py nombre-del-video.mp4` o mide todas
las fichas omitiendo el nombre del archivo.

## Compilación

```sh
npm run build
npm run preview
```

La carpeta `dist` contiene la web compilada, incluidos los vídeos.

La ficha `?pieza=faba` reproduce directamente `gueyín (1).mp4`, que sustituye al video anterior de la faba.

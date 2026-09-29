# Semillas

Instalación de 15 piezas, doce de ellas con vídeos centrados sobre fondo blanco y sin controles visibles. Cinco líneas negras dan paso a cuatro bloques compactos de información y un espacio cuadrado vacío para una futura foto, arriba a la derecha. La algarroba tiene su ficha completa; las demás conservan textos provisionales.

## Desarrollo

```sh
npm install
npm run dev
```

## Piezas

Cada vídeo se abre mediante el parámetro `pieza` de la URL. Estos enlaces se pueden grabar en las tarjetas NFC usando el dominio donde se publique la web:

| Pieza | Enlace relativo | Archivo |
| --- | --- | --- |
| Algarroba | `?pieza=algarroba` | `algarroba.mp4` |
| Berenjena | `?pieza=berenjena` | `berenjena.mp4` |
| Cardo blanco | `?pieza=cardo_blanco` | `cardo_blanco.mp4` |
| Cebada | `?pieza=cebada` | `cebada.mp4` |
| Cebolla | `?pieza=cebolla` | `cebolla.mp4` |
| Escanda | `?pieza=escanda` | `escanda.mp4` |
| Faba | `?pieza=faba` | `faba.mp4` |
| Guisante | `?pieza=guisante` | `guisante.mp4` |
| Maíz | `?pieza=maiz` | `maiz1.mp4` |
| Mijo | `?pieza=mijo` | `mijo.mp4` |
| Nabo | `?pieza=nabo` | `nabo.mp4` |
| Tomate | `?pieza=tomate` | `tomate.mp4` |

Los vídeos se reproducen automáticamente, en bucle y silenciados para permitir la reproducción automática en móviles. Mantienen su proporción sin recortes.

El título aparece arriba a la izquierda, letra a letra (160 ms por letra tras una pausa inicial de 300 ms). Cuando termina, empiezan las llamadas de información, separadas por 5 segundos de reproducción acumulada. Cada línea se dibuja en 2,2 segundos y el contenido aparece suavemente; los textos y el espacio de foto permanecen visibles después. Un segundo después de que el contenido termine de aparecer, su línea y su punto se desvanecen durante 0,8 segundos. Esto también ocurre con la última llamada. La secuencia continúa entre vueltas del vídeo y se detiene al pausar o esperar datos. Sus puntos de origen son fijos: no realizan seguimiento del objeto. Las posiciones, textos y tiempos se pueden ajustar en `src/App.jsx`.

La portada, los enlaces desconocidos y las piezas `pieza-013`, `pieza-014` y `pieza-015` muestran únicamente negro. También se admiten identificadores del `pieza-001` al `pieza-012`; su numeración provisional sigue el orden de la tabla. Para las tarjetas, se recomienda usar los nombres.

Los archivos están en `src/assets` y las asociaciones en `src/data.js`.

## Fondo blanco

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

## Compilación

```sh
npm run build
npm run preview
```

La carpeta `dist` contiene la web compilada, incluidos los vídeos.

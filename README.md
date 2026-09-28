# Semillas

Instalación de 15 piezas con vídeos centrados sobre fondo negro y sin controles visibles. Tres líneas blancas se dibujan sobre cada vídeo y dan paso a textos provisionales Lorem ipsum.

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

Las llamadas de información siguen el tiempo de reproducción y se reinician en cada vuelta del vídeo. Sus puntos de origen son fijos: no realizan seguimiento del objeto. Las posiciones, textos y tiempos se pueden ajustar en `src/App.jsx`.

La portada, los enlaces desconocidos y las piezas `pieza-013`, `pieza-014` y `pieza-015` muestran únicamente negro. También se admiten identificadores del `pieza-001` al `pieza-012`; su numeración provisional sigue el orden de la tabla. Para las tarjetas, se recomienda usar los nombres.

Los archivos están en `src/assets` y las asociaciones en `src/data.js`.

## Compilación

```sh
npm run build
npm run preview
```

La carpeta `dist` contiene la web compilada, incluidos los vídeos.

# Nexo NFC

Base de una experiencia web con tarjetas NFC, creada con React, Vite y Tailwind CSS.

## Arranque

```bash
npm install
npm run dev
```

## Configurar las tarjetas por número de serie

Cada elemento de `src/data.js` tiene una propiedad `nfcSerial`. Sustituye su valor por el número físico de tu tarjeta:

```js
{
  id: 'pieza-001',
  nfcSerial: '04:A1:B2:C3:D4:E5:80',
  // ...
}
```

Puedes escribirlo con o sin dos puntos y en mayúsculas o minúsculas. La aplicación normaliza el valor antes de compararlo. Si se acerca una tarjeta desconocida, mostrará en pantalla el número detectado para que puedas copiarlo a `src/data.js`.

La tarjeta debe contener al menos un registro NDEF para que Web NFC produzca el evento de lectura. Su contenido no se usa para identificar el elemento: la asociación se realiza únicamente mediante `serialNumber`.

Web NFC funciona en Chrome para Android y requiere HTTPS (o `localhost`). En iPhone/iPad, los navegadores no ofrecen actualmente la API Web NFC genérica; puedes grabar una URL en la tarjeta como alternativa y resolver el elemento desde la ruta de la aplicación.

El botón «Probar demostración» y el círculo del lector permiten simular lecturas durante el desarrollo en escritorio.

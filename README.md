# HomeStock Demo

Prototipo móvil de inventario y lista de compra. Los datos de ejemplo y los cambios se guardan únicamente en el navegador mediante localStorage. No hay backend, autenticación ni sincronización entre dispositivos.

## Desarrollo

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

## Validación

```sh
npm run validate
npm run test:unit -- --run
npm run build
```

## GitHub Pages

En Settings → Pages, selecciona **GitHub Actions** como origen. El workflow publica la demo tras cada push a `main` y también admite ejecución manual.

El despliegue utiliza `/homestock-demo/` como ruta base. Las páginas estáticas se generan en `build/`; `404.html` permite abrir las rutas de edición de productos creados en el navegador. En esas rutas, GitHub Pages puede responder con HTTP 404 aunque la aplicación se muestre correctamente.

Este repositorio contiene únicamente el frontend, la persistencia local, sus pruebas y la configuración de la demo. Excluye el código de servidor, la documentación interna y el historial del repositorio de desarrollo.

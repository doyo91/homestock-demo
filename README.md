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

## Gestión del inventario

Cada producto permite elegir **Por estado** o **Por cantidad**. Los nuevos productos empiezan por estado; los datos guardados de versiones anteriores mantienen el modo cantidad y sus existencias.

- **Por estado:** se elige Hay, Poco o No hay. No se muestra ni se mantiene un recuento operativo. Poco y No hay activan Sugerencias o la reposición automática, según la configuración del producto. Marcar comprado pasa a Hay con un toque. La cantidad de Compra es un recordatorio independiente.
- **Por cantidad:** se conserva el recuento, el umbral único de Poco/reposición y la regularización al comprar. El estado es calculado. Los packs convierten su contenido en unidades de inventario.
- En Compra se pueden editar la cantidad prevista y una nota opcional, por ejemplo «packs de 12». La nota no realiza conversiones ni modifica inventario.
- Cambiar a estado descarta el recuento operativo y la configuración de packs. Cambiar a cantidad exige indicar las existencias reales. Si hay una compra marcada sin finalizar, primero debe finalizarse o deshacerse antes de cambiar de modo.
- Deshacer una compra por estado recupera el estado anterior, salvo que se haya corregido explícitamente después. Finalizar conserva los pendientes y retira los comprados, como hasta ahora.

## Probar compras en packs

1. Edita Papel higiénico, elige **Por cantidad** y activa **Se compra en packs**.
2. Indica el tamaño habitual, por ejemplo 6 unidades. La cantidad en casa y el límite de reposición cuentan rollos, no paquetes.
3. En Compra, al confirmar el producto, indica el número de packs y sus unidades. Con 2 rollos en casa y 2 packs de 6, el total será 14.
4. Cambia el tamaño a 12 para probar otro formato. Ese cambio afecta solo a esa compra; el tamaño habitual se edita en el producto.
5. Para formatos mezclados, activa **Introducir el total de unidades**. Puedes deshacer la compra para comprobar que se recupera el stock anterior.

Las cantidades pendientes de la lista siguen expresadas en unidades de contenido. El asistente de compra propone suficientes packs del tamaño habitual para cubrirlas y permite ajustar el número antes de confirmar. Activar packs no convierte el stock existente: revisa su cantidad si antes contabas paquetes.

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
- **Por cantidad:** se conserva el recuento, el umbral único de Poco/reposición y la regularización del inventario, que se puede hacer ahora o después. El estado es calculado. Los packs convierten su contenido en unidades de inventario.
- En Compra se pueden editar la cantidad prevista y una nota opcional, por ejemplo «packs de 12». La nota no realiza conversiones ni modifica inventario.
- Cambiar a estado descarta el recuento operativo y la configuración de packs. Cambiar a cantidad exige indicar las existencias reales. Si hay una compra pendiente de incorporar, primero debe actualizarse y finalizarse, o deshacerse, antes de cambiar de modo.
- Deshacer una compra por estado recupera el estado anterior, salvo que se haya corregido explícitamente después. Finalizar conserva los pendientes de comprar y retira los comprados resueltos. Los que aún no se han incorporado al inventario permanecen en una sección independiente.

## Comprar y actualizar el inventario

1. Marca cualquier producto como comprado con un toque. Los de estado pasan a Hay; los de cantidad conservan el último recuento confirmado y muestran **Compra pendiente de incorporar** en inventario.
2. En **Comprados**, puedes editar la cantidad y nota de compra sin cambiar existencias, o pulsar **Actualizar** para regularizar inmediatamente.
3. **Finalizar compra** retira lo resuelto y pasa lo que falta a **Actualizar inventario**, debajo de la compra activa. No es necesario regularizar en el supermercado.
4. Al llegar a casa, confirma lo comprado y el **Total actual en casa**. El total previsto es una ayuda editable: puedes corregirlo por consumo, envases casi vacíos o recuentos antiguos. Se admite un total real de cero.
5. Si la compra ya estaba finalizada, el pendiente desaparece al actualizar. Si todavía estaba en Comprados, queda resuelta y se retirará al finalizar. Deshacer antes de regularizar no modifica el stock; después revierte solo la variación aplicada, conservando ajustes posteriores cuando no produce existencias negativas.

Los pendientes de inventario sobreviven a la recarga y no vuelven a contarse al finalizar otra compra. Se pueden preparar compras de otros productos mientras tanto. Para mantener una sola línea por producto y evitar duplicados automáticos, hay que resolver la compra pendiente de ese producto antes de añadirlo otra vez. El contador ordinario se sustituye por un acceso a la actualización pendiente para evitar incorporar dos veces la misma compra. Los cambios de nombre, categoría y umbral siguen disponibles.

Las compras guardadas en versiones anteriores ya habían actualizado el inventario: la migración las conserva resueltas y no vuelve a sumarlas.

## Probar compras en packs

1. Edita Papel higiénico, elige **Por cantidad** y activa **Se compra en packs**.
2. Indica el tamaño habitual, por ejemplo 6 unidades. La cantidad en casa y el umbral siempre cuentan rollos, no paquetes.
3. En Compra puedes anotar **2 packs**, sin confirmar su contenido. El check no los convierte ni los suma al stock.
4. Pulsa **Actualizar**, antes o después de finalizar, e indica el tamaño real del pack. Con 2 rollos registrados y 2 packs de 6, el total previsto será 14. Confírmalo o corrígelo según lo que tengas realmente en casa.
5. Puedes usar otro tamaño, como 12, solo para esa compra. Para packs de tamaños mezclados, selecciona **Unidades** e introduce la suma de su contenido.

En productos por estado, los packs pueden describirse en la nota de compra; no realizan conversiones de inventario. Activar packs en un producto por cantidad no convierte automáticamente el stock existente.

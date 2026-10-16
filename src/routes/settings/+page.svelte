<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPrototypeState, setDefaultScreen } from '$lib/prototype/state.svelte';
	import { appearance, setTheme, type Theme } from '$lib/prototype/appearance.svelte';

	const prototypeState = getPrototypeState();

	let defaultScreen = $state(prototypeState.defaultScreen);
	let themeFeedback = $state('');

	function changeTheme(event: Event) {
		const theme = (event.currentTarget as HTMLSelectElement).value as Theme;
		themeFeedback = setTheme(theme)
			? ''
			: 'El tema se ha aplicado, pero este navegador no permite guardar la preferencia.';
	}

	$effect(() => {
		setDefaultScreen(defaultScreen);
	});
</script>

<svelte:head>
	<title>Ajustes | HomeStock</title>
</svelte:head>

<section class="page settings">
	<header class="page-header">
		<p class="household">{prototypeState.householdName}</p>
		<h1>Ajustes</h1>
	</header>

	<section class="group">
		<h2>Preferencias</h2>

		<div class="setting-row">
			<div>
				<strong>Pantalla inicial</strong>
				<span>Elige qué ver al abrir HomeStock</span>
			</div>

			<select bind:value={defaultScreen} aria-label="Pantalla inicial">
				<option value="INVENTORY">Inventario</option>
				<option value="SHOPPING">Compra</option>
			</select>
		</div>

		<div class="setting-row">
			<div>
				<strong>Apariencia</strong>
				<span>Elige el tema de este dispositivo</span>
			</div>
			<select value={appearance.theme} onchange={changeTheme} aria-label="Apariencia">
				<option value="light">Claro</option>
				<option value="dark">Oscuro</option>
			</select>
		</div>
		{#if themeFeedback}<p class="theme-feedback" role="status">{themeFeedback}</p>{/if}
	</section>

	<section class="group">
		<h2>Organización</h2>

		<a class="navigation-row" href={resolve('/settings/categories')}>
			<div>
				<strong>Categorías</strong>
				<span>Organiza los tipos de producto</span>
			</div>

			<span class="chevron" aria-hidden="true">›</span>
		</a>

		<a class="navigation-row" href={resolve('/settings/locations')}>
			<div>
				<strong>Ubicaciones</strong>
				<span>Nevera, despensa, congelador...</span>
			</div>

			<span class="chevron" aria-hidden="true">›</span>
		</a>
	</section>

	<section class="group">
		<h2>Hogar</h2>

		<a class="navigation-row" href={resolve('/settings/household')}>
			<div>
				<strong>Casa</strong>
				<span>Información del hogar</span>
			</div>

			<span class="chevron" aria-hidden="true">›</span>
		</a>
	</section>

	<section class="group">
		<h2>Cuenta</h2>

		<div class="setting-row">
			<div>
				<strong>Usuario de prueba</strong>
				<span>Sesión local de desarrollo</span>
			</div>
		</div>
	</section>

	<section class="group help" aria-labelledby="help-title">
		<h2 id="help-title">Ayuda y guías rápidas</h2>
		<p class="help-intro">Lo esencial para organizar tu casa y preparar la compra.</p>

		<details>
			<summary>Inventario, cantidades y estados</summary>
			<p>
				Cada producto tiene una cantidad entera. Al crearlo en inventario empieza en <strong
					>1</strong
				>, salvo que indiques otra. Tú decides qué representa cada unidad.
			</p>
			<p>
				<strong>No hay</strong> siempre es 0. <strong>Poco</strong> es de 1 hasta el límite del
				producto (por defecto, 1). Por encima aparece <strong>Hay</strong>. Los estados se calculan
				automáticamente.
			</p>
			<p>
				Toca una tarjeta para ajustar y guardar cuánto queda, añadir a Compra, editar o eliminar el
				producto. Puedes ajustar las existencias después de consumir o comprar fuera de la app.
			</p>
			<p>
				Guardar y añadir otro conserva categoría y ubicación, vacía el nombre y restablece cantidad
				1, límite de Poco 1 y reposición Manual. Los filtros activos precargan categoría y
				ubicación.
			</p>
			<p>
				Los productos antiguos sin recuento conocido muestran una cantidad provisional y un aviso de
				revisión. Guarda el recuento real para activar su reposición automática.
			</p>
			<p>
				Eliminar pide confirmación y borra el producto del inventario, de Sugerencias y de Compra,
				incluidos los comprados. Después puedes reutilizar su nombre.
			</p>
		</details>
		<details>
			<summary>Reposición automática y sugerencias</summary>
			<p>
				Un automático se añade a Compra al alcanzar o bajar de su límite de reposición (por defecto,
				0). Ese límite puede ser igual o inferior al de Poco. No se duplican productos que ya están
				en la lista.
			</p>
			<p>
				Los productos en <strong>Poco</strong> que no están en Compra aparecen en Sugerencias. Al añadirlos
				puedes indicar cuánto comprar y corregir cuánto queda en casa; la compra aún no se suma.
			</p>
			<p>
				Si ajustas existencias o límites y dejan de necesitar reposición, se retira su pendiente
				automático. Los pendientes añadidos manualmente se conservan.
			</p>
			<p>
				Quitar un pendiente con la papelera no cambia sus existencias. No se vuelve a añadir
				automáticamente hasta que cambie el recuento o la configuración; si está en Poco, se puede
				añadir desde Sugerencias.
			</p>
		</details>
		<details>
			<summary>Comprar, deshacer y finalizar</summary>
			<p>
				Toca un pendiente para confirmar cuánto has comprado. Se suma al inventario. Si ya había
				existencias, puedes dejar de contar una unidad abierta o casi terminada. El panel muestra el
				total antes de confirmar.
			</p>
			<p>
				Un producto nuevo creado desde Compra empieza con 0 en casa, salvo que indiques otra
				cantidad. Los artículos de solo esta compra tienen cantidad, pero no modifican el
				inventario.
			</p>
			<p>
				Deshacer resta el incremento neto de esa compra y devuelve la línea a Pendientes,
				conservando otros ajustes posteriores. Si quedasen existencias negativas, tendrás que
				revisar primero el recuento. Las compras de versiones antiguas requieren revisar la cantidad
				porque no guardaban ese incremento.
			</p>
			<p>
				Confirmar o finalizar una compra no genera inmediatamente otra reposición aunque el producto
				siga bajo mínimos. La reposición se revisa al cambiar después las existencias o los límites.
			</p>
			<p>Finalizar retira los comprados; los pendientes se conservan para otra ocasión.</p>
		</details>
		<details>
			<summary>Categorías, ubicaciones y esta demo</summary>
			<p>
				Las categorías agrupan tipos de producto y pueden tener un color. Las ubicaciones indican
				dónde los guardas. Ambas se gestionan desde Ajustes y sirven para filtrar el inventario.
			</p>
			<p>
				Esta demo guarda los cambios en este navegador. No se comparten entre dispositivos; si
				borras sus datos, se recupera el contenido de ejemplo.
			</p>
		</details>
	</section>
</section>

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.household {
		margin: 0 0 0.15rem;
		color: var(--muted);
		font-size: 0.875rem;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		line-height: 1.15;
	}

	.group {
		margin-bottom: 2rem;
	}

	.group h2 {
		margin: 0 0 0.5rem;
		color: var(--muted);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.setting-row,
	.navigation-row {
		display: flex;
		width: 100%;
		min-height: 4rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--surface-soft);
	}

	.navigation-row {
		color: inherit;
		text-decoration: none;
	}

	.setting-row > div,
	.navigation-row > div {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.2rem;
	}

	.setting-row strong,
	.navigation-row strong {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.setting-row span,
	.navigation-row div span {
		color: var(--muted);
		font-size: 0.8rem;
	}

	select {
		max-width: 8rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--surface);
		font: inherit;
		font-size: 0.875rem;
	}

	.chevron {
		flex: 0 0 auto;
		color: var(--muted);
		font-size: 1.5rem;
		font-weight: 300;
	}

	h1 {
		font-size: 2.1rem;
	}
	.household {
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 0.3rem;
	}
	.group {
		padding: 1.1rem;
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		background: var(--surface);
		box-shadow: var(--shadow);
		margin-bottom: 1rem;
	}
	.group h2 {
		color: var(--accent);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		margin-bottom: 0.6rem;
	}
	.setting-row:last-child,
	.navigation-row:last-child {
		border-bottom: 0;
	}
	.navigation-row:hover {
		color: var(--accent);
	}
	select {
		min-height: 2.75rem;
	}
	.help-intro,
	.theme-feedback {
		margin: 0.5rem 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.help details {
		border-top: 1px solid var(--line);
	}
	.help summary {
		padding: 1rem 0;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
	}
	.help details p {
		margin: 0 0 0.85rem;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.6;
	}
	.help details strong {
		color: var(--ink);
	}
	@media (max-width: 359px) {
		.setting-row {
			flex-wrap: wrap;
		}
	}
</style>

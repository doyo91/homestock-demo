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
			<summary>Inventario y estados</summary>
			<p>
				<strong>Hay</strong>: tienes suficiente. <strong>Poco</strong>: empieza a faltar.
				<strong>No hay</strong>: se ha agotado.
			</p>
			<p>
				Toca una tarjeta para cambiar el estado, añadir el producto a Compra, editarlo o eliminarlo.
				Eliminar producto pide confirmación y lo borra del inventario, de Sugerencias y de Compra,
				incluidos los elementos marcados como comprados. Después puedes crear otro con el mismo
				nombre.
			</p>
		</details>
		<details>
			<summary>Reposición automática y manual</summary>
			<p>
				Un producto automático se añade a Pendientes cuando cambia a <strong>No hay</strong>. Si
				pasa de No hay a otro estado, se retira su pendiente automático. El icono de flechas junto
				al nombre identifica estos productos.
			</p>
			<p>
				Los productos manuales se añaden a Compra cuando tú lo decides. El modo de reposición se
				cambia en Editar producto.
			</p>
		</details>
		<details>
			<summary>Sugerencias y quitar de Compra</summary>
			<p>
				Sugerencias reúne productos en <strong>Poco</strong> y automáticos en
				<strong>No hay</strong> que no están en Compra. Pulsa Añadir para pasarlos a Pendientes.
			</p>
			<p>
				La papelera solo quita un pendiente de Compra: no elimina el producto ni cambia su estado.
				Si cumple las condiciones anteriores, vuelve a Sugerencias y puedes añadirlo cuando quieras.
			</p>
		</details>
		<details>
			<summary>Comprar, deshacer y finalizar</summary>
			<p>
				Toca un pendiente para marcarlo como comprado. Si está asociado a un producto, su inventario
				pasa a <strong>Hay</strong>. Deshacer recupera su estado anterior y lo devuelve a
				Pendientes.
			</p>
			<p>
				Finalizar compra retira los comprados de esta lista. Los pendientes se conservan para otra
				ocasión.
			</p>
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

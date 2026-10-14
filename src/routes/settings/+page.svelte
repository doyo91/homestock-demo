<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPrototypeState, setDefaultScreen } from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	let defaultScreen = $state(prototypeState.defaultScreen);

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
</section>

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.household {
		margin: 0 0 0.15rem;
		color: #777;
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
		color: #777;
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
		border-bottom: 1px solid #eee;
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
		color: #777;
		font-size: 0.8rem;
	}

	select {
		max-width: 8rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background: white;
		font: inherit;
		font-size: 0.875rem;
	}

	.chevron {
		flex: 0 0 auto;
		color: #999;
		font-size: 1.5rem;
		font-weight: 300;
	}
</style>

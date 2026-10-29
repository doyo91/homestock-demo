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
				Los productos nuevos se gestionan <strong>por estado</strong>: eliges Hay, Poco o No hay sin
				contar unidades. La cantidad de Compra solo sirve de recordatorio.
			</p>
			<p>
				Si eliges <strong>por cantidad</strong>, llevas un recuento entero. No hay es 0; Poco es de
				1 hasta el límite del producto (por defecto, 1); por encima aparece Hay. El estado se
				calcula automáticamente.
			</p>
			<p>
				Toca una tarjeta para cambiar el estado o la cantidad, añadir a Compra, editar o eliminar.
				Si tiene una compra pendiente de incorporar, accede a su actualización para confirmar el
				total real.
			</p>
			<p>
				Puedes cambiar la forma de gestión al editar. Antes debes resolver cualquier compra marcada
				del producto. Pasar a estado deja de llevar recuento y quita la configuración de packs;
				pasar a cantidad requiere indicar las existencias reales.
			</p>
			<p>
				Los productos antiguos sin recuento conocido muestran un aviso de revisión. Eliminar pide
				confirmación y borra también sus compras pendientes y compradas, incluidas las que faltaban
				por incorporar.
			</p>
		</details>
		<details>
			<summary>Reposición automática y sugerencias</summary>
			<p>
				Poco y No hay activan la reposición. En modo cantidad, el campo <strong
					>Reponer cuando queden</strong
				> determina ese límite. En modo estado, lo decides al cambiar el estado.
			</p>
			<p>
				Los productos automáticos se añaden a Compra; los manuales aparecen en Sugerencias. No se
				duplican productos que ya están en Compra o tienen una compra pendiente de incorporar.
			</p>
			<p>
				Si dejan de necesitar reposición, se retira su pendiente automático. Las líneas añadidas
				manualmente se conservan. Quitar una línea con la papelera no cambia el inventario.
			</p>
		</details>
		<details>
			<summary>Comprar, actualizar inventario y finalizar</summary>
			<p>
				Toca un pendiente para marcarlo comprado con un toque. Los productos por estado pasan a Hay.
				Los de cantidad mantienen el último recuento confirmado hasta que lo actualices.
			</p>
			<p>
				En <strong>Comprados</strong> puedes editar cuánto has comprado sin cambiar existencias, o
				pulsar <strong>Actualizar</strong>. Confirma las unidades o packs y el
				<strong>Total actual en casa</strong>: puedes corregir el total previsto si has consumido
				algo o el recuento anterior no era exacto.
			</p>
			<p>
				Puedes finalizar en el supermercado sin regularizar. Lo que falta pasa a <strong
					>Actualizar inventario</strong
				>, debajo de la lista, y se conserva al recargar. Resuélvelo al llegar a casa. Los
				pendientes de comprar siguen disponibles para otra ocasión.
			</p>
			<p>
				En productos por cantidad que usan packs, puedes anotar el número de packs y confirmar su
				contenido después. Para tamaños mezclados, introduce directamente el total de unidades. En
				productos por estado, usa la nota para describir los packs.
			</p>
			<p>
				Deshacer antes de actualizar devuelve el artículo a Pendientes sin cambiar el recuento.
				Después de actualizar, revierte solo la variación aplicada, conservando ajustes posteriores
				cuando no produce existencias negativas. En productos por estado recupera el estado anterior
				salvo que lo hayas corregido después.
			</p>
			<p>
				Los artículos de solo esta compra no modifican inventario. Los nuevos guardados desde Compra
				empiezan por estado. Una compra pendiente de incorporar bloquea otra línea del mismo
				producto para evitar duplicados; puedes seguir comprando otros artículos.
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

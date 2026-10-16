<script lang="ts">
	import { createFeedback } from '$lib/prototype/feedback.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ProductForm from '$lib/components/ProductForm.svelte';
	import {
		createProduct,
		getActiveCategories,
		getActiveLocations
	} from '$lib/prototype/state.svelte';

	const feedback = createFeedback();
	let initialValue = $derived.by(() => {
		const categoryId = page.url.searchParams.get('categoryId');
		const locationId = page.url.searchParams.get('locationId');
		return {
			categoryId: getActiveCategories().find((category) => category.id === categoryId)?.id ?? '',
			locationId: getActiveLocations().find((location) => location.id === locationId)?.id ?? ''
		};
	});

	function saveProduct(
		value: {
			name: string;
			quantity: number;
			lowThreshold: number;
			categoryId: string;
			locationId: string;
			replenishmentMode: 'MANUAL' | 'AUTOMATIC';
		},
		addAnother: boolean
	): boolean {
		const productId = createProduct(
			value.name,
			value.quantity,
			value.categoryId || null,
			value.locationId || null,
			value.replenishmentMode,
			value.lowThreshold
		);

		if (productId) {
			feedback.show('Producto creado correctamente.');
			if (!addAnother) {
				setTimeout(() => {
					window.location.href = resolve('/');
				}, 500);
			}
			return true;
		} else {
			feedback.show('Ya existe un producto con ese nombre.', true);
			return false;
		}
	}
</script>

<svelte:head>
	<title>Nuevo producto | HomeStock</title>
</svelte:head>

<section class="page">
	<header class="page-header">
		<a class="back" href={resolve('/')} aria-label="Volver al inventario"> ‹ </a>

		<div>
			<p>Inventario</p>
			<h1>Nuevo producto</h1>
		</div>

		<div></div>
	</header>

	{#if feedback.message}
		<div class="feedback" role="status">
			<span>{feedback.message}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => feedback.clear()}>
				×
			</button>
		</div>
	{/if}

	<ProductForm {initialValue} submitLabel="Guardar" allowAddAnother onsubmit={saveProduct} />
</section>

<style>
	.page-header {
		display: grid;
		grid-template-columns: 2.75rem 1fr 2.75rem;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.page-header > div {
		text-align: center;
	}

	.page-header p {
		margin: 0 0 0.15rem;
		color: var(--muted);
		font-size: 0.75rem;
	}

	h1 {
		margin: 0;
		font-size: 1.4rem;
	}

	.back {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		color: var(--ink);
		font-size: 2rem;
		text-decoration: none;
	}

	.feedback {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.6rem;
		background: var(--surface-soft);
		font-size: 0.85rem;
	}

	.feedback button {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}
</style>

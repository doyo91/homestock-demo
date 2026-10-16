<script lang="ts">
	import { createFeedback } from '$lib/prototype/feedback.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ProductForm from '$lib/components/ProductForm.svelte';
	import { getProductById, updateProduct } from '$lib/prototype/state.svelte';

	const productId = page.params.id;

	const product = productId ? getProductById(productId) : null;

	const initialValue = product
		? {
				name: product.name,
				quantity: product.quantity,
				lowThreshold: product.lowThreshold,
				packSize: product.packSize ?? null,
				categoryId: product.categoryId ?? '',
				locationId: product.locationId ?? '',
				replenishmentMode: product.replenishmentMode
			}
		: undefined;

	const feedback = createFeedback();

	function saveProduct(value: {
		name: string;
		quantity: number;
		lowThreshold: number;
		packSize: number | null;
		categoryId: string;
		locationId: string;
		replenishmentMode: 'MANUAL' | 'AUTOMATIC';
	}) {
		if (!product) {
			return;
		}

		const success = updateProduct(
			product.id,
			value.name,
			value.quantity,
			value.categoryId || null,
			value.locationId || null,
			value.replenishmentMode,
			value.lowThreshold,
			value.packSize
		);

		if (success) {
			feedback.show('Producto actualizado correctamente.');
			setTimeout(() => {
				window.location.href = resolve('/');
			}, 500);
		} else {
			feedback.show('Ya existe un producto con ese nombre.', true);
		}
	}
</script>

<svelte:head>
	<title>{product ? `Editar ${product.name}` : 'Producto no encontrado'} | HomeStock</title>
</svelte:head>

<section class="page">
	<header class="page-header">
		<a class="back" href={resolve('/')} aria-label="Volver al inventario"> ‹ </a>

		<div>
			<p>Inventario</p>
			<h1>Editar producto</h1>
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

	{#if product && initialValue}
		{#if product.quantityNeedsReview}<p class="feedback">
				Revisa la cantidad provisional antes de guardar.
			</p>{/if}
		<ProductForm {initialValue} submitLabel="Guardar cambios" onsubmit={saveProduct} />
	{:else}
		<div class="not-found">
			<h2>Producto no encontrado</h2>

			<p>El producto que intentas editar no existe.</p>

			<a href={resolve('/')}>Volver al inventario</a>
		</div>
	{/if}
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

	.not-found {
		padding: 3rem 1rem;
		text-align: center;
	}

	.not-found h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}

	.not-found p {
		margin: 0 0 1rem;
		color: var(--muted);
		font-size: 0.875rem;
	}

	.not-found a {
		color: var(--ink);
		font-weight: 600;
	}
</style>

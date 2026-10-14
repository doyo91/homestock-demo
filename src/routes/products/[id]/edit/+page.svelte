<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ProductForm from '$lib/components/ProductForm.svelte';
	import { getProductById, updateProduct } from '$lib/prototype/state.svelte';

	const productId = page.params.id;

	const product = productId ? getProductById(productId) : null;

	const initialValue = product
		? {
				name: product.name,
				status: product.status,
				categoryId: product.categoryId ?? '',
				locationId: product.locationId ?? '',
				replenishmentMode: product.replenishmentMode
			}
		: undefined;

	let feedback = $state<string | null>(null);

	function saveProduct(value: {
		name: string;
		status: 'AVAILABLE' | 'LOW' | 'OUT';
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
			value.status,
			value.categoryId || null,
			value.locationId || null,
			value.replenishmentMode
		);

		if (success) {
			feedback = 'Producto actualizado correctamente.';
			setTimeout(() => {
				window.location.href = resolve('/');
			}, 500);
		} else {
			feedback = 'Ya existe un producto con ese nombre.';
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

	{#if feedback}
		<div class="feedback" role="status">
			<span>{feedback}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => (feedback = null)}>
				×
			</button>
		</div>
	{/if}

	{#if product && initialValue}
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
		color: #777;
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
		color: #111;
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
		background: #f3f3f3;
		font-size: 0.85rem;
	}

	.feedback button {
		padding: 0;
		border: 0;
		background: transparent;
		color: #666;
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
		color: #777;
		font-size: 0.875rem;
	}

	.not-found a {
		color: #111;
		font-weight: 600;
	}
</style>

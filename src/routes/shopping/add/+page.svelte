<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		addOneOffShoppingItem,
		addProductToShopping,
		getPrototypeState,
		getCategoryById,
		getLocationById,
		saveShoppingItemAsProduct
	} from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	function getCategoryName(categoryId: string | null): string {
		if (!categoryId) return 'Sin categor�a';
		const category = getCategoryById(categoryId);
		return category?.name ?? 'Sin categor�a';
	}

	function getLocationName(locationId: string | null): string {
		if (!locationId) return 'Sin ubicaci�n';
		const location = getLocationById(locationId);
		return location?.name ?? 'Sin ubicaci�n';
	}

	let query = $state('');
	let selectedProductId = $state<string | null>(null);
	let error = $state<string | null>(null);

	let normalizedQuery = $derived(query.trim().toLocaleLowerCase());

	let matches = $derived(
		normalizedQuery.length === 0
			? []
			: prototypeState.inventory.filter((product) =>
					product.name.toLocaleLowerCase().includes(normalizedQuery)
				)
	);

	let selectedProduct = $derived(
		selectedProductId === null
			? null
			: (prototypeState.inventory.find((product) => product.id === selectedProductId) ?? null)
	);

	let selectedProductAlreadyInShopping = $derived(
		selectedProduct === null
			? false
			: prototypeState.shopping.some((item) => item.productId === selectedProduct.id)
	);

	let existingProductWithExactName = $derived(
		normalizedQuery.length === 0
			? null
			: (prototypeState.inventory.find(
					(product) => product.name.trim().toLocaleLowerCase() === normalizedQuery
				) ?? null)
	);

	function selectProduct(id: string) {
		const product = prototypeState.inventory.find((item) => item.id === id);

		if (!product) {
			return;
		}

		selectedProductId = id;
		query = product.name;
		error = null;
	}

	function updateQuery(value: string) {
		query = value;
		selectedProductId = null;
		error = null;
	}

	async function addExistingProduct() {
		if (!selectedProduct) {
			return;
		}

		const added = addProductToShopping(selectedProduct.id);

		if (!added) {
			error = `${selectedProduct.name} ya est� en Compra.`;
			return;
		}

		await goto(resolve('/shopping'));
	}

	async function addOneOffItem() {
		const name = query.trim();

		if (!name) {
			return;
		}

		const added = addOneOffShoppingItem(name);

		if (!added) {
			error = 'No se ha podido a�adir el art�culo.';
			return;
		}

		await goto(resolve('/shopping'));
	}

	async function saveAsProduct() {
		const name = query.trim();

		if (!name) {
			return;
		}

		if (existingProductWithExactName) {
			error = 'Ya existe un producto con ese nombre.';
			return;
		}

		const productId = saveShoppingItemAsProduct(name);

		if (!productId) {
			error = 'No se ha podido guardar el producto.';
			return;
		}

		await goto(resolve('/shopping'));
	}
</script>

<svelte:head>
	<title>A�adir a compra | HomeStock</title>
</svelte:head>

<section class="page">
	<header class="page-header">
		<a class="back" href={resolve('/shopping')} aria-label="Volver a Compra"> < </a>

		<div>
			<p>Compra</p>
			<h1>A�adir</h1>
		</div>

		<div></div>
	</header>

	<div class="search">
		<label for="product-search">�Qu� necesitas comprar?</label>

		<input
			id="product-search"
			type="search"
			value={query}
			placeholder="Ej. Leche"
			autocomplete="off"
			oninput={(event) => updateQuery(event.currentTarget.value)}
		/>
	</div>

	{#if error}
		<div class="error" role="alert">
			<span>{error}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => (error = null)}> � </button>
		</div>
	{/if}

	{#if selectedProduct}
		<section class="selection">
			<p class="section-label">Producto seleccionado</p>

			<div class="selected-product">
				<div>
					<strong>{selectedProduct.name}</strong>
					<span>
						{getLocationName(selectedProduct.locationId)} � {getCategoryName(
							selectedProduct.categoryId
						)}
					</span>
				</div>

				<span class="selected-mark" aria-hidden="true">V</span>
			</div>

			{#if selectedProductAlreadyInShopping}
				<p class="already-added">Este producto ya est� en Compra.</p>
			{/if}

			<button
				class="primary-button"
				type="button"
				disabled={selectedProductAlreadyInShopping}
				onclick={addExistingProduct}
			>
				{selectedProductAlreadyInShopping ? 'Ya est� en Compra' : 'A�adir a Compra'}
			</button>
		</section>
	{:else if normalizedQuery.length > 0}
		{#if matches.length > 0}
			<section class="results">
				<p class="section-label">Productos</p>

				{#each matches as product (product.id)}
					<button class="result" type="button" onclick={() => selectProduct(product.id)}>
						<div>
							<strong>{product.name}</strong>
							<span>
								{getLocationName(product.locationId)} � {getCategoryName(product.categoryId)}
							</span>
						</div>

						<span class="chevron" aria-hidden="true">></span>
					</button>
				{/each}
			</section>
		{/if}

		<section class="new-item">
			<p class="section-label">
				{matches.length > 0 ? 'Otra opci�n' : 'Art�culo nuevo'}
			</p>

			<div class="new-item-name">
				<span>"{query.trim()}"</span>
			</div>

			<button class="option" type="button" onclick={addOneOffItem}>
				<div>
					<strong>Solo esta compra</strong>
					<span>No se guardar� en tu inventario.</span>
				</div>

				<span class="chevron" aria-hidden="true">></span>
			</button>

			<button
				class="option"
				type="button"
				disabled={existingProductWithExactName !== null}
				onclick={saveAsProduct}
			>
				<div>
					<strong>
						{existingProductWithExactName ? 'Este producto ya existe' : 'Guardar como producto'}
					</strong>

					<span>
						{existingProductWithExactName
							? 'Selecciona el producto existente para a�adirlo.'
							: 'Se a�adir� al inventario como No hay.'}
					</span>
				</div>

				<span class="chevron" aria-hidden="true">></span>
			</button>
		</section>
	{:else}
		<p class="hint">
			Escribe para buscar entre los productos de tu hogar o a�adir un art�culo nuevo.
		</p>
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

	.search {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.search input {
		width: 100%;
		min-height: 3rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--line);
		border-radius: 0.6rem;
		background: white;
		font: inherit;
	}

	.search input:focus {
		border-color: var(--accent);
		outline: none;
	}

	.error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.75rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.6rem;
		background: #f8eeee;
		color: #8d3333;
		font-size: 0.85rem;
	}

	.error button {
		flex: 0 0 auto;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.section-label {
		margin: 1.5rem 0 0.5rem;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.result,
	.option {
		display: flex;
		width: 100%;
		min-height: 4rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border: 0;
		border-bottom: 1px solid var(--surface-soft);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.result > div,
	.option > div,
	.selected-product > div {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.2rem;
	}

	.result strong,
	.option strong,
	.selected-product strong {
		font-size: 0.95rem;
	}

	.result span,
	.option div span,
	.selected-product div span {
		color: var(--muted);
		font-size: 0.8rem;
	}

	.result:disabled,
	.option:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.chevron {
		flex: 0 0 auto;
		color: var(--muted);
		font-size: 1.5rem;
	}

	.new-item-name {
		padding: 0.75rem 0;
		font-weight: 600;
	}

	.selected-product {
		display: flex;
		min-height: 4rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--surface-soft);
	}

	.selected-mark {
		display: grid;
		width: 1.75rem;
		height: 1.75rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		background: var(--accent);
		color: white;
		font-size: 0.8rem;
	}

	.already-added {
		margin: 0.75rem 0 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.primary-button {
		width: 100%;
		min-height: 3rem;
		margin-top: 1.5rem;
		border: 0;
		border-radius: 0.65rem;
		background: var(--accent);
		color: white;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-button:disabled {
		background: var(--line);
		color: var(--muted);
		cursor: default;
	}

	.hint {
		margin: 1rem 0 0;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}
</style>

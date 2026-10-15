<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPrototypeState, getLocationById } from '$lib/prototype/state.svelte';
	import {
		changeInventoryStatus,
		addProductToShopping,
		deactivateProduct
	} from '$lib/prototype/state.svelte';
	import type { InventoryStatus } from '$lib/prototype/types';
	import InventoryProduct from '$lib/components/inventory/InventoryProduct.svelte';
	import InventoryProductPanel from '$lib/components/inventory/InventoryProductPanel.svelte';
	import { getCategoryColor } from '$lib/prototype/seed';

	const prototypeState = getPrototypeState();

	let householdName = $derived(prototypeState.householdName);

	let statusFilter = $state<InventoryStatus | 'ALL'>('ALL');
	let categoryFilter = $state('ALL');
	let locationFilter = $state('ALL');

	let filtersOpen = $state(false);
	let selectedProductId = $state<string | null>(null);

	const statusFilters: {
		value: InventoryStatus | 'ALL';
		label: string;
	}[] = [
		{ value: 'ALL', label: 'Todos' },
		{ value: 'AVAILABLE', label: 'Hay' },
		{ value: 'LOW', label: 'Poco' },
		{ value: 'OUT', label: 'No hay' }
	];

	let inventory = $derived(prototypeState.inventory.filter((product) => product.active));
	let categoryFilters = $derived([
		{ id: 'ALL', name: 'Todas' },
		...prototypeState.categories.filter((category) => category.active),
		{ id: 'NONE', name: 'Sin categoría' }
	]);
	let feedback = $state('');
	let selectedProduct = $derived(inventory.find((item) => item.id === selectedProductId));

	let filteredInventory = $derived(
		inventory.filter((item) => {
			const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

			const location = item.locationId ? getLocationById(item.locationId) : null;

			const matchesCategory =
				categoryFilter === 'ALL' ||
				(categoryFilter === 'NONE' ? !item.categoryId : item.categoryId === categoryFilter);

			const matchesLocation =
				locationFilter === 'ALL' ||
				(location && location.name === locationFilter && location.active);

			return matchesStatus && matchesCategory && matchesLocation;
		})
	);

	let activeSecondaryFilters = $derived(locationFilter === 'ALL' ? 0 : 1);

	let hasFilters = $derived(
		statusFilter !== 'ALL' || categoryFilter !== 'ALL' || locationFilter !== 'ALL'
	);

	function handleStatusChange(id: string, status: InventoryStatus) {
		const updated = changeInventoryStatus(id, status);
		if (!updated) feedback = 'No se ha podido actualizar el estado.';
		selectedProductId = null;
	}

	function handleAddToShopping(id: string) {
		feedback = addProductToShopping(id)
			? 'Producto añadido a Compra.'
			: 'El producto ya está en Compra.';
		selectedProductId = null;
	}

	function handleDeactivate(id: string) {
		const product = inventory.find((item) => item.id === id);
		feedback = deactivateProduct(id)
			? `${product?.name ?? 'Producto'} desactivado.`
			: 'No se ha podido desactivar el producto.';
		selectedProductId = null;
	}

	function clearFilters() {
		statusFilter = 'ALL';
		categoryFilter = 'ALL';
		locationFilter = 'ALL';
	}
</script>

<svelte:head>
	<title>Inventario | HomeStock</title>
</svelte:head>

<section class="page inventory">
	<header class="page-header">
		<div>
			<p class="household">{householdName}</p>
			<h1>Inventario</h1>
		</div>

		<a class="add-button" href={resolve('/products/new')} aria-label="Añadir producto">
			<span aria-hidden="true">+</span>
		</a>
	</header>

	{#if feedback}
		<p class="feedback" role="status">{feedback}</p>
	{/if}

	<div class="category-filters" role="group" aria-label="Filtrar por categoría">
		{#each categoryFilters as category (category.id)}
			{@const color = 'color' in category ? getCategoryColor(category.color) : null}
			<button
				type="button"
				class:active={categoryFilter === category.id}
				class:colored={!!color}
				aria-pressed={categoryFilter === category.id}
				style={color ? `--category-tone: ${color.tone}; --category-soft: ${color.soft}` : undefined}
				onclick={() => (categoryFilter = category.id)}
			>
				{#if color}<span class="category-dot" aria-hidden="true"></span>{/if}
				{category.name}
			</button>
		{/each}
	</div>

	<div class="filter-toolbar">
		<div class="status-filters" aria-label="Filtrar por estado">
			{#each statusFilters as filter (filter.value)}
				<button
					type="button"
					class:active={statusFilter === filter.value}
					aria-pressed={statusFilter === filter.value}
					onclick={() => (statusFilter = filter.value)}
				>
					{filter.label}
				</button>
			{/each}
		</div>

		<button
			class="filter-button"
			class:active={activeSecondaryFilters > 0}
			type="button"
			aria-expanded={filtersOpen}
			onclick={() => (filtersOpen = !filtersOpen)}
		>
			Filtros

			{#if activeSecondaryFilters > 0}
				<span>{activeSecondaryFilters}</span>
			{/if}
		</button>
	</div>

	{#if filtersOpen}
		<div class="secondary-filters">
			<label>
				<span>Ubicación</span>

				<select bind:value={locationFilter}>
					<option value="ALL">Todas</option>

					{#each prototypeState.locations.filter((location) => location.active) as location (location.id)}
						<option value={location.name}>
							{location.name}
						</option>
					{/each}
				</select>
			</label>

			{#if activeSecondaryFilters > 0}
				<button
					class="clear-secondary"
					type="button"
					onclick={() => {
						locationFilter = 'ALL';
					}}
				>
					Limpiar ubicación
				</button>
			{/if}
		</div>
	{/if}

	<div class="results-summary">
		<span>
			{filteredInventory.length}
			{filteredInventory.length === 1 ? 'producto' : 'productos'}
		</span>

		{#if hasFilters}
			<button type="button" onclick={clearFilters}> Limpiar filtros </button>
		{/if}
	</div>

	<div class="product-list">
		{#each filteredInventory as item (item.id)}
			<InventoryProduct {item} onOpen={(id) => (selectedProductId = id)} />
		{/each}
	</div>

	{#if inventory.length === 0}
		<div class="empty-state">
			<p>Todavía no tienes productos en el inventario.</p>

			<a class="empty-action" href={resolve('/products/new')}> Añadir producto </a>
		</div>
	{:else if filteredInventory.length === 0}
		<div class="empty-state">
			<p>No hay productos que coincidan con los filtros.</p>

			<button type="button" onclick={clearFilters}> Limpiar filtros </button>
		</div>
	{/if}
</section>

{#if selectedProduct}
	<InventoryProductPanel
		item={selectedProduct}
		alreadyInShopping={prototypeState.shopping.some(
			(item) => item.productId === selectedProduct.id
		)}
		onStatusChange={handleStatusChange}
		onAddToShopping={handleAddToShopping}
		onDeactivate={handleDeactivate}
		onClose={() => (selectedProductId = null)}
	/>
{/if}

<style>
	.category-filters {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1rem;
		padding: 0.2rem 0 0.75rem;
	}
	.category-filters button {
		flex: 0 0 auto;
		min-height: 2.75rem;
		padding: 0.5rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: white;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.category-filters button.active {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 700;
	}
	.category-filters button.colored.active {
		border-color: var(--category-tone);
		background: var(--category-soft);
		color: var(--ink);
	}
	.category-dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		margin-right: 0.35rem;
		border-radius: 50%;
		background: var(--category-tone);
		vertical-align: 0.02rem;
	}
	.feedback {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--surface-soft);
		font-size: 0.85rem;
	}
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
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

	.add-button {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border-radius: 50%;
		background: var(--accent);
		color: white;
		font-size: 1.75rem;
		line-height: 1;
		text-decoration: none;
	}

	.filter-toolbar {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.status-filters {
		display: flex;
		min-width: 0;
		flex: 1;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.status-filters::-webkit-scrollbar {
		display: none;
	}

	.status-filters button,
	.filter-button {
		min-height: 2.25rem;
		flex: 0 0 auto;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: white;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.status-filters button.active,
	.filter-button.active {
		border-color: var(--accent);
		background: var(--accent);
		color: white;
	}

	.filter-button {
		position: relative;
		min-width: 4rem;
	}

	.filter-button span {
		position: absolute;
		top: -0.25rem;
		right: -0.25rem;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		line-height: 1.25rem;
	}

	.secondary-filters {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.25rem;
		padding: 1rem;
		border-radius: 0.6rem;
		background: var(--surface-soft);
	}

	.secondary-filters label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.secondary-filters select {
		min-height: 2.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: white;
		font: inherit;
	}

	.clear-secondary {
		align-self: flex-start;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.clear-secondary:hover {
		background: var(--surface-soft);
	}

	.results-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.results-summary button {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.product-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0 0 1rem;
		color: var(--muted);
	}

	.empty-action,
	.empty-state button {
		display: inline-block;
		min-height: 2.5rem;
		padding: 0.6rem 1.2rem;
		border-radius: 0.6rem;
		background: var(--accent);
		color: white;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}

	.empty-state button {
		border: 0;
		font: inherit;
	}

	.page-header {
		margin-bottom: 1.6rem;
	}
	h1 {
		font-size: 2.1rem;
	}
	.household {
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 0.3rem;
	}
	.add-button {
		width: 3rem;
		height: 3rem;
		border-radius: 1rem;
		box-shadow: 0 4px 12px rgb(36 107 80 / 18%);
	}
	.status-filters {
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 1rem;
		background: #f0f1ef;
	}
	.status-filters button {
		min-height: 2.5rem;
		border: 0;
		background: transparent;
		border-radius: 0.75rem;
		color: var(--muted);
		padding: 0.45rem 0.65rem;
	}
	.status-filters button.active {
		background: white;
		color: var(--accent);
		font-weight: 700;
		box-shadow: var(--shadow);
	}
	.filter-button {
		min-height: 3rem;
		border-radius: 1rem;
	}
	.secondary-filters {
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: white;
		box-shadow: var(--shadow);
	}
	.results-summary {
		margin-top: 1.25rem;
		font-size: 0.8rem;
	}
	.product-list {
		gap: 0.85rem;
	}
	.empty-state {
		border: 1px dashed var(--line);
		border-radius: 1.25rem;
		background: white;
	}
	@media (max-width: 359px) {
		.filter-toolbar {
			flex-wrap: wrap;
		}
		.status-filters {
			flex-basis: 100%;
		}
	}
</style>

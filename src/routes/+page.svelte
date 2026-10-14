<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPrototypeState, getCategoryById, getLocationById } from '$lib/prototype/state.svelte';
	import { changeInventoryStatus, addProductToShopping } from '$lib/prototype/state.svelte';
	import type { InventoryStatus } from '$lib/prototype/types';
	import InventoryProduct from '$lib/components/inventory/InventoryProduct.svelte';

	const prototypeState = getPrototypeState();

	let householdName = $derived(prototypeState.householdName);

	let statusFilter = $state<InventoryStatus | 'ALL'>('ALL');
	let categoryFilter = $state('ALL');
	let locationFilter = $state('ALL');

	let filtersOpen = $state(false);
	let openMenuId = $state<string | null>(null);

	const statusFilters: {
		value: InventoryStatus | 'ALL';
		label: string;
	}[] = [
		{ value: 'ALL', label: 'Todos' },
		{ value: 'AVAILABLE', label: 'Hay' },
		{ value: 'LOW', label: 'Poco' },
		{ value: 'OUT', label: 'No hay' }
	];

	let inventory = $derived(prototypeState.inventory);

	let filteredInventory = $derived(
		inventory.filter((item) => {
			const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

			const category = item.categoryId ? getCategoryById(item.categoryId) : null;
			const location = item.locationId ? getLocationById(item.locationId) : null;

			const matchesCategory =
				categoryFilter === 'ALL' ||
				(category && category.name === categoryFilter && category.active);

			const matchesLocation =
				locationFilter === 'ALL' ||
				(location && location.name === locationFilter && location.active);

			return matchesStatus && matchesCategory && matchesLocation;
		})
	);

	let activeSecondaryFilters = $derived(
		(categoryFilter === 'ALL' ? 0 : 1) + (locationFilter === 'ALL' ? 0 : 1)
	);

	let hasFilters = $derived(
		statusFilter !== 'ALL' || categoryFilter !== 'ALL' || locationFilter !== 'ALL'
	);

	function handleStatusChange(id: string, status: InventoryStatus) {
		changeInventoryStatus(id, status);
	}

	function handleMenuToggle(id: string) {
		openMenuId = openMenuId === id ? null : id;
	}

	function handleAddToShopping(id: string) {
		addProductToShopping(id);
		openMenuId = null;
	}

	function handleDeactivate(id: string) {
		console.log('Desactivar producto', id);
		openMenuId = null;
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
				<span>Categoría</span>

				<select bind:value={categoryFilter}>
					<option value="ALL">Todas</option>

					{#each prototypeState.categories.filter((category) => category.active) as category (category.id)}
						<option value={category.name}>
							{category.name}
						</option>
					{/each}
				</select>
			</label>

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
						categoryFilter = 'ALL';
						locationFilter = 'ALL';
					}}
				>
					Limpiar categoría y ubicación
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
			<InventoryProduct
				{item}
				isMenuOpen={openMenuId === item.id}
				onStatusChange={handleStatusChange}
				onMenuToggle={handleMenuToggle}
				onAddToShopping={handleAddToShopping}
				onDeactivate={handleDeactivate}
			/>
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

<style>
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
		background: #e9eee7;
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

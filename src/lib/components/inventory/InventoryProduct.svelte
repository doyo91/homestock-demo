<script lang="ts">
	import { resolve } from '$app/paths';
	import type { InventoryStatus } from '$lib/prototype/types';
	import type { PrototypeInventoryItem } from '$lib/prototype/seed';
	import { getCategoryById, getLocationById } from '$lib/prototype/state.svelte';

	interface Props {
		item: PrototypeInventoryItem;
		isMenuOpen: boolean;
		onStatusChange: (id: string, status: InventoryStatus) => void;
		onMenuToggle: (id: string) => void;
		onAddToShopping: (id: string) => void;
		onDeactivate: (id: string) => void;
	}

	let { item, isMenuOpen, onStatusChange, onMenuToggle, onAddToShopping, onDeactivate }: Props =
		$props();

	const statuses: {
		value: InventoryStatus;
		label: string;
		shortLabel: string;
	}[] = [
		{ value: 'AVAILABLE', label: 'Hay', shortLabel: 'Hay' },
		{ value: 'LOW', label: 'Queda poco', shortLabel: 'Poco' },
		{ value: 'OUT', label: 'No hay', shortLabel: 'No hay' }
	];

	function statusLabel(status: InventoryStatus) {
		return statuses.find((s) => s.value === status)?.label ?? status;
	}

	let categoryName = $derived(() => {
		if (!item.categoryId) return 'Sin categoría';
		const category = getCategoryById(item.categoryId);
		return category?.name ?? 'Sin categoría';
	});

	let locationName = $derived(() => {
		if (!item.locationId) return 'Sin ubicación';
		const location = getLocationById(item.locationId);
		return location?.name ?? 'Sin ubicación';
	});
</script>

<article class="product">
	<div class="product-header">
		<div class="product-info">
			<h2>{item.name}</h2>
			<p>{locationName()} · {categoryName()}</p>
		</div>

		<div class="product-actions">
			<div
				class="current-status"
				class:low={item.status === 'LOW'}
				class:out={item.status === 'OUT'}
			>
				<span class="status-dot" aria-hidden="true"></span>
				{statusLabel(item.status)}
			</div>

			<button
				class="menu-button"
				type="button"
				aria-label={`Acciones de ${item.name}`}
				aria-expanded={isMenuOpen}
				onclick={() => onMenuToggle(item.id)}
			>
				⋯
			</button>

			{#if isMenuOpen}
				<div class="menu">
					<button type="button" onclick={() => onAddToShopping(item.id)}> Añadir a compra </button>

					<a
						href={resolve('/products/[id]/edit', {
							id: item.id
						})}
					>
						Editar
					</a>

					<button class="danger" type="button" onclick={() => onDeactivate(item.id)}>
						Desactivar
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="status-selector" aria-label={`Estado de ${item.name}`}>
		{#each statuses as status (status.value)}
			<button
				type="button"
				class:active={item.status === status.value}
				aria-pressed={item.status === status.value}
				onclick={() => onStatusChange(item.id, status.value)}
			>
				{status.shortLabel}
			</button>
		{/each}
	</div>
</article>

<style>
	.product {
		margin-bottom: 1rem;
		padding: 1rem;
		border-radius: 0.6rem;
		background: white;
	}

	.product-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.product-info h2 {
		margin: 0 0 0.15rem;
		font-size: 1rem;
		font-weight: 600;
	}

	.product-info p {
		margin: 0;
		color: #777;
		font-size: 0.8rem;
	}

	.product-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.current-status {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.6rem;
		border-radius: 999px;
		background: #f3f3f3;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.current-status.low {
		background: #fff8e6;
		color: #b38b00;
	}

	.current-status.out {
		background: #ffe6e6;
		color: #c00;
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: currentColor;
	}

	.menu-button {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: #666;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.menu-button:hover {
		background: #f3f3f3;
	}

	.menu {
		position: absolute;
		right: 0;
		z-index: 10;
		min-width: 10rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.menu button,
	.menu a {
		display: block;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: 0.35rem;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.menu button:hover,
	.menu a:hover {
		background: #f3f3f3;
	}

	.menu button.danger {
		color: #c00;
	}

	.menu button.danger:hover {
		background: #ffe6e6;
	}

	.status-selector {
		display: flex;
		gap: 0.35rem;
	}

	.status-selector button {
		flex: 1;
		min-height: 2.25rem;
		padding: 0 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.4rem;
		background: white;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.status-selector button.active {
		border-color: #111;
		background: #111;
		color: white;
	}

	.status-selector button:first-child {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.status-selector button:last-child {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.status-selector button:not(:first-child):not(:last-child) {
		border-radius: 0;
	}
</style>

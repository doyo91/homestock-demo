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
			<h2>
				{item.name}
				{#if item.replenishmentMode === 'AUTOMATIC'}
					<span
						class="automatic"
						role="img"
						aria-label="Reposición automática"
						title="Reposición automática al pasar a No hay"
					>
						<svg
							viewBox="0 0 24 24"
							width="16"
							height="16"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							aria-hidden="true"
						>
							<path d="M20 7a9 9 0 0 0-15-2L3 7m0-5v5h5M4 17a9 9 0 0 0 15 2l2-2m0 5v-5h-5" />
						</svg>
					</span>
				{/if}
			</h2>
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
	.automatic {
		display: inline-flex;
		vertical-align: middle;
		margin-left: 0.25rem;
		color: var(--muted);
	}
	.product-info h2 {
		overflow-wrap: anywhere;
	}
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
		color: var(--muted);
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
		background: var(--surface-soft);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.current-status.low {
		background: var(--warning-soft);
		color: var(--warning);
	}

	.current-status.out {
		background: var(--danger-soft);
		color: var(--danger);
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
		color: var(--muted);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.menu-button:hover {
		background: var(--surface-soft);
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
		background: var(--surface-soft);
	}

	.menu button.danger {
		color: var(--danger);
	}

	.menu button.danger:hover {
		background: var(--danger-soft);
	}

	.status-selector {
		display: flex;
		gap: 0.35rem;
	}

	.status-selector button {
		flex: 1;
		min-height: 2.25rem;
		padding: 0 0.5rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: white;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.status-selector button.active {
		border-color: var(--accent);
		background: var(--accent);
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

	.product {
		margin-bottom: 0;
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		padding: 1.1rem;
		box-shadow: var(--shadow);
	}
	.product-info {
		min-width: 0;
		flex: 1;
	}
	.product-info h2 {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.product-info p {
		line-height: 1.5;
	}
	.product-actions {
		position: relative;
		gap: 0.2rem;
	}
	.current-status {
		background: var(--accent-soft);
		color: var(--accent);
		padding: 0.3rem 0.55rem;
		white-space: nowrap;
	}
	.menu-button {
		width: 2.75rem;
		height: 2.75rem;
	}
	.menu {
		top: 2.8rem;
		border: 1px solid var(--line);
		border-radius: 0.9rem;
		box-shadow: 0 8px 28px rgb(36 59 52 / 15%);
	}
	.menu button,
	.menu a {
		min-height: 2.75rem;
		font-size: 0.85rem;
	}
	.status-selector {
		gap: 0.3rem;
		padding: 0.25rem;
		border-radius: 0.85rem;
		background: var(--surface-soft);
	}
	.status-selector button {
		min-height: 2.75rem;
		border: 0;
		background: transparent;
		color: var(--muted);
		border-radius: 0.65rem;
	}
	.status-selector button:first-child,
	.status-selector button:last-child,
	.status-selector button:not(:first-child):not(:last-child) {
		border-radius: 0.65rem;
	}
	.status-selector button.active {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 700;
		box-shadow: 0 1px 3px rgb(36 59 52 / 8%);
	}
	.status-selector button:nth-child(2).active {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.status-selector button:nth-child(3).active {
		background: var(--danger-soft);
		color: var(--danger);
	}
	@media (max-width: 380px) {
		.product-header {
			flex-wrap: wrap;
		}
		.product-info {
			flex-basis: 100%;
		}
		.product-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>

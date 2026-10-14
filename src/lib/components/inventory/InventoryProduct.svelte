<script lang="ts">
	import type { PrototypeInventoryItem } from '$lib/prototype/seed';
	import { getCategoryById, getLocationById } from '$lib/prototype/state.svelte';

	let {
		item,
		onOpen
	}: {
		item: PrototypeInventoryItem;
		onOpen: (id: string) => void;
	} = $props();

	let categoryName = $derived(
		item.categoryId ? (getCategoryById(item.categoryId)?.name ?? 'Sin categoría') : 'Sin categoría'
	);
	let locationName = $derived(
		item.locationId ? (getLocationById(item.locationId)?.name ?? 'Sin ubicación') : 'Sin ubicación'
	);
	let statusLabel = $derived(
		item.status === 'AVAILABLE' ? 'Hay' : item.status === 'LOW' ? 'Poco' : 'No hay'
	);
</script>

<article class="product">
	<button
		class="product-button"
		type="button"
		aria-haspopup="dialog"
		aria-label={`Gestionar ${item.name}, ${statusLabel}`}
		onclick={() => onOpen(item.id)}
	>
		<span class="product-info">
			<span class="product-name"
				>{item.name}
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
			</span>
			<span class="product-meta">{locationName} · {categoryName}</span>
		</span>
		<span
			class="current-status"
			class:low={item.status === 'LOW'}
			class:out={item.status === 'OUT'}
		>
			<span class="status-dot" aria-hidden="true"></span>{statusLabel}
		</span>
		<span class="chevron" aria-hidden="true">›</span>
	</button>
</article>

<style>
	.product {
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: white;
		box-shadow: var(--shadow);
	}
	.product-button {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		min-height: 4.5rem;
		padding: 0.85rem 1rem;
		border: 0;
		border-radius: inherit;
		background: transparent;
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.product-button:hover {
		background: var(--surface-soft);
	}
	.product-button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.product-info {
		min-width: 0;
		flex: 1;
	}
	.product-name {
		display: block;
		font-weight: 700;
		font-size: 1rem;
		overflow-wrap: anywhere;
	}
	.product-meta {
		display: block;
		margin-top: 0.15rem;
		color: var(--muted);
		font-size: 0.8rem;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}
	.automatic {
		display: inline-flex;
		vertical-align: middle;
		margin-left: 0.25rem;
		color: var(--muted);
	}
	.current-status {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.5rem;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
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
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: currentColor;
	}
	.chevron {
		color: var(--muted);
		font-size: 1.3rem;
	}
</style>

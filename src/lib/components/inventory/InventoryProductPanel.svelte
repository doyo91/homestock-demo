<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PrototypeInventoryItem } from '$lib/prototype/seed';
	import type { InventoryStatus } from '$lib/prototype/types';

	let {
		item,
		alreadyInShopping,
		onStatusChange,
		onAddToShopping,
		onDeactivate,
		onClose
	}: {
		item: PrototypeInventoryItem;
		alreadyInShopping: boolean;
		onStatusChange: (id: string, status: InventoryStatus) => void;
		onAddToShopping: (id: string) => void;
		onDeactivate: (id: string) => void;
		onClose: () => void;
	} = $props();
	let dialog: HTMLDialogElement;
	const statuses: { value: InventoryStatus; label: string }[] = [
		{ value: 'AVAILABLE', label: 'Hay' },
		{ value: 'LOW', label: 'Poco' },
		{ value: 'OUT', label: 'No hay' }
	];

	onMount(() => {
		const previousOverflow = document.body.style.overflow;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
		return () => {
			dialog.close();
			document.body.style.overflow = previousOverflow;
		};
	});

	function closeOnBackdrop(event: MouseEvent) {
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		if (
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom
		)
			onClose();
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="product-panel-title"
	onclick={closeOnBackdrop}
	oncancel={(event) => {
		event.preventDefault();
		onClose();
	}}
>
	<header>
		<div>
			<h2 id="product-panel-title">{item.name}</h2>
			{#if item.replenishmentMode === 'AUTOMATIC'}
				<p>Reposición automática al pasar a No hay</p>
			{/if}
		</div>
		<button class="close" type="button" aria-label="Cerrar panel" onclick={onClose}>×</button>
	</header>

	<p class="label">Estado del inventario</p>
	<div class="status-selector" role="group" aria-label="Estado del inventario">
		{#each statuses as status (status.value)}
			<button
				type="button"
				class:active={item.status === status.value}
				class:low={status.value === 'LOW'}
				class:out={status.value === 'OUT'}
				aria-pressed={item.status === status.value}
				onclick={() => onStatusChange(item.id, status.value)}
			>
				{status.label}
			</button>
		{/each}
	</div>

	<div class="actions">
		<button type="button" disabled={alreadyInShopping} onclick={() => onAddToShopping(item.id)}>
			{alreadyInShopping ? 'Ya está en Compra' : 'Añadir a compra'}
		</button>
		<a href={resolve('/products/[id]/edit', { id: item.id })}>Editar producto</a>
	</div>
	<div class="deactivate">
		<button type="button" onclick={() => onDeactivate(item.id)}>Desactivar producto</button>
	</div>
</dialog>

<style>
	dialog {
		position: fixed;
		inset: auto 0 0;
		width: min(100%, 32rem);
		max-width: 100%;
		max-height: 85dvh;
		margin: 0 auto;
		padding: 1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom));
		box-sizing: border-box;
		overflow-y: auto;
		border: 1px solid var(--line);
		border-radius: 1.5rem 1.5rem 0 0;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 -8px 32px rgb(0 0 0 / 15%);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
		overflow-wrap: anywhere;
	}
	header p {
		margin: 0.4rem 0 0;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--muted);
	}
	button,
	a {
		font: inherit;
	}
	button {
		cursor: pointer;
	}
	.close {
		flex-shrink: 0;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: var(--surface-soft);
		color: var(--muted);
		font-size: 1.5rem;
	}
	.label {
		margin: 1.25rem 0 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.status-selector {
		display: flex;
		gap: 0.35rem;
		padding: 0.3rem;
		border-radius: 0.85rem;
		background: var(--surface-soft);
	}
	.status-selector button {
		flex: 1;
		min-height: 2.75rem;
		padding: 0.5rem;
		border: 0;
		border-radius: 0.65rem;
		background: transparent;
		color: var(--muted);
	}
	.status-selector button.active {
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}
	.status-selector button.low.active {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.status-selector button.out.active {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.actions {
		display: grid;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
	.actions button,
	.actions a {
		display: block;
		min-height: 2.75rem;
		box-sizing: border-box;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface);
		color: var(--ink);
		text-align: center;
		text-decoration: none;
	}
	.actions button:disabled {
		color: var(--muted);
		background: var(--surface-soft);
		cursor: default;
	}
	.deactivate {
		margin-top: 1.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
	}
	.deactivate button {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.75rem;
		border: 0;
		border-radius: 0.75rem;
		background: transparent;
		color: var(--danger);
	}
	.deactivate button:hover {
		background: var(--danger-soft);
	}
	@media (min-width: 640px) {
		dialog {
			inset: 0;
			margin: auto;
			border-radius: 1.5rem;
		}
	}
</style>

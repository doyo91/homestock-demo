<script lang="ts">
	import StatusInput from '../StatusInput.svelte';
	import { changeInventoryStatus, getPendingInventoryPurchase } from '$lib/prototype/state.svelte';
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PrototypeInventoryItem } from '$lib/prototype/seed';
	import QuantityInput from '../QuantityInput.svelte';
	import { validQuantity, statusLabel } from '$lib/prototype/quantities';

	let {
		item,
		alreadyInShopping,
		onQuantityChange,
		onAddToShopping,
		onDelete,
		onClose
	}: {
		item: PrototypeInventoryItem;
		alreadyInShopping: boolean;
		onQuantityChange: (id: string, quantity: number) => void;
		onAddToShopping: (id: string, existing: number) => void;
		onDelete: (id: string) => void;
		onClose: () => void;
	} = $props();
	let pendingPurchase = $derived(getPendingInventoryPurchase(item.id));
	let dialog: HTMLDialogElement;
	let cancelDeleteButton = $state<HTMLButtonElement>();
	let confirmingDelete = $state(false);
	let deleting = $derived(confirmingDelete || !item.active);

	async function requestDelete() {
		confirmingDelete = true;
		await tick();
		cancelDeleteButton?.focus();
	}
	function initialQuantity() {
		return item.quantity;
	}
	let quantity = $state(initialQuantity());
	function initialStatus() {
		return item.status;
	}
	let status = $state(initialStatus());

	onMount(() => {
		const previousOverflow = document.body.style.overflow;
		dialog.showModal();
		if (!item.active) cancelDeleteButton?.focus();
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
	role={deleting ? 'alertdialog' : 'dialog'}
	aria-labelledby="product-panel-title"
	aria-describedby={deleting
		? `delete-description${alreadyInShopping ? ' delete-impact' : ''}`
		: undefined}
	onclick={closeOnBackdrop}
	oncancel={(event) => {
		event.preventDefault();
		onClose();
	}}
>
	<header>
		<div>
			<h2 id="product-panel-title">{deleting ? `¿Eliminar ${item.name}?` : item.name}</h2>
			{#if !deleting && item.replenishmentMode === 'AUTOMATIC'}
				<p>
					{item.trackingMode === 'STATUS'
						? 'Reposición automática cuando quede Poco o No hay'
						: `Reposición automática cuando queden ${item.lowThreshold} o menos`}
				</p>
			{/if}
		</div>
		<button class="close" type="button" aria-label="Cerrar panel" onclick={onClose}>×</button>
	</header>

	{#if deleting}
		<div class="delete-confirmation">
			<p id="delete-description">
				Se eliminará del inventario y de Sugerencias. Esta acción no se puede deshacer.
			</p>
			{#if alreadyInShopping}
				<p id="delete-impact" class="delete-impact">
					También se eliminarán sus elementos de Compra, tanto pendientes como marcados como
					comprados.
				</p>
			{/if}
			<div class="confirmation-actions">
				<button bind:this={cancelDeleteButton} type="button" onclick={onClose}>Cancelar</button>
				<button class="confirm-delete" type="button" onclick={() => onDelete(item.id)}
					>Eliminar definitivamente</button
				>
			</div>
		</div>
	{:else}
		{#if item.trackingMode === 'STATUS'}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					if (changeInventoryStatus(item.id, status)) onClose();
				}}
			>
				<StatusInput bind:value={status} />
				<button class="save-quantity" type="submit">Guardar estado</button>
			</form>
		{:else if pendingPurchase}
			<p class="review">
				Este recuento todavía no incluye la compra. Confirma cuánto tienes ahora para actualizarlo.
			</p>
			<a class="pending-link" href={resolve(`/shopping#inventory-update-${pendingPurchase.id}`)}
				>Actualizar compra pendiente</a
			>
		{:else}
			{#if item.quantityNeedsReview}<p class="review">
					Cantidad inicial provisional: revisa cuánto queda realmente y guárdalo.
				</p>{/if}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					if (validQuantity(quantity)) onQuantityChange(item.id, quantity);
				}}
			>
				<QuantityInput label="Quedan en casa" bind:value={quantity} />
				<p class="label" aria-live="polite">
					Estado: {validQuantity(quantity)
						? statusLabel(quantity, item.lowThreshold)
						: 'Revisa la cantidad'}
				</p>
				<button class="save-quantity" type="submit" disabled={!validQuantity(quantity)}
					>Guardar cantidad</button
				>
			</form>
		{/if}
		<div class="actions">
			<button
				type="button"
				disabled={alreadyInShopping || !validQuantity(quantity)}
				onclick={() => onAddToShopping(item.id, quantity)}
			>
				{pendingPurchase
					? 'Compra pendiente de incorporar'
					: alreadyInShopping
						? 'Ya está en Compra'
						: 'Añadir a compra'}
			</button>
			<a href={resolve('/products/[id]/edit', { id: item.id })}>Editar producto</a>
		</div>
		<div class="delete-action">
			<button type="button" onclick={requestDelete}>Eliminar producto</button>
		</div>
	{/if}
</dialog>

<style>
	.pending-link {
		display: block;
		padding: 0.75rem;
		min-height: 2.75rem;
		border-radius: 0.75rem;
		background: var(--accent-soft);
		color: var(--accent);
		text-align: center;
		text-decoration: none;
	}
	.review {
		padding: 0.85rem;
		color: var(--warning);
		background: var(--warning-soft);
		border-radius: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.save-quantity {
		width: 100%;
		min-height: 3rem;
		margin-top: 1rem;
		padding: 0.75rem;
		border: 0;
		border-radius: 0.75rem;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
	}
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
	.delete-action {
		margin-top: 1.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
	}
	.delete-action button {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.75rem;
		border: 0;
		border-radius: 0.75rem;
		background: transparent;
		color: var(--danger);
	}
	.delete-action button:hover {
		background: var(--danger-soft);
	}
	.delete-confirmation p {
		margin: 1rem 0;
		color: var(--muted);
		line-height: 1.6;
	}
	.delete-confirmation .delete-impact {
		padding: 0.85rem;
		border-radius: 0.75rem;
		background: var(--danger-soft);
		color: var(--danger);
	}
	.confirmation-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	.confirmation-actions button {
		flex: 1 1 10rem;
		min-height: 2.75rem;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-soft);
		color: var(--ink);
	}
	.confirmation-actions .confirm-delete {
		border-color: var(--danger);
		background: var(--danger);
		color: var(--on-accent);
	}

	@media (min-width: 640px) {
		dialog {
			inset: 0;
			margin: auto;
			border-radius: 1.5rem;
		}
	}
</style>

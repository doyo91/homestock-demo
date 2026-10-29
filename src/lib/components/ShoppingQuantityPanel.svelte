<script lang="ts">
	import ActionSheet from './ActionSheet.svelte';
	import QuantityInput from './QuantityInput.svelte';
	import { validQuantity } from '$lib/prototype/quantities';
	import { addProductToShopping, updateShoppingReminder } from '$lib/prototype/state.svelte';
	import type { PrototypeInventoryItem, PrototypeShoppingItem } from '$lib/prototype/seed';
	let {
		product,
		item,
		initialExisting,
		editOnly = false,
		onClose,
		onSaved
	}: {
		product?: PrototypeInventoryItem;
		item?: PrototypeShoppingItem;
		initialExisting?: number;
		editOnly?: boolean;
		onClose: () => void;
		onSaved: () => void;
	} = $props();
	function initialQuantity() {
		return item?.quantity ?? 1;
	}
	function initialStock() {
		return initialExisting ?? product?.quantity ?? 0;
	}
	function initialNote() {
		return item?.note ?? '';
	}
	function initialUnit() {
		return item?.quantityUnit ?? 'UNITS';
	}
	let quantity = $state(initialQuantity());
	let existing = $state(initialStock());
	let note = $state(initialNote());
	let quantityUnit = $state(initialUnit());
	let quantitative = $derived(product?.trackingMode === 'QUANTITY');
	let valid = $derived(
		validQuantity(quantity, 1) && (editOnly || !quantitative || validQuantity(existing))
	);
	let error = $state('');
	function confirm() {
		if (!valid) return;
		let saved = false;
		if (item && editOnly) saved = updateShoppingReminder(item.id, quantity, note, quantityUnit);
		else if (product)
			saved = addProductToShopping(
				product.id,
				quantity,
				quantitative ? existing : undefined,
				note,
				quantityUnit
			);
		if (saved) onSaved();
		else
			error =
				'No se ha podido guardar. Revisa las cantidades y si el producto ya está en Compra o pendiente de incorporar.';
	}
</script>

<ActionSheet
	title={`${editOnly ? 'Editar' : 'Añadir'} ${product?.name ?? item?.name ?? ''}`}
	{onClose}
>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			confirm();
		}}
	>
		{#if (quantitative && product?.packSize) || item?.quantityUnit === 'PACKS'}
			<label class="field"
				>Cantidad a comprar en<select bind:value={quantityUnit}
					><option value="UNITS">Unidades</option><option value="PACKS">Packs</option></select
				></label
			>
		{/if}
		<QuantityInput
			label={quantityUnit === 'PACKS' ? 'Número de packs' : 'Cantidad a comprar'}
			bind:value={quantity}
			min={1}
		/>
		{#if quantityUnit === 'PACKS'}<p>
				El contenido del pack se confirmará al actualizar el inventario.
			</p>{/if}
		{#if quantitative && !editOnly}
			<QuantityInput label="Quedan en casa" bind:value={existing} />
			<p>
				Se guardará este recuento. Lo comprado se incorporará cuando actualices el inventario, ahora
				o después de finalizar la compra.
			</p>
		{/if}
		<label class="field"
			>Nota opcional<input
				type="text"
				bind:value={note}
				placeholder="Ej. packs de 12, botella grande"
			/></label
		>
		{#if error}<p class="notice" role="alert">{error}</p>{/if}
		<button type="submit" disabled={!valid}>{editOnly ? 'Guardar' : 'Añadir a Compra'}</button>
	</form>
</ActionSheet>

<style>
	.field {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
		font-size: 0.875rem;
	}
	input,
	select {
		min-height: 2.75rem;
		padding: 0.6rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-soft);
		color: var(--ink);
		font: inherit;
	}
	p {
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.notice {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--warning-soft);
		color: var(--warning);
	}
	button {
		width: 100%;
		min-height: 3rem;
		margin-top: 1rem;
		border: 0;
		border-radius: 0.75rem;
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>

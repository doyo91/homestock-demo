<script lang="ts">
	import ActionSheet from './ActionSheet.svelte';
	import QuantityInput from './QuantityInput.svelte';
	import { validQuantity } from '$lib/prototype/quantities';
	import { addProductToShopping, purchaseShoppingItem } from '$lib/prototype/state.svelte';
	import type { PrototypeInventoryItem, PrototypeShoppingItem } from '$lib/prototype/seed';
	let {
		product,
		item,
		initialExisting,
		onClose,
		onSaved
	}: {
		product?: PrototypeInventoryItem;
		item?: PrototypeShoppingItem;
		initialExisting?: number;
		onClose: () => void;
		onSaved: () => void;
	} = $props();
	function initialQuantity() {
		return item?.quantity ?? 1;
	}
	function initialStock() {
		return initialExisting ?? product?.quantity ?? 0;
	}
	let quantity = $state(initialQuantity());
	let existing = $state(initialStock());
	let discount = $state(false);
	let error = $state('');
	let purchase = $derived(!!item);
	let current = $derived(
		!purchase || product?.quantityNeedsReview ? existing : (product?.quantity ?? 0)
	);
	let total = $derived(current + quantity - (discount && current > 0 ? 1 : 0));
	let valid = $derived(
		validQuantity(quantity, 1) &&
			(!product || (validQuantity(current) && (!purchase || validQuantity(total))))
	);
	function confirm() {
		if (!valid) return;
		const saved = item
			? purchaseShoppingItem(
					item.id,
					quantity,
					discount && current > 0,
					product?.quantityNeedsReview ? existing : undefined
				)
			: product
				? addProductToShopping(product.id, quantity, existing)
				: false;
		if (saved) onSaved();
		else
			error = 'No se ha podido guardar. Revisa las cantidades y si el producto ya está en Compra.';
	}
</script>

<ActionSheet
	title={`${purchase ? 'Comprar' : 'Añadir'} ${product?.name ?? item?.name ?? ''}`}
	{onClose}
>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			confirm();
		}}
	>
		<QuantityInput
			label={purchase ? 'Cantidad comprada' : 'Cantidad a comprar'}
			bind:value={quantity}
			min={1}
		/>
		{#if product && (!purchase || product.quantityNeedsReview)}
			{#if product.quantityNeedsReview}<p class="notice">
					El recuento anterior no se conocía. Revisa cuánto queda en casa antes de continuar.
				</p>{/if}
			<QuantityInput label="Quedan en casa" bind:value={existing} />
			{#if !purchase}<p>
					Esta cantidad se guardará en inventario. Lo que vas a comprar se sumará cuando confirmes
					la compra.
				</p>{/if}
		{/if}
		{#if purchase && product}
			{#if current > 0}
				<label class="discount"
					><input type="checkbox" bind:checked={discount} /><span
						>Dejar de contar una de las que tenía<small
							>Por ejemplo, porque está casi terminada.</small
						></span
					></label
				>
			{/if}
			<p class="total" aria-live="polite">
				Total en casa: <strong>{valid ? total : '—'}</strong><small
					>Tenías {current ?? '—'} · Compras {quantity ?? '—'}{discount && current > 0
						? ' · Descuentas 1'
						: ''}</small
				>
			</p>
		{/if}
		{#if error}<p class="notice" role="alert">{error}</p>{/if}
		<button class="primary" type="submit" disabled={!valid}
			>{purchase ? 'Confirmar compra' : 'Añadir a Compra'}</button
		>
	</form>
</ActionSheet>

<style>
	p {
		color: var(--muted);
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.notice {
		padding: 0.85rem;
		border-radius: 0.75rem;
		background: var(--warning-soft);
		color: var(--warning);
	}
	.discount {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		margin: 1.25rem 0;
		font-size: 0.9rem;
	}
	.discount input {
		margin-top: 0.2rem;
	}
	small {
		display: block;
		margin-top: 0.3rem;
		color: var(--muted);
		font-size: 0.8rem;
	}
	.total {
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 0.85rem;
		background: var(--surface-soft);
		color: var(--ink);
	}
	.total strong {
		font-size: 1.3rem;
	}
	.primary {
		width: 100%;
		min-height: 3rem;
		padding: 0.75rem;
		border: 0;
		border-radius: 0.85rem;
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>

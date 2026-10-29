<script lang="ts">
	import ActionSheet from './ActionSheet.svelte';
	import QuantityInput from './QuantityInput.svelte';
	import { validQuantity } from '$lib/prototype/quantities';
	import {
		addProductToShopping,
		purchaseShoppingItem,
		updateShoppingReminder
	} from '$lib/prototype/state.svelte';
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
		return !editOnly && item && product?.packSize
			? Math.max(1, Math.ceil(item.quantity / product.packSize))
			: (item?.quantity ?? 1);
	}
	function initialStock() {
		return initialExisting ?? product?.quantity ?? 0;
	}
	let quantity = $state(initialQuantity());
	function initialNote() {
		return item?.note ?? '';
	}
	let note = $state(initialNote());
	let quantitative = $derived(product && product.trackingMode !== 'STATUS');
	function initialPackSize() {
		return product?.packSize ?? 1;
	}
	function initiallyUsesPacks() {
		return !editOnly && !!item && !!product?.packSize;
	}
	let packSize = $state(initialPackSize());
	let usePacks = $state(initiallyUsesPacks());
	let bought = $derived(usePacks ? quantity * packSize : quantity);
	let existing = $state(initialStock());
	let discount = $state(false);
	let error = $state('');
	let purchase = $derived(!!item && !editOnly);
	let current = $derived(
		!purchase || product?.quantityNeedsReview ? existing : (product?.quantity ?? 0)
	);
	let total = $derived(current + bought - (discount && current > 0 ? 1 : 0));
	let valid = $derived(
		validQuantity(quantity, 1) &&
			validQuantity(bought, 1) &&
			(!usePacks || validQuantity(packSize, 1)) &&
			(!quantitative || (validQuantity(current) && (!purchase || validQuantity(total))))
	);
	function confirm() {
		if (!valid) return;
		const saved =
			item && editOnly
				? updateShoppingReminder(item.id, quantity, note)
				: item
					? purchaseShoppingItem(
							item.id,
							quantity,
							!!quantitative && discount && current > 0,
							quantitative && product?.quantityNeedsReview ? existing : undefined,
							usePacks ? packSize : undefined
						)
					: product
						? addProductToShopping(product.id, quantity, quantitative ? existing : undefined, note)
						: false;
		if (saved) onSaved();
		else
			error = 'No se ha podido guardar. Revisa las cantidades y si el producto ya está en Compra.';
	}
</script>

<ActionSheet
	title={`${editOnly ? 'Editar' : purchase ? 'Comprar' : 'Añadir'} ${product?.name ?? item?.name ?? ''}`}
	{onClose}
>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			confirm();
		}}
	>
		<QuantityInput
			label={usePacks
				? 'Número de packs'
				: purchase
					? 'Cantidad comprada'
					: quantitative
						? 'Cantidad a comprar (unidades)'
						: 'Cantidad a comprar'}
			bind:value={quantity}
			min={1}
		/>
		{#if purchase && quantitative && product?.packSize}
			{#if usePacks}
				<QuantityInput label="Unidades por pack" bind:value={packSize} min={1} />
			{/if}
			<p aria-live="polite">
				Añadirás <strong>{valid ? bought : '—'} unidades</strong> al inventario.
			</p>
			<label class="discount"
				><input
					type="checkbox"
					checked={!usePacks}
					onchange={(event) => {
						usePacks = !event.currentTarget.checked;
						quantity = 1;
					}}
				/><span
					>Introducir el total de unidades<small>Útil si compras packs de distintos tamaños.</small
					></span
				></label
			>
		{:else if quantitative && product?.packSize}
			<p>
				Indica el total de unidades que necesitas. Al comprar podrás indicar cuántos packs llevas y
				su tamaño.
			</p>
		{/if}
		{#if quantitative && product && !editOnly && (!purchase || product.quantityNeedsReview)}
			{#if product.quantityNeedsReview}<p class="notice">
					El recuento anterior no se conocía. Revisa cuánto queda en casa antes de continuar.
				</p>{/if}
			<QuantityInput label="Quedan en casa" bind:value={existing} />
			{#if !purchase}<p>
					Esta cantidad se guardará en inventario. Lo que vas a comprar se sumará cuando confirmes
					la compra.
				</p>{/if}
		{/if}
		{#if purchase && quantitative && product}
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
					>Tenías {current ?? '—'} · Compras {bought ?? '—'} unidades{discount && current > 0
						? ' · Descuentas 1'
						: ''}</small
				>
			</p>
		{/if}

		{#if !purchase}
			<label class="note"
				>Nota opcional<input
					type="text"
					bind:value={note}
					placeholder="Ej. packs de 12, botella grande"
				/></label
			>
		{/if}
		{#if error}<p class="notice" role="alert">{error}</p>{/if}
		<button class="primary" type="submit" disabled={!valid}
			>{editOnly ? 'Guardar' : purchase ? 'Confirmar compra' : 'Añadir a Compra'}</button
		>
	</form>
</ActionSheet>

<style>
	.note {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
		font-size: 0.875rem;
	}
	.note input {
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

<script lang="ts">
	import ActionSheet from './ActionSheet.svelte';
	import QuantityInput from './QuantityInput.svelte';
	import { validQuantity } from '$lib/prototype/quantities';
	import { regularizeShoppingItem } from '$lib/prototype/state.svelte';
	import type { PrototypeInventoryItem, PrototypeShoppingItem } from '$lib/prototype/seed';
	let {
		item,
		product,
		onClose,
		onSaved
	}: {
		item: PrototypeShoppingItem;
		product: PrototypeInventoryItem;
		onClose: () => void;
		onSaved: () => void;
	} = $props();
	function initialQuantity() {
		return item.quantity;
	}
	function initialUnit() {
		return item.quantityUnit ?? 'UNITS';
	}
	function initialPackSize() {
		return product.packSize ?? 1;
	}
	let quantity = $state(initialQuantity());
	let quantityUnit = $state(initialUnit());
	let packSize = $state(initialPackSize());
	let bought = $derived(quantity * (quantityUnit === 'PACKS' ? packSize : 1));
	let expected = $derived(product.quantity + bought);
	// The user can override the suggestion with the actual count, including zero.
	let finalQuantity = $derived(expected);
	let error = $state('');
	let valid = $derived(
		validQuantity(quantity, 1) &&
			validQuantity(bought, 1) &&
			validQuantity(finalQuantity) &&
			(quantityUnit !== 'PACKS' || validQuantity(packSize, 1))
	);
	function confirm() {
		if (!valid) return;
		if (
			regularizeShoppingItem(
				item.id,
				finalQuantity,
				quantity,
				quantityUnit === 'PACKS' ? packSize : undefined
			)
		)
			onSaved();
		else
			error =
				'No se ha podido actualizar. Revisa las cantidades y si la compra sigue pendiente de incorporar.';
	}
</script>

<ActionSheet title={`Actualizar ${product.name}`} {onClose}>
	<form
		onsubmit={(event) => {
			event.preventDefault();
			confirm();
		}}
	>
		<p>
			Último recuento registrado: <strong
				>{product.quantity} {product.quantity === 1 ? 'unidad' : 'unidades'}</strong
			>.
		</p>
		{#if product.quantityNeedsReview}<p class="notice">
				El recuento anterior era provisional. Comprueba el total real antes de guardar.
			</p>{/if}
		{#if item.note}<p>Nota de compra: {item.note}</p>{/if}
		{#if product.packSize || item.quantityUnit === 'PACKS'}
			<label class="field"
				>Cantidad comprada en<select bind:value={quantityUnit}
					><option value="UNITS">Unidades</option><option value="PACKS">Packs</option></select
				></label
			>
		{/if}
		<QuantityInput
			label={quantityUnit === 'PACKS' ? 'Número de packs comprados' : 'Unidades compradas'}
			bind:value={quantity}
			min={1}
		/>
		{#if quantityUnit === 'PACKS'}
			<QuantityInput label="Unidades por pack" bind:value={packSize} min={1} />
			<p>
				Compras {validQuantity(bought, 1) ? bought : '—'} unidades. Si mezclas tamaños, introduce directamente
				el total de unidades.
			</p>
		{/if}
		<p aria-live="polite">
			Total previsto: <strong>{validQuantity(expected) ? expected : '—'}</strong>
			({product.quantity} registradas + {validQuantity(bought, 1) ? bought : '—'} compradas).
		</p>
		<QuantityInput label="Total actual en casa" bind:value={finalQuantity} />
		<p>
			Puedes corregir el total si has consumido algo, quedaba menos o el recuento anterior no era
			exacto.
		</p>
		{#if error}<p class="notice" role="alert">{error}</p>{/if}
		<button class="primary" type="submit" disabled={!valid}>Actualizar inventario</button>
		<button class="later" type="button" onclick={onClose}>Lo haré después</button>
	</form>
</ActionSheet>

<style>
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
	.field {
		display: grid;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	select {
		min-height: 2.75rem;
		padding: 0.6rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-soft);
		color: var(--ink);
		font: inherit;
	}
	button {
		min-height: 3rem;
		width: 100%;
		border-radius: 0.75rem;
		font: inherit;
		cursor: pointer;
	}
	.primary {
		border: 0;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.later {
		margin-top: 0.5rem;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
	}
</style>

<script lang="ts">
	import StatusInput from './StatusInput.svelte';
	import { tick } from 'svelte';
	import { getActiveCategories, getActiveLocations } from '$lib/prototype/state.svelte';
	import QuantityInput from './QuantityInput.svelte';
	import { validQuantity, statusLabel } from '$lib/prototype/quantities';
	import type { ReplenishmentMode, TrackingMode, InventoryStatus } from '$lib/prototype/types';

	interface ProductFormValue {
		trackingMode: TrackingMode;
		status: InventoryStatus;
		name: string;
		quantity: number;
		lowThreshold: number;
		packSize: number | null;
		categoryId: string;
		locationId: string;
		replenishmentMode: ReplenishmentMode;
	}

	interface Props {
		initialValue?: Partial<ProductFormValue>;
		submitLabel?: string;
		allowAddAnother?: boolean;
		modeChangeLocked?: boolean;
		inventoryUpdatePending?: boolean;
		onsubmit: (value: ProductFormValue, addAnother: boolean) => boolean | void;
	}

	let {
		initialValue = {},
		submitLabel = 'Guardar producto',
		allowAddAnother = false,
		modeChangeLocked = false,
		inventoryUpdatePending = false,
		onsubmit
	}: Props = $props();

	function getInitialValue() {
		return initialValue;
	}

	let name = $state(getInitialValue().name ?? '');
	let nameInput = $state<HTMLInputElement>();
	let saving = $state(false);
	let trackingMode = $state<TrackingMode>(getInitialValue().trackingMode ?? 'STATUS');
	let status = $state<InventoryStatus>(getInitialValue().status ?? 'AVAILABLE');
	let quantity = $state(getInitialValue().quantity ?? 1);
	let lowThreshold = $state(getInitialValue().lowThreshold ?? 1);
	let usesPacks = $state(!!getInitialValue().packSize);
	let packSize = $state(getInitialValue().packSize ?? 6);
	let categoryId = $state(getInitialValue().categoryId ?? '');
	let locationId = $state(getInitialValue().locationId ?? '');
	let replenishmentMode = $state<ReplenishmentMode>(
		getInitialValue().replenishmentMode ?? 'MANUAL'
	);

	let canSave = $derived(
		name.trim().length > 0 &&
			!saving &&
			(trackingMode === 'STATUS' ||
				(validQuantity(quantity) &&
					validQuantity(lowThreshold) &&
					(!usesPacks || validQuantity(packSize, 1))))
	);

	async function submit(addAnother = false) {
		if (!canSave) {
			return;
		}

		const saved = onsubmit(
			{
				name: name.trim(),
				trackingMode,
				status,
				quantity: trackingMode === 'STATUS' ? 0 : quantity,
				lowThreshold: trackingMode === 'STATUS' ? 1 : lowThreshold,
				packSize: trackingMode === 'QUANTITY' && usesPacks ? packSize : null,
				categoryId,
				locationId,
				replenishmentMode
			},
			addAnother
		);

		if (saved !== true) return;
		if (!addAnother) {
			saving = true;
			return;
		}

		name = '';
		status = 'AVAILABLE';
		usesPacks = !!getInitialValue().packSize;
		packSize = getInitialValue().packSize ?? 6;
		quantity = getInitialValue().quantity ?? 1;
		lowThreshold = getInitialValue().lowThreshold ?? 1;

		replenishmentMode = getInitialValue().replenishmentMode ?? 'MANUAL';
		await tick();
		nameInput?.focus();
	}
</script>

<form
	onsubmit={(event) => {
		event.preventDefault();
		submit();
	}}
>
	<label class="field">
		<span>Nombre</span>

		<input
			type="text"
			bind:this={nameInput}
			bind:value={name}
			placeholder="Ej. Leche"
			autocomplete="off"
		/>
	</label>

	<label class="field"
		><span>Gestionar inventario</span><select bind:value={trackingMode} disabled={modeChangeLocked}
			><option value="STATUS">Por estado</option><option value="QUANTITY">Por cantidad</option
			></select
		></label
	>
	{#if modeChangeLocked}<p class="quantity-status">
			Resuelve la compra de este producto antes de cambiar su forma de gestión: actualiza el
			inventario y finaliza, o deshaz la compra.
		</p>{/if}
	{#if trackingMode === 'STATUS'}
		<StatusInput bind:value={status} />
		<p class="quantity-status">
			Indica si hay, queda poco o no hay. No necesitas llevar un recuento.
			{#if getInitialValue().trackingMode === 'QUANTITY'}Al guardar se dejará de llevar la cantidad
				y se quitará la configuración de packs.{/if}
		</p>
	{:else}
		<div>
			{#if inventoryUpdatePending}<p class="quantity-status">
					Compra pendiente de incorporar. Actualiza las existencias desde Compra; aquí puedes editar
					los demás datos.
				</p>
			{:else}<QuantityInput label="Cantidad en casa" bind:value={quantity} />{/if}
			{#if getInitialValue().trackingMode === 'STATUS'}<p class="quantity-status">
					Introduce cuánto queda realmente. El estado se calculará con esta cantidad.
				</p>{/if}
			<p class="quantity-status" aria-live="polite">
				Estado: {validQuantity(quantity) && validQuantity(lowThreshold)
					? statusLabel(quantity, lowThreshold)
					: 'Revisa la cantidad'}
			</p>
			<QuantityInput label="Reponer cuando queden" bind:value={lowThreshold} />
			<p class="quantity-status">
				Con 0: No hay. De 1 hasta este límite: Poco. Por encima: Hay. Al llegar al límite se
				sugerirá o se añadirá a Compra según la reposición elegida.
			</p>
		</div>

		<div>
			<label class="radio-option">
				<input type="checkbox" bind:checked={usesPacks} />
				<span
					><strong>Se compra en packs</strong><small
						>Cuenta el contenido en casa: por ejemplo, rollos de papel, no paquetes.</small
					></span
				>
			</label>
			{#if usesPacks}
				<QuantityInput label="Unidades por pack habitual" bind:value={packSize} min={1} />
				<p class="quantity-status">
					Podrás cambiar el tamaño del pack en cada compra. La cantidad en casa y el límite de
					reposición siempre cuentan unidades.
				</p>
			{/if}
		</div>
	{/if}
	<label class="field">
		<span>Categoría</span>

		<select bind:value={categoryId}>
			<option value="">Sin categoría</option>

			{#each getActiveCategories() as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>Ubicación habitual</span>

		<select bind:value={locationId}>
			<option value="">Sin ubicación</option>

			{#each getActiveLocations() as location (location.id)}
				<option value={location.id}>{location.name}</option>
			{/each}
		</select>
	</label>

	<fieldset class="field">
		<legend>Reposición</legend>

		<label class="radio-option">
			<input type="radio" name="replenishment" value="MANUAL" bind:group={replenishmentMode} />

			<span>
				<strong>Manual</strong>
				<small
					>{trackingMode === 'STATUS'
						? 'Aparecerá en Sugerencias cuando marques Poco o No hay.'
						: 'Aparecerá en Sugerencias al llegar al límite de reposición.'}</small
				>
			</span>
		</label>

		<label class="radio-option">
			<input type="radio" name="replenishment" value="AUTOMATIC" bind:group={replenishmentMode} />

			<span>
				<strong>Automática</strong>
				<small
					>{trackingMode === 'STATUS'
						? 'Se añadirá a Compra cuando marques Poco o No hay.'
						: 'Se añadirá a Compra al llegar al límite de reposición.'}</small
				>
			</span>
		</label>
	</fieldset>

	<div class="form-actions">
		<button class="save-button" type="submit" disabled={!canSave}>
			{submitLabel}
		</button>
		{#if allowAddAnother}
			<button class="save-another" type="button" disabled={!canSave} onclick={() => submit(true)}>
				Guardar y añadir otro
			</button>
		{/if}
	</div>
</form>

<style>
	.quantity-status {
		margin: 0.4rem 0;
		color: var(--muted);
		font-size: 0.8rem;
		line-height: 1.5;
	}
	.form-actions {
		display: grid;
		gap: 0.75rem;
	}
	.save-another {
		width: 100%;
		min-height: 3rem;
		padding: 0.75rem;
		border: 1px solid var(--accent);
		border-radius: 0.85rem;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
		cursor: pointer;
	}
	.save-another:disabled {
		border-color: var(--line);
		background: var(--surface-soft);
		color: var(--muted);
		cursor: default;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.field {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.field > span,
	.field legend {
		font-size: 0.875rem;
		font-weight: 600;
	}

	input[type='text'],
	select {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--surface);
		font: inherit;
	}

	.radio-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		cursor: pointer;
	}

	.radio-option input {
		margin-top: 0.2rem;
	}

	.radio-option span {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.radio-option strong {
		font-size: 0.9rem;
	}

	.radio-option small {
		color: var(--muted);
		font-size: 0.8rem;
	}

	.save-button {
		width: 100%;
		min-height: 3rem;
		margin-top: 0.5rem;
		border: 0;
		border-radius: 0.65rem;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		cursor: pointer;
	}

	.save-button:disabled {
		background: var(--line);
		color: var(--muted);
		cursor: default;
	}

	form {
		padding: 1.2rem;
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	input[type='text'],
	select {
		border-radius: 0.8rem;
		min-height: 3rem;
		background: var(--surface-soft);
	}
	.radio-option {
		padding: 0.85rem;
		border: 1px solid var(--line);
		border-radius: 0.85rem;
		margin-top: 0.6rem;
	}
	.radio-option:has(input:checked) {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.save-button {
		border-radius: 0.85rem;
	}
</style>

<script lang="ts">
	import { getActiveCategories, getActiveLocations } from '$lib/prototype/state.svelte';
	import type { InventoryStatus, ReplenishmentMode } from '$lib/prototype/types';

	interface ProductFormValue {
		name: string;
		status: InventoryStatus;
		categoryId: string;
		locationId: string;
		replenishmentMode: ReplenishmentMode;
	}

	interface Props {
		initialValue?: Partial<ProductFormValue>;
		submitLabel?: string;
		onsubmit: (value: ProductFormValue) => void;
	}

	let { initialValue = {}, submitLabel = 'Guardar producto', onsubmit }: Props = $props();

	function getInitialValue() {
		return initialValue;
	}

	let name = $state(getInitialValue().name ?? '');
	let status = $state<InventoryStatus>(getInitialValue().status ?? 'AVAILABLE');
	let categoryId = $state(getInitialValue().categoryId ?? '');
	let locationId = $state(getInitialValue().locationId ?? '');
	let replenishmentMode = $state<ReplenishmentMode>(
		getInitialValue().replenishmentMode ?? 'MANUAL'
	);

	const statuses: { value: InventoryStatus; label: string }[] = [
		{ value: 'AVAILABLE', label: 'Hay' },
		{ value: 'LOW', label: 'Poco' },
		{ value: 'OUT', label: 'No hay' }
	];

	let canSave = $derived(name.trim().length > 0);

	function submit() {
		if (!canSave) {
			return;
		}

		onsubmit({
			name: name.trim(),
			status,
			categoryId,
			locationId,
			replenishmentMode
		});
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

		<input type="text" bind:value={name} placeholder="Ej. Leche" autocomplete="off" />
	</label>

	<fieldset class="field">
		<legend>Estado</legend>

		<div class="status-selector">
			{#each statuses as item (item.value)}
				<button
					type="button"
					class:active={status === item.value}
					aria-pressed={status === item.value}
					onclick={() => (status = item.value)}
				>
					{item.label}
				</button>
			{/each}
		</div>
	</fieldset>

	<label class="field">
		<span>Categor�a</span>

		<select bind:value={categoryId}>
			<option value="">Sin categor�a</option>

			{#each getActiveCategories() as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</label>

	<label class="field">
		<span>Ubicaci�n habitual</span>

		<select bind:value={locationId}>
			<option value="">Sin ubicaci�n</option>

			{#each getActiveLocations() as location (location.id)}
				<option value={location.id}>{location.name}</option>
			{/each}
		</select>
	</label>

	<fieldset class="field">
		<legend>Reposici�n</legend>

		<label class="radio-option">
			<input type="radio" name="replenishment" value="MANUAL" bind:group={replenishmentMode} />

			<span>
				<strong>Manual</strong>
				<small>Lo a�adir�s a Compra cuando lo necesites.</small>
			</span>
		</label>

		<label class="radio-option">
			<input type="radio" name="replenishment" value="AUTOMATIC" bind:group={replenishmentMode} />

			<span>
				<strong>Autom�tica</strong>
				<small>Se a�adir� a Compra cuando pase a No hay.</small>
			</span>
		</label>
	</fieldset>

	<button class="save-button" type="submit" disabled={!canSave}>
		{submitLabel}
	</button>
</form>

<style>
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
		background: white;
		font: inherit;
	}

	.status-selector {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.625rem;
		background: var(--surface-soft);
	}

	.status-selector button {
		min-height: 2.5rem;
		border: 0;
		border-radius: 0.45rem;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
	}

	.status-selector button.active {
		background: white;
		color: var(--ink);
		font-weight: 600;
		box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
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
		color: white;
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
		background: white;
		box-shadow: var(--shadow);
	}
	input[type='text'],
	select {
		border-radius: 0.8rem;
		min-height: 3rem;
		background: #fcfdfb;
	}
	.status-selector {
		border-radius: 0.9rem;
	}
	.status-selector button {
		border-radius: 0.65rem;
		min-height: 2.75rem;
	}
	.status-selector button.active {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.status-selector button:nth-child(2).active {
		background: var(--warning-soft);
		color: var(--warning);
	}
	.status-selector button:nth-child(3).active {
		background: var(--danger-soft);
		color: var(--danger);
	}
	.radio-option {
		padding: 0.85rem;
		border: 1px solid var(--line);
		border-radius: 0.85rem;
		margin-top: 0.6rem;
	}
	.radio-option:has(input:checked) {
		background: var(--accent-soft);
		border-color: #9dbfa9;
	}
	.save-button {
		border-radius: 0.85rem;
	}
</style>

<script lang="ts">
	import { tick } from 'svelte';
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
		allowAddAnother?: boolean;
		onsubmit: (value: ProductFormValue, addAnother: boolean) => boolean | void;
	}

	let {
		initialValue = {},
		submitLabel = 'Guardar producto',
		allowAddAnother = false,
		onsubmit
	}: Props = $props();

	function getInitialValue() {
		return initialValue;
	}

	let name = $state(getInitialValue().name ?? '');
	let nameInput = $state<HTMLInputElement>();
	let saving = $state(false);
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

	let canSave = $derived(name.trim().length > 0 && !saving);

	async function submit(addAnother = false) {
		if (!canSave) {
			return;
		}

		const saved = onsubmit(
			{
				name: name.trim(),
				status,
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
		status = getInitialValue().status ?? 'AVAILABLE';
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
				<small>Lo añadirás a Compra cuando lo necesites.</small>
			</span>
		</label>

		<label class="radio-option">
			<input type="radio" name="replenishment" value="AUTOMATIC" bind:group={replenishmentMode} />

			<span>
				<strong>Automática</strong>
				<small>Se añadirá a Compra cuando pase a No hay.</small>
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
		background: var(--surface);
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
	.status-selector {
		border-radius: 0.9rem;
	}
	.status-selector button {
		border-radius: 0.65rem;
		min-height: 2.75rem;
	}
	.status-selector button.active {
		background: var(--success-soft);
		color: var(--success);
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
		border-color: var(--accent);
	}
	.save-button {
		border-radius: 0.85rem;
	}
</style>

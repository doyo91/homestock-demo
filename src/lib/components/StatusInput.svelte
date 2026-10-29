<script lang="ts">
	import type { InventoryStatus } from '$lib/prototype/types';
	let { value = $bindable<InventoryStatus>('AVAILABLE') } = $props();
	const options: { value: InventoryStatus; label: string }[] = [
		{ value: 'AVAILABLE', label: 'Hay' },
		{ value: 'LOW', label: 'Poco' },
		{ value: 'OUT', label: 'No hay' }
	];
</script>

<fieldset>
	<legend>Estado en casa</legend>
	<div>
		{#each options as option (option.value)}<button
				type="button"
				class:chosen={value === option.value}
				aria-pressed={value === option.value}
				onclick={() => (value = option.value)}>{option.label}</button
			>{/each}
	</div>
</fieldset>

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
	legend {
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.6rem;
	}
	div {
		display: flex;
		gap: 0.5rem;
	}
	button {
		flex: 1;
		min-height: 2.75rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-soft);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.chosen {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}
</style>

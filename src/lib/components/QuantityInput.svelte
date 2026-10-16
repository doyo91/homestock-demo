<script lang="ts">
	import { MAX_QUANTITY } from '$lib/prototype/quantities';
	const inputId = $props.id();
	let {
		label,
		value = $bindable(1),
		min = 0,
		max = MAX_QUANTITY
	}: {
		label: string;
		value: number;
		min?: number;
		max?: number;
	} = $props();
</script>

<div class="quantity-field">
	<label for={inputId}>{label}</label>
	<span class="controls">
		<button
			type="button"
			aria-label={`Reducir ${label.toLocaleLowerCase()}`}
			disabled={!Number.isFinite(value) || value <= min}
			onclick={() => (value = Math.max(min, value - 1))}>−</button
		>
		<input
			id={inputId}
			type="number"
			inputmode="numeric"
			{min}
			{max}
			step="1"
			required
			bind:value
			aria-label={label}
		/>
		<button
			type="button"
			aria-label={`Aumentar ${label.toLocaleLowerCase()}`}
			disabled={!Number.isFinite(value) || value >= max}
			onclick={() => (value = Math.min(max, value + 1))}>+</button
		>
	</span>
</div>

<style>
	.quantity-field {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.controls {
		display: flex;
		align-items: stretch;
		max-width: 20rem;
		border: 1px solid var(--line);
		border-radius: 0.8rem;
		overflow: hidden;
		background: var(--surface-soft);
	}
	button {
		flex: 0 0 3rem;
		min-height: 3rem;
		border: 0;
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}
	button:disabled {
		color: var(--muted);
		opacity: 0.45;
		cursor: default;
	}
	input {
		width: 100%;
		min-width: 0;
		min-height: 3rem;
		padding: 0.5rem;
		border: 0;
		border-inline: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		text-align: center;
	}
	input:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -3px;
	}
</style>

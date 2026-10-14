<script lang="ts">
	import { resolve } from '$app/paths';
	import { getPrototypeState, setHouseholdName } from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	let householdName = $state(prototypeState.householdName);
	let savedName = $state(prototypeState.householdName);

	function save() {
		const name = householdName.trim();

		if (!name) {
			return;
		}

		setHouseholdName(name);
		savedName = name;
		householdName = name;
	}

	let hasChanges = $derived(householdName.trim() !== savedName && householdName.trim().length > 0);
</script>

<svelte:head>
	<title>Hogar | HomeStock</title>
</svelte:head>

<section class="page">
	<header>
		<a class="back" href={resolve('/settings')} aria-label="Volver a ajustes">‹</a>

		<div>
			<p>Ajustes</p>
			<h1>Hogar</h1>
		</div>

		<div></div>
	</header>

	<section class="group">
		<h2>Información</h2>

		<label>
			<span>Nombre del hogar</span>

			<input type="text" bind:value={householdName} autocomplete="off" maxlength="100" />
		</label>

		<button class="save" type="button" disabled={!hasChanges} onclick={save}>
			Guardar cambios
		</button>
	</section>

	<section class="group">
		<h2>Miembros</h2>

		<div class="member">
			<div class="avatar" aria-hidden="true">U</div>

			<div class="member-info">
				<strong>Usuario de prueba</strong>
				<span>Propietario</span>
			</div>
		</div>

		<p class="note">La gestión de miembros estará disponible más adelante.</p>
	</section>
</section>

<style>
	header {
		display: grid;
		grid-template-columns: 2.75rem 1fr 2.75rem;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	header > div {
		text-align: center;
	}

	header p {
		margin: 0 0 0.15rem;
		color: var(--muted);
		font-size: 0.75rem;
	}

	h1 {
		margin: 0;
		font-size: 1.4rem;
	}

	.back {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		color: var(--ink);
		font-size: 2rem;
		text-decoration: none;
	}

	.group {
		margin-bottom: 2rem;
	}

	.group h2 {
		margin: 0 0 0.75rem;
		color: var(--muted);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label span {
		font-size: 0.875rem;
		font-weight: 600;
	}

	input {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: white;
		font: inherit;
	}

	input:focus {
		border-color: var(--accent);
		outline: 2px solid transparent;
	}

	.save {
		width: 100%;
		min-height: 2.75rem;
		margin-top: 1rem;
		border: 0;
		border-radius: 0.6rem;
		background: var(--accent);
		color: white;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.save:disabled {
		background: var(--line);
		color: var(--muted);
		cursor: default;
	}

	.member {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--surface-soft);
	}

	.avatar {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		background: var(--surface-soft);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.member-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.member-info strong {
		font-size: 0.9rem;
	}

	.member-info span {
		color: var(--muted);
		font-size: 0.8rem;
	}

	.note {
		margin: 0.75rem 0 0;
		color: var(--muted);
		font-size: 0.8rem;
	}
</style>

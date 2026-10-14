<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		getPrototypeState,
		createLocation,
		updateLocation,
		toggleLocationActive,
		moveLocation
	} from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let newLocationName = $state('');
	let editingName = $state('');
	let feedback = $state<string | null>(null);

	function toggleActive(id: string) {
		const location = prototypeState.locations.find((item) => item.id === id);

		if (!location) {
			return;
		}

		toggleLocationActive(id);

		feedback = location.active ? `${location.name} desactivada.` : `${location.name} activada.`;
	}

	function openCreateForm() {
		editingId = null;
		editingName = '';
		newLocationName = '';
		showCreateForm = true;
		feedback = null;
	}

	function cancelCreate() {
		showCreateForm = false;
		newLocationName = '';
	}

	function createLocationForm() {
		const name = newLocationName.trim();

		if (!name) {
			return;
		}

		const locationId = createLocation(name);

		if (locationId) {
			showCreateForm = false;
			newLocationName = '';
			feedback = `${name} creada.`;
		} else {
			feedback = 'Ya existe una ubicación con ese nombre.';
		}
	}

	function startEditing(id: string) {
		const location = prototypeState.locations.find((item) => item.id === id);

		if (!location) {
			return;
		}

		showCreateForm = false;
		newLocationName = '';

		editingId = id;
		editingName = location.name;
		feedback = null;
	}

	function cancelEditing() {
		editingId = null;
		editingName = '';
	}

	function saveEditing(id: string) {
		const location = prototypeState.locations.find((item) => item.id === id);
		const name = editingName.trim();

		if (!location || !name) {
			return;
		}

		const success = updateLocation(id, name);

		if (success) {
			const previousName = location.name;

			editingId = null;
			editingName = '';

			feedback = previousName === name ? null : `${previousName} renombrada como ${name}.`;
		} else {
			feedback = 'Ya existe una ubicación con ese nombre.';
		}
	}

	function moveLocationItem(id: string, direction: -1 | 1) {
		moveLocation(id, direction);
		feedback = null;
	}
</script>

<svelte:head>
	<title>Ubicaciones | HomeStock</title>
</svelte:head>

<section class="page">
	<header>
		<a class="back" href={resolve('/settings')} aria-label="Volver a ajustes"> ‹ </a>

		<div>
			<p>Organización</p>
			<h1>Ubicaciones</h1>
		</div>

		<button
			class="add"
			type="button"
			aria-label="Añadir ubicación"
			aria-expanded={showCreateForm}
			onclick={openCreateForm}
		>
			+
		</button>
	</header>

	<p class="description">Organiza los productos según dónde los guardas.</p>

	{#if feedback}
		<div class="feedback" role="status">
			<span>{feedback}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => (feedback = null)}>
				×
			</button>
		</div>
	{/if}

	{#if showCreateForm}
		<form
			class="editor create-editor"
			onsubmit={(event) => {
				event.preventDefault();
				createLocationForm();
			}}
		>
			<label for="new-location"> Nueva ubicación </label>

			<input
				id="new-location"
				type="text"
				bind:value={newLocationName}
				placeholder="Ej. Congelador"
				autocomplete="off"
			/>

			<div class="editor-actions">
				<button class="secondary-button" type="button" onclick={cancelCreate}> Cancelar </button>

				<button class="primary-button" type="submit" disabled={!newLocationName.trim()}>
					Añadir
				</button>
			</div>
		</form>
	{/if}

	<div class="list">
		{#each prototypeState.locations as location, index (location.id)}
			<div class:inactive={!location.active} class="row">
				<div class="order-actions" aria-label={`Ordenar ${location.name}`}>
					<button
						type="button"
						aria-label={`Subir ${location.name}`}
						disabled={index === 0}
						onclick={() => moveLocationItem(location.id, -1)}
					>
						↑
					</button>

					<button
						type="button"
						aria-label={`Bajar ${location.name}`}
						disabled={index === prototypeState.locations.length - 1}
						onclick={() => moveLocationItem(location.id, 1)}
					>
						↓
					</button>
				</div>

				{#if editingId === location.id}
					<form
						class="inline-editor"
						onsubmit={(event) => {
							event.preventDefault();
							saveEditing(location.id);
						}}
					>
						<label class="sr-only" for={`location-${location.id}`}> Nombre de ubicación </label>

						<input
							id={`location-${location.id}`}
							type="text"
							bind:value={editingName}
							autocomplete="off"
						/>

						<div class="inline-actions">
							<button class="text-button" type="button" onclick={cancelEditing}> Cancelar </button>

							<button class="text-button save" type="submit" disabled={!editingName.trim()}>
								Guardar
							</button>
						</div>
					</form>
				{:else}
					<button
						class="info"
						type="button"
						aria-label={`Renombrar ${location.name}`}
						onclick={() => startEditing(location.id)}
					>
						<strong>{location.name}</strong>

						{#if !location.active}
							<span>Desactivada</span>
						{:else}
							<span>Editar nombre</span>
						{/if}
					</button>

					<button
						class="toggle"
						class:enabled={location.active}
						type="button"
						aria-label={location.active
							? `Desactivar ${location.name}`
							: `Activar ${location.name}`}
						aria-pressed={location.active}
						onclick={() => toggleActive(location.id)}
					>
						<span></span>
					</button>
				{/if}
			</div>
		{/each}
	</div>

	{#if prototypeState.locations.length === 0}
		<div class="empty-state">
			<p>Todavía no hay ubicaciones.</p>

			<button type="button" onclick={openCreateForm}> Añadir ubicación </button>
		</div>
	{/if}
</section>

<style>
	header {
		display: grid;
		grid-template-columns: 2.75rem 1fr 2.75rem;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	header div {
		text-align: center;
	}

	header p {
		margin: 0 0 0.15rem;
		color: #777;
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
		color: #111;
		font-size: 2rem;
		text-decoration: none;
	}

	.add {
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: #111;
		color: white;
		font-size: 1.6rem;
		cursor: pointer;
	}

	.description {
		margin: 0 0 1.25rem;
		color: #666;
		font-size: 0.875rem;
		text-align: center;
	}

	.feedback {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.6rem;
		background: #f3f3f3;
		font-size: 0.85rem;
	}

	.feedback button {
		padding: 0;
		border: 0;
		background: transparent;
		color: #666;
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.editor {
		margin-bottom: 1.25rem;
		padding: 1rem;
		border: 1px solid #e5e5e5;
		border-radius: 0.75rem;
		background: #fafafa;
	}

	.editor label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.editor input,
	.inline-editor input {
		width: 100%;
		min-height: 2.75rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		background: white;
		font: inherit;
	}

	.editor-actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.editor-actions button {
		min-height: 2.6rem;
		border-radius: 0.5rem;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.secondary-button {
		border: 1px solid #ddd;
		background: white;
		color: #111;
	}

	.primary-button {
		border: 1px solid #111;
		background: #111;
		color: white;
	}

	.primary-button:disabled {
		border-color: #ddd;
		background: #ddd;
		color: #888;
		cursor: default;
	}

	.list {
		border-top: 1px solid #eee;
	}

	.row {
		display: flex;
		min-height: 4rem;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid #eee;
	}

	.row.inactive {
		opacity: 0.55;
	}

	.order-actions {
		display: flex;
		width: 1.75rem;
		flex: 0 0 auto;
		flex-direction: column;
	}

	.order-actions button {
		display: grid;
		width: 1.75rem;
		height: 1.5rem;
		place-items: center;
		padding: 0;
		border: 0;
		background: transparent;
		color: #888;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.order-actions button:disabled {
		color: #ddd;
		cursor: default;
	}

	.info {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.65rem 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.info strong {
		font-size: 0.95rem;
	}

	.info span {
		color: #777;
		font-size: 0.75rem;
	}

	.toggle {
		position: relative;
		width: 2.75rem;
		height: 1.6rem;
		flex: 0 0 auto;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: #ccc;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.toggle span {
		position: absolute;
		top: 0.2rem;
		left: 0.2rem;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 50%;
		background: white;
		transition: transform 0.15s ease;
	}

	.toggle.enabled {
		background: #111;
	}

	.toggle.enabled span {
		transform: translateX(1.15rem);
	}

	.inline-editor {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.65rem 0;
	}

	.inline-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.text-button {
		padding: 0;
		border: 0;
		background: transparent;
		color: #666;
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.text-button.save {
		color: #111;
		font-weight: 600;
	}

	.text-button:disabled {
		color: #aaa;
		cursor: default;
	}

	.empty-state {
		padding: 3rem 1rem;
		color: #666;
		text-align: center;
	}

	.empty-state p {
		margin: 0 0 0.75rem;
	}

	.empty-state button {
		border: 0;
		background: transparent;
		color: #111;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

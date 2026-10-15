<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		getPrototypeState,
		createCategory,
		updateCategory,
		toggleCategoryActive,
		moveCategory,
		setCategoryColor
	} from '$lib/prototype/state.svelte';
	import { CATEGORY_PALETTE } from '$lib/prototype/seed';

	const prototypeState = getPrototypeState();

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let newCategoryName = $state('');
	let editingName = $state('');
	let colorPickerId = $state<string | null>(null);
	let feedback = $state<string | null>(null);

	function toggleActive(id: string) {
		const category = prototypeState.categories.find((item) => item.id === id);

		if (!category) {
			return;
		}

		toggleCategoryActive(id);

		feedback = category.active ? `${category.name} desactivada.` : `${category.name} activada.`;
	}

	function openCreateForm() {
		editingId = null;
		editingName = '';
		newCategoryName = '';
		showCreateForm = true;
		feedback = null;
	}

	function cancelCreate() {
		showCreateForm = false;
		newCategoryName = '';
	}

	function createCategoryForm() {
		const name = newCategoryName.trim();

		if (!name) {
			return;
		}

		const categoryId = createCategory(name);

		if (categoryId) {
			showCreateForm = false;
			newCategoryName = '';
			feedback = `${name} creada.`;
		} else {
			feedback = 'Ya existe una categoría con ese nombre.';
		}
	}

	function startEditing(id: string) {
		const category = prototypeState.categories.find((item) => item.id === id);

		if (!category) {
			return;
		}

		showCreateForm = false;
		newCategoryName = '';

		editingId = id;
		editingName = category.name;
		feedback = null;
	}

	function cancelEditing() {
		editingId = null;
		editingName = '';
	}

	function saveEditing(id: string) {
		const category = prototypeState.categories.find((item) => item.id === id);
		const name = editingName.trim();

		if (!category || !name) {
			return;
		}

		const success = updateCategory(id, name);

		if (success) {
			const previousName = category.name;

			editingId = null;
			editingName = '';

			feedback = previousName === name ? null : `${previousName} renombrada como ${name}.`;
		} else {
			feedback = 'Ya existe una categoría con ese nombre.';
		}
	}

	function moveCategoryItem(id: string, direction: -1 | 1) {
		moveCategory(id, direction);
		feedback = null;
	}

	function chooseColor(id: string, color: (typeof CATEGORY_PALETTE)[number]['id']) {
		if (setCategoryColor(id, color)) {
			colorPickerId = null;
			feedback = 'Color actualizado.';
		}
	}
</script>

<svelte:head>
	<title>Categorías | HomeStock</title>
</svelte:head>

<section class="page">
	<header>
		<a class="back" href={resolve('/settings')} aria-label="Volver a ajustes"> ‹ </a>

		<div>
			<p>Organización</p>
			<h1>Categorías</h1>
		</div>

		<button
			class="add"
			type="button"
			aria-label="Añadir categoría"
			aria-expanded={showCreateForm}
			onclick={openCreateForm}
		>
			+
		</button>
	</header>

	<p class="description">Organiza los productos por tipo.</p>

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
				createCategoryForm();
			}}
		>
			<label for="new-category"> Nueva categoría </label>

			<input
				id="new-category"
				type="text"
				bind:value={newCategoryName}
				placeholder="Ej. Mascotas"
				autocomplete="off"
			/>

			<div class="editor-actions">
				<button class="secondary-button" type="button" onclick={cancelCreate}> Cancelar </button>

				<button class="primary-button" type="submit" disabled={!newCategoryName.trim()}>
					Añadir
				</button>
			</div>
		</form>
	{/if}

	<div class="list">
		{#each prototypeState.categories as category, index (category.id)}
			<div class:inactive={!category.active} class="row">
				<div class="order-actions" aria-label={`Ordenar ${category.name}`}>
					<button
						type="button"
						aria-label={`Subir ${category.name}`}
						disabled={index === 0}
						onclick={() => moveCategoryItem(category.id, -1)}
					>
						↑
					</button>

					<button
						type="button"
						aria-label={`Bajar ${category.name}`}
						disabled={index === prototypeState.categories.length - 1}
						onclick={() => moveCategoryItem(category.id, 1)}
					>
						↓
					</button>
				</div>

				{#if editingId === category.id}
					<form
						class="inline-editor"
						onsubmit={(event) => {
							event.preventDefault();
							saveEditing(category.id);
						}}
					>
						<label class="sr-only" for={`category-${category.id}`}> Nombre de categoría </label>

						<input
							id={`category-${category.id}`}
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
						aria-label={`Renombrar ${category.name}`}
						onclick={() => startEditing(category.id)}
					>
						<strong>{category.name}</strong>

						{#if !category.active}
							<span>Desactivada</span>
						{:else}
							<span>Editar nombre</span>
						{/if}
					</button>

					<button
						class="color-button"
						type="button"
						aria-label={`Cambiar color de ${category.name}`}
						aria-expanded={colorPickerId === category.id}
						onclick={() => (colorPickerId = colorPickerId === category.id ? null : category.id)}
					>
						<span
							class="color-preview"
							style={`background: ${CATEGORY_PALETTE.find((color) => color.id === category.color)?.tone ?? CATEGORY_PALETTE[0].tone}`}
						></span>
					</button>

					<button
						class="toggle"
						class:enabled={category.active}
						type="button"
						aria-label={category.active
							? `Desactivar ${category.name}`
							: `Activar ${category.name}`}
						aria-pressed={category.active}
						onclick={() => toggleActive(category.id)}
					>
						<span></span>
					</button>
				{/if}
			</div>

			{#if colorPickerId === category.id && editingId !== category.id}
				<div class="color-picker" aria-label={`Paleta de color para ${category.name}`}>
					{#each CATEGORY_PALETTE as color (color.id)}
						<button
							class="color-choice"
							class:selected={category.color === color.id}
							type="button"
							aria-label={color.name}
							aria-pressed={category.color === color.id}
							title={color.name}
							style={`--swatch: ${color.tone}`}
							onclick={() => chooseColor(category.id, color.id)}
						></button>
					{/each}
				</div>
			{/if}
		{/each}
	</div>

	{#if prototypeState.categories.length === 0}
		<div class="empty-state">
			<p>Todavía no hay categorías.</p>

			<button type="button" onclick={openCreateForm}> Añadir categoría </button>
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

	.add {
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 1.6rem;
		cursor: pointer;
	}

	.description {
		margin: 0 0 1.25rem;
		color: var(--muted);
		font-size: 0.875rem;
		text-align: center;
	}

	.color-button {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		flex: 0 0 auto;
		place-items: center;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--surface);
		cursor: pointer;
	}

	.color-preview {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%);
	}

	.color-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin: 0.25rem 0 0.65rem 2.4rem;
		padding: 0.7rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface);
	}

	.color-choice {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 2px solid var(--surface);
		border-radius: 50%;
		background: var(--swatch);
		box-shadow: 0 0 0 1px var(--line);
		cursor: pointer;
	}

	.color-choice.selected {
		box-shadow: 0 0 0 2px var(--ink);
	}

	.color-choice:focus-visible,
	.color-button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.feedback {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.6rem;
		background: var(--surface-soft);
		font-size: 0.85rem;
	}

	.feedback button {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.editor {
		margin-bottom: 1.25rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-soft);
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
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--surface);
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
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
	}

	.primary-button {
		border: 1px solid var(--ink);
		background: var(--accent);
		color: var(--on-accent);
	}

	.primary-button:disabled {
		border-color: var(--line);
		background: var(--line);
		color: var(--muted);
		cursor: default;
	}

	.list {
		border-top: 1px solid var(--surface-soft);
	}

	.row {
		display: flex;
		min-height: 4rem;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid var(--surface-soft);
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
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.order-actions button:disabled {
		color: var(--line);
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
		color: var(--muted);
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
		background: var(--line);
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
		background: var(--muted);
		transition: transform 0.15s ease;
	}

	.toggle.enabled {
		background: var(--accent);
	}

	.toggle.enabled span {
		background: var(--on-accent);
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
		color: var(--muted);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.text-button.save {
		color: var(--ink);
		font-weight: 600;
	}

	.text-button:disabled {
		color: var(--muted);
		cursor: default;
	}

	.empty-state {
		padding: 3rem 1rem;
		color: var(--muted);
		text-align: center;
	}

	.empty-state p {
		margin: 0 0 0.75rem;
	}

	.empty-state button {
		border: 0;
		background: transparent;
		color: var(--ink);
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

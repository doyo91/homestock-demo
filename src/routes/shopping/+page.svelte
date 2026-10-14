<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		addProductToShopping,
		finalizeShopping as finalizePrototypeShopping,
		getPrototypeState,
		getLocationById,
		purchaseShoppingItem,
		removePendingShoppingItem,
		undoShoppingPurchase
	} from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	let householdName = $derived(prototypeState.householdName);

	function getLocationName(locationId: string | null): string {
		if (!locationId) return 'Sin ubicación';
		const location = getLocationById(locationId);
		return location?.name ?? 'Sin ubicación';
	}

	let showFinishConfirmation = $state(false);
	let feedback = $state<string | null>(null);
	let openMenuId = $state<string | null>(null);

	let shopping = $derived(prototypeState.shopping);

	let lowSuggestions = $derived(
		prototypeState.inventory.filter(
			(product) =>
				product.status === 'LOW' && !shopping.some((item) => item.productId === product.id)
		)
	);

	let pending = $derived(shopping.filter((item) => item.status === 'PENDING'));

	let purchased = $derived(shopping.filter((item) => item.status === 'PURCHASED'));

	function markAsPurchased(id: string) {
		const item = shopping.find((candidate) => candidate.id === id);

		if (!item) {
			return;
		}

		const purchasedSuccessfully = purchaseShoppingItem(id);

		if (!purchasedSuccessfully) {
			return;
		}

		feedback = null;
		openMenuId = null;
	}

	function undoPurchase(id: string) {
		const item = shopping.find((candidate) => candidate.id === id);

		if (!item) {
			return;
		}

		const undoneSuccessfully = undoShoppingPurchase(id);

		if (!undoneSuccessfully) {
			return;
		}

		feedback = null;
		openMenuId = null;
	}

	function addSuggestion(productId: string) {
		const product = prototypeState.inventory.find((item) => item.id === productId);

		if (!product) {
			return;
		}

		const added = addProductToShopping(productId);

		if (!added) {
			feedback = `${product.name} ya está en Compra.`;
			return;
		}

		feedback = `${product.name} añadido a Compra.`;
	}

	function toggleMenu(id: string) {
		openMenuId = openMenuId === id ? null : id;
	}

	function removePendingItem(id: string) {
		const item = shopping.find(
			(candidate) => candidate.id === id && candidate.status === 'PENDING'
		);

		if (!item) {
			return;
		}

		const removed = removePendingShoppingItem(id);

		if (!removed) {
			return;
		}

		openMenuId = null;
		feedback = `${item.name} eliminado de Compra.`;
	}

	function requestFinish() {
		if (purchased.length === 0) {
			return;
		}

		if (pending.length > 0) {
			showFinishConfirmation = true;
			return;
		}

		finishShopping();
	}

	function finishShopping() {
		const purchasedCount = finalizePrototypeShopping();

		if (purchasedCount === 0) {
			showFinishConfirmation = false;
			return;
		}

		showFinishConfirmation = false;

		feedback =
			purchasedCount === 1
				? 'Compra finalizada. 1 artículo comprado.'
				: `Compra finalizada. ${purchasedCount} artículos comprados.`;
	}

	function cancelFinish() {
		showFinishConfirmation = false;
	}
</script>

<svelte:head>
	<title>Compra | HomeStock</title>
</svelte:head>

<section class="page shopping">
	<header class="page-header">
		<div>
			<p class="household">{householdName}</p>
			<h1>Compra</h1>
		</div>

		<a class="add-button" href={resolve('/shopping/add')}>
			<span aria-hidden="true">+</span>
			<span>Añadir</span>
		</a>
	</header>

	{#if feedback}
		<div class="feedback" role="status">
			<span>{feedback}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => (feedback = null)}>
				×
			</button>
		</div>
	{/if}

	<section class="group">
		<div class="section-heading">
			<h2>Pendientes</h2>

			{#if pending.length > 0}
				<span>{pending.length}</span>
			{/if}
		</div>

		{#each pending as item (item.id)}
			<div class="shopping-row">
				<button
					class="shopping-item"
					type="button"
					aria-label={`Marcar ${item.name} como comprado`}
					onclick={() => markAsPurchased(item.id)}
				>
					<span class="check" aria-hidden="true"></span>

					<span class="item-name">
						{item.name}
					</span>
				</button>

				<div class="item-actions">
					<button
						class="menu-button"
						type="button"
						aria-label={`Acciones de ${item.name}`}
						aria-expanded={openMenuId === item.id}
						onclick={() => toggleMenu(item.id)}
					>
						⋯
					</button>

					{#if openMenuId === item.id}
						<div class="menu">
							<button class="danger" type="button" onclick={() => removePendingItem(item.id)}>
								Eliminar
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/each}

		{#if pending.length === 0}
			<p class="empty">No tienes nada pendiente.</p>
		{/if}
	</section>

	{#if lowSuggestions.length > 0}
		<section class="group suggestions">
			<div class="suggestion-heading">
				<h2>Queda poco</h2>
				<p>Quizá quieras reponerlo</p>
			</div>

			{#each lowSuggestions as item (item.id)}
				<div class="suggestion">
					<div>
						<strong>{item.name}</strong>
						<span>{getLocationName(item.locationId)}</span>
					</div>

					<button type="button" onclick={() => addSuggestion(item.id)}> Añadir </button>
				</div>
			{/each}
		</section>
	{/if}

	{#if purchased.length > 0}
		<section class="group purchased">
			<div class="section-heading">
				<h2>Comprados</h2>
				<span>{purchased.length}</span>
			</div>

			{#each purchased as item (item.id)}
				<div class="shopping-row purchased-row">
					<div class="purchased-item">
						<span class="check checked" aria-hidden="true"> ✓ </span>

						<span class="item-name">
							{item.name}
						</span>
					</div>

					<button class="undo-button" type="button" onclick={() => undoPurchase(item.id)}>
						Deshacer
					</button>
				</div>
			{/each}

			<button class="finish-button" type="button" onclick={requestFinish}>
				Finalizar compra
			</button>
		</section>
	{/if}

	{#if showFinishConfirmation}
		<div class="dialog-backdrop" role="presentation">
			<div
				class="dialog"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="finish-title"
				aria-describedby="finish-description"
			>
				<h2 id="finish-title">¿Finalizar compra?</h2>

				<p id="finish-description">
					Todavía quedan
					{pending.length}
					{pending.length === 1 ? 'artículo pendiente' : 'artículos pendientes'}. Los pendientes
					permanecerán en la lista.
				</p>

				<div class="dialog-actions">
					<button class="secondary-button" type="button" onclick={cancelFinish}> Cancelar </button>

					<button class="confirm-button" type="button" onclick={finishShopping}> Finalizar </button>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.household {
		margin: 0 0 0.15rem;
		color: var(--muted);
		font-size: 0.875rem;
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		line-height: 1.15;
	}

	.add-button {
		display: flex;
		min-height: 2.75rem;
		align-items: center;
		gap: 0.35rem;
		padding: 0 0.9rem;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		font-weight: 600;
		text-decoration: none;
	}

	.add-button span:first-child {
		font-size: 1.35rem;
		font-weight: 400;
	}

	.feedback {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.6rem;
		background: var(--surface-soft);
		font-size: 0.85rem;
	}

	.feedback button {
		flex: 0 0 auto;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.group {
		margin-bottom: 2rem;
	}

	.section-heading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.section-heading h2,
	.suggestion-heading h2 {
		margin: 0;
		font-size: 1rem;
	}

	.section-heading > span {
		display: grid;
		min-width: 1.4rem;
		height: 1.4rem;
		place-items: center;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: var(--surface-soft);
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 600;
	}

	.shopping-row {
		display: flex;
		min-height: 3.5rem;
		align-items: center;
		border-bottom: 1px solid var(--surface-soft);
	}

	.shopping-item {
		display: flex;
		min-width: 0;
		min-height: 3.5rem;
		flex: 1;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.check {
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		flex: 0 0 auto;
		place-items: center;
		border: 1.5px solid #aaa;
		border-radius: 50%;
	}

	.check.checked {
		border-color: var(--accent);
		background: var(--accent);
		color: white;
		font-size: 0.8rem;
	}

	.item-name {
		min-width: 0;
		flex: 1;
	}

	.item-actions {
		position: relative;
		flex: 0 0 auto;
	}

	.menu-button {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.menu-button:hover {
		background: var(--surface-soft);
	}

	.menu {
		position: absolute;
		z-index: 10;
		top: 2.5rem;
		right: 0;
		width: 8rem;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		background: white;
		box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 12%);
	}

	.menu button {
		display: block;
		width: 100%;
		padding: 0.75rem;
		border: 0;
		background: white;
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--surface-soft);
	}

	.menu .danger {
		color: #a43b3b;
	}

	.suggestion-heading {
		margin-bottom: 0.5rem;
	}

	.suggestion-heading p {
		margin: 0.15rem 0 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.suggestion {
		display: flex;
		min-height: 3.5rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--surface-soft);
	}

	.suggestion > div {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.15rem;
	}

	.suggestion strong {
		font-size: 0.95rem;
	}

	.suggestion span {
		color: var(--muted);
		font-size: 0.8rem;
	}

	.suggestion button {
		flex: 0 0 auto;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: white;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.purchased-item {
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: center;
		gap: 0.75rem;
	}

	.purchased-item .item-name {
		color: var(--muted);
		text-decoration: line-through;
	}

	.undo-button {
		flex: 0 0 auto;
		padding: 0.5rem;
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.finish-button {
		width: 100%;
		min-height: 3rem;
		margin-top: 1rem;
		border: 0;
		border-radius: 0.65rem;
		background: var(--accent);
		color: white;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.empty {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.dialog-backdrop {
		position: fixed;
		z-index: 100;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: rgb(0 0 0 / 35%);
	}

	.dialog {
		width: min(100%, 26rem);
		padding: 1.25rem;
		border-radius: 0.875rem;
		background: white;
		box-shadow: 0 1rem 3rem rgb(0 0 0 / 20%);
	}

	.dialog h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}

	.dialog p {
		margin: 0;
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.dialog-actions {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.dialog-actions button {
		min-height: 2.75rem;
		border-radius: 0.6rem;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.secondary-button {
		border: 1px solid var(--line);
		background: white;
		color: var(--ink);
	}

	.confirm-button {
		border: 1px solid var(--ink);
		background: var(--accent);
		color: white;
	}

	h1 {
		font-size: 2.1rem;
	}
	.household {
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 0.3rem;
	}
	.add-button {
		border-radius: 1rem;
		min-height: 3rem;
		box-shadow: var(--shadow);
	}
	.group {
		padding: 1.15rem;
		border: 1px solid var(--line);
		border-radius: 1.25rem;
		background: white;
		box-shadow: var(--shadow);
		margin-bottom: 1rem;
	}
	.section-heading {
		margin-bottom: 0.75rem;
	}
	.section-heading > span {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.shopping-row:last-of-type {
		border-bottom: 0;
	}
	.item-name {
		overflow-wrap: anywhere;
	}
	.check {
		border-color: #a7bdb0;
		border-radius: 0.5rem;
	}
	.suggestions {
		background: #fffaf0;
		border-color: #ecdfbf;
	}
	.suggestion-heading h2 {
		color: var(--warning);
	}
	.suggestion button {
		color: var(--accent);
		border-color: var(--line);
		min-height: 2.75rem;
	}
	.suggestion:last-child {
		border-bottom: 0;
	}
	.feedback {
		background: var(--accent-soft);
		color: var(--accent);
		border-radius: 1rem;
	}
	.finish-button {
		border-radius: 0.9rem;
	}
	.dialog {
		border-radius: 1.3rem;
		padding: 1.5rem;
	}
</style>

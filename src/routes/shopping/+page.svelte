<script lang="ts">
	import { createFeedback } from '$lib/prototype/feedback.svelte';
	import InventoryRegularizationPanel from '$lib/components/InventoryRegularizationPanel.svelte';
	import ShoppingQuantityPanel from '$lib/components/ShoppingQuantityPanel.svelte';
	import { resolve } from '$app/paths';
	import {
		finalizeShopping as finalizePrototypeShopping,
		getPrototypeState,
		getShoppingSuggestions,
		getPendingInventoryUpdates,
		getLocationById,
		removePendingShoppingItem,
		purchaseShoppingItem,
		undoShoppingPurchase
	} from '$lib/prototype/state.svelte';

	const prototypeState = getPrototypeState();

	let householdName = $derived(prototypeState.householdName);

	function getLocationName(locationId: string | null): string {
		if (!locationId) return 'Sin ubicación';
		const location = getLocationById(locationId);
		return location?.name ?? 'Sin ubicación';
	}

	let shopping = $derived(prototypeState.shopping);

	let showFinishConfirmation = $state(false);
	let editId = $state<string | null>(null);
	let editItem = $derived(shopping.find((item) => item.id === editId));
	let editProduct = $derived(
		prototypeState.inventory.find((product) => product.id === editItem?.productId)
	);
	let purchaseId = $state<string | null>(null);
	let suggestionId = $state<string | null>(null);
	let purchaseItem = $derived(shopping.find((item) => item.id === purchaseId));
	let purchaseProduct = $derived(
		prototypeState.inventory.find((product) => product.id === purchaseItem?.productId)
	);
	let suggestionProduct = $derived(
		prototypeState.inventory.find((product) => product.id === suggestionId)
	);
	const feedback = createFeedback();

	let suggestions = $derived(getShoppingSuggestions());

	let pending = $derived(shopping.filter((item) => item.status === 'PENDING'));

	let purchased = $derived(
		shopping.filter((item) => item.status === 'PURCHASED' && !item.finalized)
	);
	let inventoryUpdates = $derived(getPendingInventoryUpdates());
	let unconfirmedCount = $derived(purchased.filter((item) => item.inventoryPending).length);

	function markAsPurchased(id: string) {
		if (!purchaseShoppingItem(id)) feedback.show('No se ha podido confirmar la compra.', true);
	}

	function undoPurchase(id: string) {
		const item = shopping.find((candidate) => candidate.id === id);

		if (!item) {
			return;
		}

		const undoneSuccessfully = undoShoppingPurchase(id);

		if (!undoneSuccessfully) {
			feedback.show(
				'No se puede deshacer: las existencias han cambiado y quedarían negativas. Ajusta la cantidad del inventario antes de intentarlo.',
				true
			);
			return;
		}

		feedback.clear();
	}

	function addSuggestion(productId: string) {
		suggestionId = productId;
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

		feedback.show(`${item.name} quitado de Compra.`);
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

		feedback.show(
			purchasedCount === 1
				? 'Compra finalizada. 1 artículo comprado.'
				: `Compra finalizada. ${purchasedCount} artículos comprados.`
		);
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

	{#if feedback.message}
		<div class="feedback" role="status">
			<span>{feedback.message}</span>

			<button type="button" aria-label="Cerrar mensaje" onclick={() => feedback.clear()}>
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
						{item.name} · {item.quantity}
						{item.quantityUnit === 'PACKS'
							? item.quantity === 1
								? 'pack'
								: 'packs'
							: item.quantity === 1
								? 'ud.'
								: 'uds.'}
						{#if item.note}<small class="item-note">{item.note}</small>{/if}
					</span>
				</button>

				<button
					class="reminder-button"
					type="button"
					aria-label={`Editar cantidad y nota de ${item.name}`}
					onclick={() => (editId = item.id)}>Editar</button
				>
				<button
					class="delete-button"
					type="button"
					aria-label={`Eliminar ${item.name} de Compra`}
					title="Eliminar de Compra"
					onclick={() => removePendingItem(item.id)}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m5 4v6m4-6v6" />
					</svg>
				</button>
			</div>
		{/each}

		{#if pending.length === 0}
			<p class="empty">No tienes nada pendiente.</p>
		{/if}
	</section>

	{#if suggestions.length > 0}
		<section class="group suggestions">
			<div class="suggestion-heading">
				<h2>
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" />
					</svg>
					Sugerencias
				</h2>
				<p>Productos que quizá quieras añadir a Compra</p>
			</div>

			{#each suggestions as item (item.id)}
				<div class="suggestion">
					<div>
						<strong>{item.name}</strong>
						<span>{getLocationName(item.locationId)}</span>
						<span
							class="suggestion-status"
							class:low={item.status === 'LOW'}
							class:out={item.status === 'OUT'}
						>
							{#if item.trackingMode !== 'STATUS'}{item.quantity}
								{item.quantity === 1 ? 'ud.' : 'uds.'} ·
							{/if}{item.status === 'OUT' ? 'No hay' : 'Poco'}{item.quantityNeedsReview
								? ' · Revisar cantidad'
								: ''}
						</span>
					</div>

					<div class="suggestion-actions">
						<button type="button" onclick={() => addSuggestion(item.id)}>Añadir</button>
					</div>
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
				<div class="shopping-row purchased-row" id={`inventory-update-${item.id}`}>
					<div class="purchased-item">
						<span class="check checked" aria-hidden="true"> ✓ </span>

						<span class="item-name"
							><span class="purchased-name">
								{item.name} · {item.quantity}
								{item.quantityUnit === 'PACKS'
									? item.quantity === 1
										? 'pack'
										: 'packs'
									: item.quantity === 1
										? 'ud.'
										: 'uds.'}
							</span>{#if item.note}<small class="item-note">{item.note}</small>{/if}
							{#if item.inventoryPending}<button
									class="edit-purchased"
									type="button"
									aria-label={`Editar cantidad y nota de ${item.name}`}
									onclick={() => (editId = item.id)}>Editar compra</button
								>{/if}
						</span>
					</div>

					{#if item.inventoryPending}<button
							class="reminder-button"
							type="button"
							aria-label={`Actualizar inventario de ${item.name}`}
							onclick={() => (purchaseId = item.id)}>Actualizar</button
						>{/if}
					<button class="undo-button" type="button" onclick={() => undoPurchase(item.id)}>
						Deshacer
					</button>
				</div>
			{/each}

			{#if unconfirmedCount > 0}<p class="inventory-notice">
					Puedes finalizar ahora. {unconfirmedCount}
					{unconfirmedCount === 1 ? 'producto quedará pendiente' : 'productos quedarán pendientes'} de
					actualizar en casa.
				</p>{/if}
			<button class="finish-button" type="button" onclick={requestFinish}>
				Finalizar compra
			</button>
		</section>
	{/if}

	{#if inventoryUpdates.length > 0}
		<section
			class="group inventory-updates"
			id="inventory-updates"
			aria-labelledby="inventory-updates-title"
		>
			<div class="section-heading">
				<h2 id="inventory-updates-title">Actualizar inventario</h2>
				<span>{inventoryUpdates.length}</span>
			</div>
			<p class="inventory-notice">
				Ya lo has comprado. Confirma las cantidades cuando llegues a casa; puedes seguir preparando
				la próxima compra.
			</p>
			{#each inventoryUpdates as item (item.id)}
				<div class="shopping-row update-row" id={`inventory-update-${item.id}`}>
					<div class="update-info">
						<strong>{item.name}</strong><small
							>{item.quantity}
							{item.quantityUnit === 'PACKS' ? 'packs anotados' : 'uds. anotadas'}{item.note
								? ` · ${item.note}`
								: ''}</small
						>
					</div>
					<button
						class="reminder-button"
						type="button"
						aria-label={`Actualizar inventario de ${item.name}`}
						onclick={() => (purchaseId = item.id)}>Actualizar</button
					>
					<button
						class="undo-button"
						type="button"
						aria-label={`Deshacer compra de ${item.name}`}
						onclick={() => undoPurchase(item.id)}>Deshacer</button
					>
				</div>
			{/each}
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

{#if purchaseItem && purchaseProduct}
	<InventoryRegularizationPanel
		item={purchaseItem}
		product={purchaseProduct}
		onClose={() => (purchaseId = null)}
		onSaved={() => {
			purchaseId = null;
			feedback.show('Inventario actualizado.');
		}}
	/>
{/if}
{#if suggestionProduct}
	<ShoppingQuantityPanel
		product={suggestionProduct}
		onClose={() => (suggestionId = null)}
		onSaved={() => {
			suggestionId = null;
			feedback.show('Producto añadido a Compra.');
		}}
	/>
{/if}

{#if editItem}
	<ShoppingQuantityPanel
		item={editItem}
		product={editProduct}
		editOnly
		onClose={() => (editId = null)}
		onSaved={() => (editId = null)}
	/>
{/if}

<style>
	.purchased-row,
	.update-row {
		scroll-margin-top: 1rem;
	}
	.purchased-row .undo-button,
	.update-row .undo-button {
		min-height: 2.75rem;
	}
	.edit-purchased {
		display: block;
		min-height: 2.75rem;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.inventory-notice {
		color: var(--muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.inventory-updates {
		scroll-margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.update-info {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.update-info small {
		display: block;
		margin-top: 0.25rem;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.item-note {
		display: block;
		color: var(--muted);
		margin-top: 0.25rem;
		font-weight: normal;
	}
	.reminder-button {
		border: 0;
		background: transparent;
		color: var(--accent);
		min-height: 2.75rem;
		cursor: pointer;
	}

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
		color: var(--on-accent);
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
		border: 1.5px solid var(--muted);
		border-radius: 50%;
	}

	.check.checked {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.8rem;
	}

	.item-name {
		min-width: 0;
		flex: 1;
	}

	.delete-button {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		flex: 0 0 auto;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--danger);
		cursor: pointer;
	}

	.delete-button svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.delete-button:hover {
		background: var(--danger-soft);
		color: var(--danger);
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
		border-bottom: 1px solid var(--suggestion-line);
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

	.suggestion-actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 0.5rem;
	}

	.suggestion .suggestion-status {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		align-self: flex-start;
		margin-top: 0.15rem;
		color: var(--warning);
		font-size: 0.72rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.suggestion-status::before {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: currentColor;
		content: '';
	}

	.suggestion .suggestion-status.out {
		color: var(--danger);
	}

	.suggestion-actions button {
		flex: 0 0 auto;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
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
		overflow-wrap: anywhere;
	}

	.purchased-name {
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
		color: var(--on-accent);
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
		background: var(--surface);
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
		background: var(--surface);
		color: var(--ink);
	}

	.confirm-button {
		border: 1px solid var(--ink);
		background: var(--accent);
		color: var(--on-accent);
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
		background: var(--surface);
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
		border-color: var(--muted);
		border-radius: 0.5rem;
	}
	.suggestions {
		background: var(--suggestion-surface);
		border-color: var(--suggestion-line);
	}
	.suggestion-heading h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--suggestion-heading);
	}
	.suggestion-actions button {
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

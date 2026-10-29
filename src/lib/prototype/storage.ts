import { inventoryStatus, validQuantity } from './quantities';
import type { PrototypeState } from './seed';
import { CATEGORY_PALETTE, createPrototypeSeed } from './seed';

const STORAGE_KEY = 'homestock-prototype-v4';

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

export function loadPrototypeState(): PrototypeState {
	if (!isBrowser()) {
		return createPrototypeSeed();
	}

	const stored = window.localStorage.getItem(STORAGE_KEY);

	if (!stored) {
		return createPrototypeSeed();
	}

	try {
		const state = JSON.parse(stored) as PrototypeState;
		const oldThresholdIds = new Set(
			state.inventory.filter((product) => 'autoThreshold' in product).map((product) => product.id)
		);
		// Legacy qualitative states cannot reveal an exact count. Keep every product,
		// use the new default provisionally, and require a visible stock review.
		state.inventory = state.inventory.map((product) => {
			const known = validQuantity(product.quantity);
			const quantity = known ? product.quantity : product.status === 'OUT' ? 0 : 1;
			const lowThreshold = validQuantity(product.lowThreshold) ? product.lowThreshold : 1;
			const trackingMode =
				product.trackingMode === 'STATUS' ? ('STATUS' as const) : ('QUANTITY' as const);
			const migrated = {
				...product,
				active: product.active ?? true,
				trackingMode,
				quantity: trackingMode === 'STATUS' ? 0 : quantity,
				lowThreshold,
				packSize:
					trackingMode !== 'STATUS' && validQuantity(product.packSize, 1) ? product.packSize : null,
				quantityNeedsReview:
					trackingMode === 'STATUS'
						? false
						: known
							? !!product.quantityNeedsReview
							: product.status !== 'OUT',
				status: trackingMode === 'STATUS' ? product.status : inventoryStatus(quantity, lowThreshold)
			};
			Reflect.deleteProperty(migrated, 'autoThreshold');
			return migrated;
		});
		state.shopping = state.shopping.map((item) => ({
			...item,
			quantity: validQuantity(item.quantity, 1) ? item.quantity : 1,
			purchaseDelta:
				typeof item.purchaseDelta === 'number' && validQuantity(Math.abs(item.purchaseDelta))
					? item.purchaseDelta
					: null,
			inventoryPending: item.status === 'PURCHASED' && item.inventoryPending === true,
			finalized:
				item.status === 'PURCHASED' && item.inventoryPending === true && item.finalized === true,
			quantityUnit: item.quantityUnit === 'PACKS' ? 'PACKS' : 'UNITS'
		}));
		for (const product of state.inventory) {
			if (
				oldThresholdIds.has(product.id) &&
				product.active &&
				!product.quantityNeedsReview &&
				product.replenishmentMode === 'AUTOMATIC' &&
				product.quantity <= product.lowThreshold &&
				!state.shopping.some((item) => item.productId === product.id)
			) {
				state.shopping.push({
					id: crypto.randomUUID(),
					name: product.name,
					status: 'PENDING',
					source: 'AUTO',
					productId: product.id,
					quantity: 1,
					purchaseDelta: null
				});
			}
		}

		// Assign stable palette colors to categories saved before color support.
		state.categories = state.categories.map((category, index) => ({
			...category,
			color:
				CATEGORY_PALETTE.find((color) => color.id === category.color)?.id ??
				CATEGORY_PALETTE[index % CATEGORY_PALETTE.length].id
		}));
		return state;
	} catch {
		return createPrototypeSeed();
	}
}

export function savePrototypeState(state: PrototypeState): void {
	if (!isBrowser()) {
		return;
	}

	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetPrototypeState(): PrototypeState {
	const state = createPrototypeSeed();

	savePrototypeState(state);

	return state;
}

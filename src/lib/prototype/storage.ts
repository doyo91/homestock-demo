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
		// Legacy qualitative states cannot reveal an exact count. Keep every product,
		// use the new default provisionally, and require a visible stock review.
		state.inventory = state.inventory.map((product) => {
			const known = validQuantity(product.quantity);
			const quantity = known ? product.quantity : product.status === 'OUT' ? 0 : 1;
			const lowThreshold = validQuantity(product.lowThreshold) ? product.lowThreshold : 1;
			const autoThreshold = validQuantity(product.autoThreshold)
				? Math.min(product.autoThreshold, lowThreshold)
				: 0;
			return {
				...product,
				active: product.active ?? true,
				quantity,
				lowThreshold,
				autoThreshold,
				quantityNeedsReview: known ? !!product.quantityNeedsReview : product.status !== 'OUT',
				status: inventoryStatus(quantity, lowThreshold)
			};
		});
		state.shopping = state.shopping.map((item) => ({
			...item,
			quantity: validQuantity(item.quantity, 1) ? item.quantity : 1,
			purchaseDelta: validQuantity(item.purchaseDelta) ? item.purchaseDelta : null
		}));
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

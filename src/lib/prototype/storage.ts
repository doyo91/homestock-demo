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
		// Existing demo data predates the active flag. Keep those products visible.
		state.inventory = state.inventory.map((product) => ({
			...product,
			active: product.active ?? true
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

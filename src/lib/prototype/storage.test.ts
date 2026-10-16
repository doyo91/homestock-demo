import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPrototypeSeed } from './seed';
import {
	deleteProduct,
	resetPrototype,
	getPrototypeState,
	addProductToShopping,
	purchaseShoppingItem,
	undoShoppingPurchase
} from './state.svelte';
import { loadPrototypeState, savePrototypeState } from './storage';

afterEach(() => vi.unstubAllGlobals());

describe('Persistencia de productos activos', () => {
	it('mantiene visibles los productos guardados antes de introducir active', () => {
		const legacy = createPrototypeSeed();
		const serialized = JSON.stringify(legacy, (key, value) =>
			key === 'active' ? undefined : value
		);
		vi.stubGlobal('window', { localStorage: { getItem: () => serialized } });
		expect(loadPrototypeState().inventory.every((product) => product.active)).toBe(true);
	});

	it('conserva la desactivación al guardar y volver a cargar', () => {
		let stored: string | null = null;
		vi.stubGlobal('window', {
			localStorage: {
				getItem: () => stored,
				setItem: (_key: string, value: string) => {
					stored = value;
				}
			}
		});
		const state = createPrototypeSeed();
		state.inventory[0].active = false;
		savePrototypeState(state);
		expect(loadPrototypeState().inventory[0].active).toBe(false);
	});
});

describe('Migración de colores de categoría', () => {
	it('asigna colores por defecto a categorías guardadas sin color', () => {
		const legacy = createPrototypeSeed();
		legacy.categories = legacy.categories.map(({ id, name, active }) => ({
			id,
			name,
			active
		})) as typeof legacy.categories;
		const serialized = JSON.stringify(legacy);
		vi.stubGlobal('window', { localStorage: { getItem: () => serialized } });

		const categories = loadPrototypeState().categories;
		expect(categories.map((category) => category.color)).toEqual([
			'sage',
			'blue',
			'lavender',
			'rose'
		]);
	});
});

describe('Persistencia de la eliminación definitiva', () => {
	it('no recupera el producto ni sus pendientes al recargar', () => {
		let stored: string | null = null;
		vi.stubGlobal('window', {
			localStorage: {
				getItem: () => stored,
				setItem: (_key: string, value: string) => {
					stored = value;
				}
			}
		});
		resetPrototype();
		expect(deleteProduct('3')).toBe(true);
		const restored = loadPrototypeState();
		expect(restored.inventory.some((product) => product.id === '3')).toBe(false);
		expect(restored.shopping.some((item) => item.productId === '3')).toBe(false);
	});
});

describe('Persistencia y migración de cantidades', () => {
	it('migra existencias desconocidas como provisionales y conserva productos y compras', () => {
		const legacy = createPrototypeSeed();
		const stored = JSON.stringify(legacy, (key, value) =>
			[
				'quantity',
				'lowThreshold',
				'autoThreshold',
				'quantityNeedsReview',
				'purchaseDelta'
			].includes(key)
				? undefined
				: value
		);
		vi.stubGlobal('window', { localStorage: { getItem: () => stored } });
		const restored = loadPrototypeState();
		expect(restored.inventory).toHaveLength(4);
		expect(restored.inventory.find((product) => product.id === '2')).toMatchObject({
			quantity: 1,
			status: 'LOW',
			quantityNeedsReview: true
		});
		expect(restored.inventory.find((product) => product.id === '3')).toMatchObject({
			quantity: 0,
			status: 'OUT',
			quantityNeedsReview: false
		});
		expect(restored.shopping).toHaveLength(2);
		expect(restored.shopping[0]).toMatchObject({ quantity: 1, purchaseDelta: null });
	});

	it('conserva la cantidad, los límites iguales y la revisión confirmada al recargar', () => {
		const state = createPrototypeSeed();
		Object.assign(state.inventory[0], {
			quantity: 5,
			lowThreshold: 2,
			autoThreshold: 2,
			quantityNeedsReview: false,
			status: 'OUT'
		});
		const stored = JSON.stringify(state);
		vi.stubGlobal('window', { localStorage: { getItem: () => stored } });
		expect(loadPrototypeState().inventory[0]).toMatchObject({
			quantity: 5,
			lowThreshold: 2,
			autoThreshold: 2,
			quantityNeedsReview: false,
			status: 'AVAILABLE'
		});
	});

	it('persiste el incremento neto de compra para deshacer después de recargar', () => {
		let stored: string | null = null;
		vi.stubGlobal('window', {
			localStorage: {
				getItem: () => stored,
				setItem: (_key: string, value: string) => {
					stored = value;
				}
			}
		});
		resetPrototype();
		addProductToShopping('1', 3);
		const item = getPrototypeState().shopping.find((item) => item.productId === '1')!;
		purchaseShoppingItem(item.id, 3, true);
		const restored = loadPrototypeState();
		expect(restored.inventory[0].quantity).toBe(3);
		expect(restored.shopping.find((candidate) => candidate.id === item.id)?.purchaseDelta).toBe(2);
		Object.assign(getPrototypeState(), restored);
		expect(undoShoppingPurchase(item.id)).toBe(true);
		expect(loadPrototypeState().inventory[0].quantity).toBe(1);
	});

	it('deshacer una compra antigua no inventa un incremento y solicita revisar el recuento', () => {
		resetPrototype();
		const state = getPrototypeState();
		const item = state.shopping.find((item) => item.productId === '3')!;
		item.status = 'PURCHASED';
		item.purchaseDelta = null;
		expect(undoShoppingPurchase(item.id)).toBe(true);
		expect(state.inventory.find((product) => product.id === '3')).toMatchObject({
			quantity: 0,
			quantityNeedsReview: true
		});
	});
});

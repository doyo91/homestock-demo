import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPrototypeSeed } from './seed';
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

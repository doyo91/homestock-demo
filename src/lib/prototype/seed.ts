import type {
	InventoryStatus,
	ReplenishmentMode,
	ShoppingItemSource,
	ShoppingItemStatus
} from '$lib/prototype/types';

export interface PrototypeCategory {
	id: string;
	name: string;
	active: boolean;
}

export interface PrototypeLocation {
	id: string;
	name: string;
	active: boolean;
}

export interface PrototypeInventoryItem {
	id: string;
	name: string;
	categoryId: string | null;
	locationId: string | null;
	status: InventoryStatus;
	replenishmentMode: ReplenishmentMode;
}

export interface PrototypeShoppingItem {
	id: string;
	name: string;
	status: ShoppingItemStatus;
	source: ShoppingItemSource;
	productId: string | null;
	previousInventoryStatus: InventoryStatus | null;
}

export interface PrototypeState {
	categories: PrototypeCategory[];
	locations: PrototypeLocation[];
	inventory: PrototypeInventoryItem[];
	shopping: PrototypeShoppingItem[];
	defaultScreen: 'INVENTORY' | 'SHOPPING';
	householdName: string;
}

export function createPrototypeSeed(): PrototypeState {
	const categoryIdAlimentacion = 'cat-1';
	const categoryIdLimpieza = 'cat-2';
	const categoryIdHigiene = 'cat-3';
	const categoryIdHogar = 'cat-4';

	const locationIdNevera = 'loc-1';
	const locationIdCongelador = 'loc-2';
	const locationIdDespensa = 'loc-3';
	const locationIdLavadero = 'loc-4';

	return {
		categories: [
			{ id: categoryIdAlimentacion, name: 'Alimentación', active: true },
			{ id: categoryIdLimpieza, name: 'Limpieza', active: true },
			{ id: categoryIdHigiene, name: 'Higiene', active: true },
			{ id: categoryIdHogar, name: 'Hogar', active: true }
		],
		locations: [
			{ id: locationIdNevera, name: 'Nevera', active: true },
			{ id: locationIdCongelador, name: 'Congelador', active: true },
			{ id: locationIdDespensa, name: 'Despensa', active: true },
			{ id: locationIdLavadero, name: 'Lavadero', active: true }
		],
		inventory: [
			{
				id: '1',
				name: 'Leche',
				categoryId: categoryIdAlimentacion,
				locationId: locationIdNevera,
				status: 'LOW',
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '2',
				name: 'Huevos',
				categoryId: categoryIdAlimentacion,
				locationId: locationIdNevera,
				status: 'AVAILABLE',
				replenishmentMode: 'MANUAL'
			},
			{
				id: '3',
				name: 'Papel higiénico',
				categoryId: categoryIdHigiene,
				locationId: locationIdDespensa,
				status: 'OUT',
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '4',
				name: 'Detergente',
				categoryId: categoryIdLimpieza,
				locationId: locationIdLavadero,
				status: 'AVAILABLE',
				replenishmentMode: 'MANUAL'
			}
		],
		shopping: [
			{
				id: '1',
				name: 'Papel higiénico',
				status: 'PENDING',
				source: 'AUTO',
				productId: '3',
				previousInventoryStatus: null
			},
			{
				id: '2',
				name: 'Pan',
				status: 'PENDING',
				source: 'MANUAL',
				productId: null,
				previousInventoryStatus: null
			}
		],
		defaultScreen: 'INVENTORY',
		householdName: 'Casa'
	};
}

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
	color: CategoryColor;
}

export const CATEGORY_PALETTE = [
	{ id: 'sage', name: 'Salvia', tone: '#54806f', soft: '#edf4f0' },
	{ id: 'blue', name: 'Azul', tone: '#4d7898', soft: '#edf3f7' },
	{ id: 'lavender', name: 'Lavanda', tone: '#78699a', soft: '#f1eef6' },
	{ id: 'rose', name: 'Rosa', tone: '#a85f79', soft: '#f7eef1' },
	{ id: 'coral', name: 'Coral', tone: '#b96d58', soft: '#f8f0ec' },
	{ id: 'amber', name: 'Mostaza', tone: '#907536', soft: '#f6f2e7' },
	{ id: 'teal', name: 'Verde azulado', tone: '#43817e', soft: '#edf5f4' },
	{ id: 'slate', name: 'Pizarra', tone: '#667481', soft: '#eff2f4' }
] as const;

export type CategoryColor = (typeof CATEGORY_PALETTE)[number]['id'];

export function getCategoryColor(color: CategoryColor | undefined) {
	return CATEGORY_PALETTE.find((item) => item.id === color) ?? CATEGORY_PALETTE[0];
}

export interface PrototypeLocation {
	id: string;
	name: string;
	active: boolean;
}

export interface PrototypeInventoryItem {
	active: boolean;
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
			{ id: categoryIdAlimentacion, name: 'Alimentación', active: true, color: 'sage' },
			{ id: categoryIdLimpieza, name: 'Limpieza', active: true, color: 'blue' },
			{ id: categoryIdHigiene, name: 'Higiene', active: true, color: 'lavender' },
			{ id: categoryIdHogar, name: 'Hogar', active: true, color: 'rose' }
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
				active: true,
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '2',
				name: 'Huevos',
				categoryId: categoryIdAlimentacion,
				locationId: locationIdNevera,
				status: 'AVAILABLE',
				active: true,
				replenishmentMode: 'MANUAL'
			},
			{
				id: '3',
				name: 'Papel higiénico',
				categoryId: categoryIdHigiene,
				locationId: locationIdDespensa,
				status: 'OUT',
				active: true,
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '4',
				name: 'Detergente',
				categoryId: categoryIdLimpieza,
				locationId: locationIdLavadero,
				status: 'AVAILABLE',
				active: true,
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

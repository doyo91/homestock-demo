import type {
	InventoryStatus,
	TrackingMode,
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
	{ id: 'sage', name: 'Salvia', tone: '#54806f' },
	{ id: 'blue', name: 'Azul', tone: '#4d7898' },
	{ id: 'lavender', name: 'Lavanda', tone: '#78699a' },
	{ id: 'rose', name: 'Rosa', tone: '#a85f79' },
	{ id: 'coral', name: 'Coral', tone: '#b96d58' },
	{ id: 'amber', name: 'Mostaza', tone: '#907536' },
	{ id: 'teal', name: 'Verde azulado', tone: '#43817e' },
	{ id: 'slate', name: 'Pizarra', tone: '#667481' }
] as const;

export type CategoryColor = (typeof CATEGORY_PALETTE)[number]['id'];

export function getCategoryColor(color: CategoryColor | undefined) {
	const category = CATEGORY_PALETTE.find((item) => item.id === color) ?? CATEGORY_PALETTE[0];
	return {
		...category,
		soft: `color-mix(in srgb, ${category.tone} var(--category-tint), var(--surface))`
	};
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
	trackingMode: TrackingMode;
	quantity: number;
	lowThreshold: number;
	packSize?: number | null;
	quantityNeedsReview: boolean;
	replenishmentMode: ReplenishmentMode;
}

export interface PrototypeShoppingItem {
	id: string;
	name: string;
	status: ShoppingItemStatus;
	source: ShoppingItemSource;
	productId: string | null;
	quantity: number;
	purchaseDelta: number | null;
	inventoryPending?: boolean;
	finalized?: boolean;
	quantityUnit?: 'UNITS' | 'PACKS';
	note?: string;
	previousInventoryStatus?: InventoryStatus | null;
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
				quantity: 1,
				lowThreshold: 1,
				trackingMode: 'QUANTITY',
				quantityNeedsReview: false,
				active: true,
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '2',
				name: 'Huevos',
				categoryId: categoryIdAlimentacion,
				locationId: locationIdNevera,
				status: 'AVAILABLE',
				quantity: 3,
				lowThreshold: 1,
				trackingMode: 'QUANTITY',
				quantityNeedsReview: false,
				active: true,
				replenishmentMode: 'MANUAL'
			},
			{
				id: '3',
				name: 'Papel higiénico',
				categoryId: categoryIdHigiene,
				locationId: locationIdDespensa,
				status: 'OUT',
				quantity: 0,
				lowThreshold: 1,
				trackingMode: 'QUANTITY',
				quantityNeedsReview: false,
				active: true,
				replenishmentMode: 'AUTOMATIC'
			},
			{
				id: '4',
				name: 'Detergente',
				categoryId: categoryIdLimpieza,
				locationId: locationIdLavadero,
				status: 'AVAILABLE',
				quantity: 3,
				lowThreshold: 1,
				trackingMode: 'QUANTITY',
				quantityNeedsReview: false,
				active: true,
				replenishmentMode: 'MANUAL'
			}
		],
		shopping: [
			{
				id: '3',
				name: 'Leche',
				status: 'PENDING',
				source: 'AUTO',
				productId: '1',
				quantity: 1,
				purchaseDelta: null
			},
			{
				id: '1',
				name: 'Papel higiénico',
				status: 'PENDING',
				source: 'AUTO',
				productId: '3',
				quantity: 1,
				purchaseDelta: null
			},
			{
				id: '2',
				name: 'Pan',
				status: 'PENDING',
				source: 'MANUAL',
				productId: null,
				quantity: 1,
				purchaseDelta: null
			}
		],
		defaultScreen: 'INVENTORY',
		householdName: 'Casa'
	};
}

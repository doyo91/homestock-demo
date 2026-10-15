import type { InventoryStatus } from '$lib/prototype/types';
import { CATEGORY_PALETTE, type CategoryColor } from './seed';
import { loadPrototypeState, resetPrototypeState, savePrototypeState } from './storage';

let state = $state(loadPrototypeState());

export function getPrototypeState() {
	return state;
}

export function getActiveCategories() {
	return state.categories.filter((category) => category.active);
}

export function getActiveLocations() {
	return state.locations.filter((location) => location.active);
}

export function getCategoryById(id: string) {
	return state.categories.find((category) => category.id === id);
}

export function getLocationById(id: string) {
	return state.locations.find((location) => location.id === id);
}

export function getProductById(id: string) {
	return state.inventory.find((product) => product.id === id);
}

export function persistPrototypeState(): void {
	savePrototypeState(state);
}

export function resetPrototype(): void {
	state = resetPrototypeState();
}

export function deleteProduct(productId: string): boolean {
	if (!getProductById(productId)) return false;
	state.inventory = state.inventory.filter((product) => product.id !== productId);
	state.shopping = state.shopping.filter((item) => item.productId !== productId);
	persistPrototypeState();
	return true;
}

export function changeInventoryStatus(productId: string, status: InventoryStatus): boolean {
	const product = state.inventory.find((item) => item.id === productId);

	if (!product || !product.active) {
		return false;
	}

	const previousStatus = product.status;

	if (previousStatus === status) {
		return true;
	}

	product.status = status;

	if (product.replenishmentMode === 'AUTOMATIC') {
		if (status === 'OUT') {
			const existingItem = state.shopping.find((item) => item.productId === productId);

			if (!existingItem) {
				state.shopping.push({
					id: crypto.randomUUID(),
					name: product.name,
					status: 'PENDING',
					source: 'AUTO',
					productId: product.id,
					previousInventoryStatus: null
				});
			}
		} else if (previousStatus === 'OUT') {
			const automaticPendingIndex = state.shopping.findIndex(
				(item) =>
					item.productId === productId && item.source === 'AUTO' && item.status === 'PENDING'
			);

			if (automaticPendingIndex !== -1) {
				state.shopping.splice(automaticPendingIndex, 1);
			}
		}
	}

	persistPrototypeState();

	return true;
}

export function addProductToShopping(productId: string): boolean {
	const product = state.inventory.find((item) => item.id === productId);

	if (!product) {
		return false;
	}

	const alreadyExists = state.shopping.some((item) => item.productId === productId);

	if (alreadyExists) {
		return false;
	}

	state.shopping.push({
		id: crypto.randomUUID(),
		name: product.name,
		status: 'PENDING',
		source: 'MANUAL',
		productId,
		previousInventoryStatus: null
	});

	persistPrototypeState();

	return true;
}

export function addOneOffShoppingItem(name: string): boolean {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return false;
	}

	state.shopping.push({
		id: crypto.randomUUID(),
		name: trimmedName,
		status: 'PENDING',
		source: 'MANUAL',
		productId: null,
		previousInventoryStatus: null
	});

	persistPrototypeState();

	return true;
}

export function saveShoppingItemAsProduct(name: string): string | null {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return null;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const alreadyExists = state.inventory.some(
		(item) => item.name.trim().toLocaleLowerCase() === normalizedName
	);

	if (alreadyExists) {
		return null;
	}

	const productId = crypto.randomUUID();

	state.inventory.push({
		id: productId,
		name: trimmedName,
		categoryId: null,
		locationId: null,
		status: 'OUT',
		active: true,
		replenishmentMode: 'MANUAL'
	});

	state.shopping.push({
		id: crypto.randomUUID(),
		name: trimmedName,
		status: 'PENDING',
		source: 'MANUAL',
		productId,
		previousInventoryStatus: null
	});

	persistPrototypeState();

	return productId;
}

export function purchaseShoppingItem(id: string): boolean {
	const item = state.shopping.find((candidate) => candidate.id === id);

	if (!item || item.status !== 'PENDING') {
		return false;
	}

	if (item.productId !== null) {
		const product = state.inventory.find((candidate) => candidate.id === item.productId);

		if (!product) {
			return false;
		}

		item.previousInventoryStatus = product.status;
		product.status = 'AVAILABLE';
	}

	item.status = 'PURCHASED';

	persistPrototypeState();

	return true;
}

export function undoShoppingPurchase(id: string): boolean {
	const item = state.shopping.find((candidate) => candidate.id === id);

	if (!item || item.status !== 'PURCHASED') {
		return false;
	}

	if (item.productId !== null) {
		const product = state.inventory.find((candidate) => candidate.id === item.productId);

		if (!product || item.previousInventoryStatus === null) {
			return false;
		}

		product.status = item.previousInventoryStatus;
	}

	item.status = 'PENDING';
	item.previousInventoryStatus = null;

	persistPrototypeState();

	return true;
}

export function removePendingShoppingItem(id: string): boolean {
	const index = state.shopping.findIndex((item) => item.id === id && item.status === 'PENDING');

	if (index === -1) {
		return false;
	}

	state.shopping.splice(index, 1);

	persistPrototypeState();

	return true;
}

export function finalizeShopping(): number {
	const purchasedCount = state.shopping.filter((item) => item.status === 'PURCHASED').length;

	if (purchasedCount === 0) {
		return 0;
	}

	state.shopping = state.shopping.filter((item) => item.status !== 'PURCHASED');

	persistPrototypeState();

	return purchasedCount;
}

export function createProduct(
	name: string,
	status: InventoryStatus,
	categoryId: string | null,
	locationId: string | null,
	replenishmentMode: 'MANUAL' | 'AUTOMATIC'
): string | null {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return null;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const alreadyExists = state.inventory.some(
		(item) => item.name.trim().toLocaleLowerCase() === normalizedName
	);

	if (alreadyExists) {
		return null;
	}

	const productId = crypto.randomUUID();

	state.inventory.push({
		id: productId,
		name: trimmedName,
		categoryId: categoryId || null,
		locationId: locationId || null,
		status,
		active: true,
		replenishmentMode
	});

	persistPrototypeState();

	return productId;
}

export function updateProduct(
	productId: string,
	name: string,
	status: InventoryStatus,
	categoryId: string | null,
	locationId: string | null,
	replenishmentMode: 'MANUAL' | 'AUTOMATIC'
): boolean {
	const product = state.inventory.find((item) => item.id === productId);

	if (!product) {
		return false;
	}

	const trimmedName = name.trim();

	if (!trimmedName) {
		return false;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const duplicate = state.inventory.some(
		(item) => item.id !== productId && item.name.trim().toLocaleLowerCase() === normalizedName
	);

	if (duplicate) {
		return false;
	}

	product.name = trimmedName;
	product.status = status;
	product.categoryId = categoryId || null;
	product.locationId = locationId || null;
	product.replenishmentMode = replenishmentMode;

	persistPrototypeState();

	return true;
}

export function createCategory(name: string): string | null {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return null;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const alreadyExists = state.categories.some(
		(category) => category.name.toLocaleLowerCase() === normalizedName
	);

	if (alreadyExists) {
		return null;
	}

	const categoryId = crypto.randomUUID();

	state.categories.push({
		id: categoryId,
		name: trimmedName,
		active: true,
		color: CATEGORY_PALETTE[state.categories.length % CATEGORY_PALETTE.length].id
	});

	persistPrototypeState();

	return categoryId;
}

export function updateCategory(categoryId: string, name: string): boolean {
	const category = state.categories.find((item) => item.id === categoryId);

	if (!category) {
		return false;
	}

	const trimmedName = name.trim();

	if (!trimmedName) {
		return false;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const duplicate = state.categories.some(
		(item) => item.id !== categoryId && item.name.toLocaleLowerCase() === normalizedName
	);

	if (duplicate) {
		return false;
	}

	category.name = trimmedName;

	persistPrototypeState();

	return true;
}

export function setCategoryColor(categoryId: string, color: CategoryColor): boolean {
	const category = state.categories.find((item) => item.id === categoryId);

	if (!category || !CATEGORY_PALETTE.some((item) => item.id === color)) {
		return false;
	}

	category.color = color;
	persistPrototypeState();
	return true;
}

export function toggleCategoryActive(categoryId: string): boolean {
	const category = state.categories.find((item) => item.id === categoryId);

	if (!category) {
		return false;
	}

	category.active = !category.active;

	persistPrototypeState();

	return true;
}

export function moveCategory(categoryId: string, direction: -1 | 1): boolean {
	const index = state.categories.findIndex((item) => item.id === categoryId);
	const targetIndex = index + direction;

	if (index === -1 || targetIndex < 0 || targetIndex >= state.categories.length) {
		return false;
	}

	const reordered = [...state.categories];

	[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

	state.categories = reordered;

	persistPrototypeState();

	return true;
}

export function createLocation(name: string): string | null {
	const trimmedName = name.trim();

	if (!trimmedName) {
		return null;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const alreadyExists = state.locations.some(
		(location) => location.name.toLocaleLowerCase() === normalizedName
	);

	if (alreadyExists) {
		return null;
	}

	const locationId = crypto.randomUUID();

	state.locations.push({
		id: locationId,
		name: trimmedName,
		active: true
	});

	persistPrototypeState();

	return locationId;
}

export function updateLocation(locationId: string, name: string): boolean {
	const location = state.locations.find((item) => item.id === locationId);

	if (!location) {
		return false;
	}

	const trimmedName = name.trim();

	if (!trimmedName) {
		return false;
	}

	const normalizedName = trimmedName.toLocaleLowerCase();

	const duplicate = state.locations.some(
		(item) => item.id !== locationId && item.name.toLocaleLowerCase() === normalizedName
	);

	if (duplicate) {
		return false;
	}

	location.name = trimmedName;

	persistPrototypeState();

	return true;
}

export function toggleLocationActive(locationId: string): boolean {
	const location = state.locations.find((item) => item.id === locationId);

	if (!location) {
		return false;
	}

	location.active = !location.active;

	persistPrototypeState();

	return true;
}

export function moveLocation(locationId: string, direction: -1 | 1): boolean {
	const index = state.locations.findIndex((item) => item.id === locationId);
	const targetIndex = index + direction;

	if (index === -1 || targetIndex < 0 || targetIndex >= state.locations.length) {
		return false;
	}

	const reordered = [...state.locations];

	[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

	state.locations = reordered;

	persistPrototypeState();

	return true;
}

export function setDefaultScreen(screen: 'INVENTORY' | 'SHOPPING'): void {
	state.defaultScreen = screen;
	persistPrototypeState();
}

export function setHouseholdName(name: string): void {
	state.householdName = name.trim();
	persistPrototypeState();
}

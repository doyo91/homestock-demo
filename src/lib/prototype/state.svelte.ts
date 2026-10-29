import type { InventoryStatus, TrackingMode } from './types';
import { inventoryStatus, validQuantity } from './quantities';
import type { PrototypeInventoryItem } from './seed';
import { CATEGORY_PALETTE, type CategoryColor } from './seed';
import { loadPrototypeState, resetPrototypeState, savePrototypeState } from './storage';

let state = $state(loadPrototypeState());

export function getPrototypeState() {
	return state;
}

export function getShoppingSuggestions() {
	return state.inventory.filter(
		(product) =>
			product.active &&
			needsReplenishment(product) &&
			!state.shopping.some((item) => item.productId === product.id)
	);
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

function shoppingEntry(product: PrototypeInventoryItem, source: 'AUTO' | 'MANUAL', quantity = 1) {
	return {
		id: crypto.randomUUID(),
		name: product.name,
		status: 'PENDING' as const,
		source,
		productId: product.id,
		quantity,
		purchaseDelta: null
	};
}

export function needsReplenishment(product: PrototypeInventoryItem): boolean {
	return product.trackingMode === 'STATUS'
		? product.status !== 'AVAILABLE'
		: product.quantity <= product.lowThreshold;
}

export function changeInventoryStatus(productId: string, status: InventoryStatus): boolean {
	const product = getProductById(productId);
	if (
		!product?.active ||
		product.trackingMode !== 'STATUS' ||
		!['AVAILABLE', 'LOW', 'OUT'].includes(status)
	)
		return false;
	const changed = product.status !== status;
	product.status = status;
	// Preserve a later explicit inventory edit when undoing an earlier purchase.
	for (const item of state.shopping)
		if (item.productId === productId && item.status === 'PURCHASED')
			item.previousInventoryStatus = null;
	if (changed) syncAutomaticShopping(product);
	persistPrototypeState();
	return true;
}

export function updateShoppingReminder(id: string, quantity: number, note: string): boolean {
	const item = state.shopping.find(
		(candidate) => candidate.id === id && candidate.status === 'PENDING'
	);
	if (!item || !validQuantity(quantity, 1)) return false;
	item.quantity = quantity;
	item.note = note.trim();
	persistPrototypeState();
	return true;
}

function syncAutomaticShopping(product: PrototypeInventoryItem): void {
	if (!product.active || product.quantityNeedsReview) return;
	const shouldReplenish = product.replenishmentMode === 'AUTOMATIC' && needsReplenishment(product);
	if (shouldReplenish) {
		if (!state.shopping.some((item) => item.productId === product.id)) {
			state.shopping.push(shoppingEntry(product, 'AUTO'));
		}
	} else {
		state.shopping = state.shopping.filter(
			(item) =>
				!(item.productId === product.id && item.source === 'AUTO' && item.status === 'PENDING')
		);
	}
}

export function changeInventoryQuantity(productId: string, quantity: number): boolean {
	const product = getProductById(productId);
	if (!product?.active || product.trackingMode === 'STATUS' || !validQuantity(quantity))
		return false;
	const changed = quantity !== product.quantity || product.quantityNeedsReview;
	product.quantity = quantity;
	product.quantityNeedsReview = false;
	product.status = inventoryStatus(quantity, product.lowThreshold);
	if (changed) syncAutomaticShopping(product);
	persistPrototypeState();
	return true;
}

export function addProductToShopping(
	productId: string,
	quantity = 1,
	existingQuantity?: number,
	note = ''
): boolean {
	const product = getProductById(productId);
	if (
		!product?.active ||
		!validQuantity(quantity, 1) ||
		(existingQuantity !== undefined && !validQuantity(existingQuantity)) ||
		state.shopping.some((item) => item.productId === productId)
	)
		return false;
	if (existingQuantity !== undefined && product.trackingMode !== 'STATUS') {
		product.quantity = existingQuantity;
		product.quantityNeedsReview = false;
		product.status = inventoryStatus(existingQuantity, product.lowThreshold);
	}
	// Insert atomically with the stock correction: no second automatic entry.
	state.shopping.push({ ...shoppingEntry(product, 'MANUAL', quantity), note: note.trim() });
	persistPrototypeState();
	return true;
}

export function addOneOffShoppingItem(name: string, quantity = 1, note = ''): boolean {
	const trimmedName = name.trim();
	if (!trimmedName || !validQuantity(quantity, 1)) return false;
	state.shopping.push({
		id: crypto.randomUUID(),
		name: trimmedName,
		status: 'PENDING',
		source: 'MANUAL',
		productId: null,
		note: note.trim(),
		quantity,
		purchaseDelta: null
	});
	persistPrototypeState();
	return true;
}

export function saveShoppingItemAsProduct(
	name: string,
	quantity = 1,
	existingQuantity = 0,
	trackingMode: TrackingMode = 'QUANTITY',
	note = '',
	status: InventoryStatus = 'OUT'
): string | null {
	const trimmedName = name.trim();
	if (
		!trimmedName ||
		!['STATUS', 'QUANTITY'].includes(trackingMode) ||
		!['AVAILABLE', 'LOW', 'OUT'].includes(status) ||
		!validQuantity(quantity, 1) ||
		!validQuantity(existingQuantity) ||
		state.inventory.some(
			(item) => item.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
		)
	)
		return null;
	const productId = crypto.randomUUID();
	const product: PrototypeInventoryItem = {
		id: productId,
		name: trimmedName,
		categoryId: null,
		locationId: null,
		trackingMode,
		quantity: trackingMode === 'STATUS' ? 0 : existingQuantity,
		lowThreshold: 1,
		quantityNeedsReview: false,
		status: trackingMode === 'STATUS' ? status : inventoryStatus(existingQuantity, 1),
		active: true,
		replenishmentMode: 'MANUAL'
	};
	state.inventory.push(product);
	state.shopping.push({ ...shoppingEntry(product, 'MANUAL', quantity), note: note.trim() });
	persistPrototypeState();
	return productId;
}

export function purchaseShoppingItem(
	id: string,
	quantity?: number,
	discountExisting = false,
	existingQuantity?: number,
	packSize?: number
): boolean {
	const item = state.shopping.find((candidate) => candidate.id === id);
	if (!item || item.status !== 'PENDING') return false;
	if (packSize !== undefined && !validQuantity(packSize, 1)) return false;
	const bought = (quantity ?? item.quantity) * (packSize ?? 1);
	if (packSize !== undefined && (!item.productId || !getProductById(item.productId)?.packSize))
		return false;
	if (!validQuantity(bought, 1)) return false;
	let delta = bought;
	if (item.productId !== null) {
		const product = getProductById(item.productId);
		if (
			!product?.active ||
			(existingQuantity !== undefined && !validQuantity(existingQuantity)) ||
			(product.quantityNeedsReview && existingQuantity === undefined)
		)
			return false;
		if (product.trackingMode === 'STATUS') {
			if (packSize !== undefined || discountExisting || existingQuantity !== undefined)
				return false;
			item.previousInventoryStatus = product.status;
			product.status = 'AVAILABLE';
			delta = 0;
		} else {
			const current = existingQuantity ?? product.quantity;
			if (discountExisting && current === 0) return false;
			delta = bought - (discountExisting ? 1 : 0);
			const total = current + delta;
			if (!validQuantity(total)) return false;
			product.quantity = total;
			product.quantityNeedsReview = false;
			product.status = inventoryStatus(total, product.lowThreshold);
			// Buying does not enqueue another purchase, even when the total remains low.
		}
	} else if (discountExisting || existingQuantity !== undefined) return false;
	item.quantity = bought;
	item.purchaseDelta = delta;
	item.status = 'PURCHASED';
	persistPrototypeState();
	return true;
}

export function undoShoppingPurchase(id: string): boolean {
	const item = state.shopping.find((candidate) => candidate.id === id);
	if (!item || item.status !== 'PURCHASED') return false;
	if (item.productId !== null) {
		const product = getProductById(item.productId);
		if (!product?.active) return false;
		// Reverse only this purchase's contribution, preserving later stock edits.
		if (product.trackingMode === 'STATUS') {
			if (item.previousInventoryStatus) product.status = item.previousInventoryStatus;
		} else if (item.purchaseDelta !== null) {
			const total = product.quantity - item.purchaseDelta;
			if (!validQuantity(total)) return false;
			product.quantity = total;
			product.status = inventoryStatus(total, product.lowThreshold);
		} else {
			// Purchases from the old demo have no numeric contribution to reverse.
			product.quantityNeedsReview = true;
		}
	}
	item.previousInventoryStatus = null;
	item.status = 'PENDING';
	item.purchaseDelta = null;
	persistPrototypeState();
	return true;
}

export function removePendingShoppingItem(id: string): boolean {
	const index = state.shopping.findIndex((item) => item.id === id && item.status === 'PENDING');
	if (index === -1) return false;
	state.shopping.splice(index, 1);
	persistPrototypeState();
	return true;
}

export function finalizeShopping(): number {
	const count = state.shopping.filter((item) => item.status === 'PURCHASED').length;
	if (count > 0) {
		state.shopping = state.shopping.filter((item) => item.status !== 'PURCHASED');
		persistPrototypeState();
	}
	return count;
}

export function createProduct(
	name: string,
	quantity: number,
	categoryId: string | null,
	locationId: string | null,
	replenishmentMode: 'MANUAL' | 'AUTOMATIC',
	lowThreshold = 1,
	packSize: number | null = null,
	trackingMode: TrackingMode = 'QUANTITY',
	status: InventoryStatus = 'AVAILABLE'
): string | null {
	const trimmedName = name.trim();
	if (
		!trimmedName ||
		!['STATUS', 'QUANTITY'].includes(trackingMode) ||
		!['AVAILABLE', 'LOW', 'OUT'].includes(status) ||
		!validQuantity(quantity) ||
		!validQuantity(lowThreshold) ||
		(packSize !== null && !validQuantity(packSize, 1)) ||
		state.inventory.some(
			(item) => item.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
		)
	)
		return null;
	const product: PrototypeInventoryItem = {
		id: crypto.randomUUID(),
		name: trimmedName,
		categoryId: categoryId || null,
		locationId: locationId || null,
		trackingMode,
		quantity: trackingMode === 'STATUS' ? 0 : quantity,
		lowThreshold,
		packSize: trackingMode === 'STATUS' ? null : packSize,
		quantityNeedsReview: false,
		status: trackingMode === 'STATUS' ? status : inventoryStatus(quantity, lowThreshold),
		active: true,
		replenishmentMode
	};
	state.inventory.push(product);
	syncAutomaticShopping(product);
	persistPrototypeState();
	return product.id;
}

export function updateProduct(
	productId: string,
	name: string,
	quantity: number,
	categoryId: string | null,
	locationId: string | null,
	replenishmentMode: 'MANUAL' | 'AUTOMATIC',
	lowThreshold = 1,
	packSize: number | null = null,
	trackingMode: TrackingMode = 'QUANTITY',
	status: InventoryStatus = 'AVAILABLE'
): boolean {
	const product = getProductById(productId);
	const trimmedName = name.trim();
	if (
		!product?.active ||
		!trimmedName ||
		!['STATUS', 'QUANTITY'].includes(trackingMode) ||
		!['AVAILABLE', 'LOW', 'OUT'].includes(status) ||
		!validQuantity(quantity) ||
		!validQuantity(lowThreshold) ||
		(packSize !== null && !validQuantity(packSize, 1)) ||
		state.inventory.some(
			(item) =>
				item.id !== productId &&
				item.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
		)
	)
		return false;
	const modeChanged = (product.trackingMode ?? 'QUANTITY') !== trackingMode;
	if (
		modeChanged &&
		state.shopping.some((item) => item.productId === productId && item.status === 'PURCHASED')
	)
		return false;
	const changed =
		modeChanged ||
		(trackingMode === 'STATUS' && product.status !== status) ||
		product.quantity !== quantity ||
		product.lowThreshold !== lowThreshold ||
		product.replenishmentMode !== replenishmentMode ||
		product.quantityNeedsReview;
	if (trackingMode === 'STATUS' && product.status !== status) {
		for (const item of state.shopping)
			if (item.productId === productId && item.status === 'PURCHASED')
				item.previousInventoryStatus = null;
	}
	Object.assign(product, {
		name: trimmedName,
		trackingMode,
		quantity: trackingMode === 'STATUS' ? 0 : quantity,
		lowThreshold,
		packSize: trackingMode === 'STATUS' ? null : packSize,
		categoryId: categoryId || null,
		locationId: locationId || null,
		replenishmentMode,
		quantityNeedsReview: false,
		status: trackingMode === 'STATUS' ? status : inventoryStatus(quantity, lowThreshold)
	});
	for (const item of state.shopping) if (item.productId === productId) item.name = trimmedName;
	if (changed) syncAutomaticShopping(product);
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

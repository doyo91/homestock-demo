import type { InventoryStatus } from './types';

export const MAX_QUANTITY = 999999;

export function validQuantity(value: unknown, minimum = 0): value is number {
	return (
		typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= minimum &&
		value <= MAX_QUANTITY
	);
}

export function inventoryStatus(quantity: number, lowThreshold: number): InventoryStatus {
	return quantity === 0 ? 'OUT' : quantity <= lowThreshold ? 'LOW' : 'AVAILABLE';
}

export function statusLabel(quantity: number, lowThreshold: number): string {
	const status = inventoryStatus(quantity, lowThreshold);
	return status === 'OUT' ? 'No hay' : status === 'LOW' ? 'Poco' : 'Hay';
}

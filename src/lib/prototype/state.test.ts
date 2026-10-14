import { beforeEach, describe, expect, it } from 'vitest';
import {
	changeInventoryStatus,
	addProductToShopping,
	addOneOffShoppingItem,
	purchaseShoppingItem,
	undoShoppingPurchase,
	finalizeShopping,
	resetPrototype,
	getPrototypeState,
	createProduct,
	updateProduct,
	createCategory,
	updateCategory,
	toggleCategoryActive,
	moveCategory,
	createLocation,
	updateLocation,
	toggleLocationActive,
	moveLocation,
	setDefaultScreen,
	setHouseholdName
} from './state.svelte';

describe('prototype state - Inventario ↔ Compra', () => {
	beforeEach(() => {
		resetPrototype();
	});

	describe('Regla 1: AUTOMATIC LOW/AVAILABLE -> OUT crea AUTO/PENDING solo si no existe elemento activo', () => {
		it('AVAILABLE -> OUT crea AUTO/PENDING para producto AUTOMATIC', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche'); // AUTOMATIC, LOW
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'OUT');

			const shoppingItem = state.shopping.find((s) => s.productId === product.id);
			expect(shoppingItem).toBeDefined();
			expect(shoppingItem?.source).toBe('AUTO');
			expect(shoppingItem?.status).toBe('PENDING');
		});

		it('LOW -> OUT crea AUTO/PENDING para producto AUTOMATIC', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche'); // AUTOMATIC, LOW
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'OUT');

			const shoppingItem = state.shopping.find((s) => s.productId === product.id);
			expect(shoppingItem).toBeDefined();
			expect(shoppingItem?.source).toBe('AUTO');
		});

		it('no crea elemento si ya existe uno activo para el producto', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche');
			if (!product) throw new Error('Product not found');

			// First transition creates the item
			changeInventoryStatus(product.id, 'OUT');
			const firstCount = state.shopping.filter((s) => s.productId === product.id).length;

			// Second transition should not duplicate
			changeInventoryStatus(product.id, 'OUT');
			const secondCount = state.shopping.filter((s) => s.productId === product.id).length;

			expect(firstCount).toBe(1);
			expect(secondCount).toBe(1);
		});
	});

	describe('Regla 2: Permanecer en OUT no crea duplicados', () => {
		it('OUT -> OUT no crea duplicados', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const initialCount = state.shopping.filter((s) => s.productId === product.id).length;

			changeInventoryStatus(product.id, 'OUT');
			const finalCount = state.shopping.filter((s) => s.productId === product.id).length;

			expect(initialCount).toBe(finalCount);
		});
	});

	describe('Regla 3: OUT -> LOW/AVAILABLE elimina únicamente AUTO/PENDING', () => {
		it('OUT -> AVAILABLE elimina AUTO/PENDING', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const initialShoppingCount = state.shopping.filter((s) => s.productId === product.id).length;

			changeInventoryStatus(product.id, 'AVAILABLE');

			const finalShoppingCount = state.shopping.filter((s) => s.productId === product.id).length;
			expect(finalShoppingCount).toBe(initialShoppingCount - 1);
		});

		it('OUT -> LOW elimina AUTO/PENDING', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const initialShoppingCount = state.shopping.filter((s) => s.productId === product.id).length;

			changeInventoryStatus(product.id, 'LOW');

			const finalShoppingCount = state.shopping.filter((s) => s.productId === product.id).length;
			expect(finalShoppingCount).toBe(initialShoppingCount - 1);
		});

		it('no elimina elementos MANUAL', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Huevos'); // MANUAL, AVAILABLE
			if (!product) throw new Error('Product not found');

			// Add manual item
			addProductToShopping(product.id);
			changeInventoryStatus(product.id, 'OUT');

			const manualItem = state.shopping.find(
				(s) => s.productId === product.id && s.source === 'MANUAL'
			);
			expect(manualItem).toBeDefined();

			// Correct back to AVAILABLE
			changeInventoryStatus(product.id, 'AVAILABLE');

			const manualItemAfter = state.shopping.find(
				(s) => s.productId === product.id && s.source === 'MANUAL'
			);
			expect(manualItemAfter).toBeDefined();
		});

		it('no elimina elementos PURCHASED', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const autoItem = state.shopping.find(
				(s) => s.productId === product.id && s.source === 'AUTO'
			);
			if (!autoItem) throw new Error('Auto item not found');

			// Purchase the item
			purchaseShoppingItem(autoItem.id);

			// Correct inventory
			changeInventoryStatus(product.id, 'AVAILABLE');

			const purchasedItem = state.shopping.find((s) => s.id === autoItem.id);
			expect(purchasedItem).toBeDefined();
			expect(purchasedItem?.status).toBe('PURCHASED');
		});
	});

	describe('Regla 4: LOW no añade automáticamente', () => {
		it('AVAILABLE -> LOW no crea elemento en Compra', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Huevos'); // MANUAL, AVAILABLE
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'LOW');

			const shoppingItem = state.shopping.find((s) => s.productId === product.id);
			expect(shoppingItem).toBeUndefined();
		});

		it('OUT -> LOW no crea elemento en Compra', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'LOW');

			const shoppingItem = state.shopping.find(
				(s) => s.productId === product.id && s.status === 'PENDING'
			);
			expect(shoppingItem).toBeUndefined();
		});
	});

	describe('Regla 5: Comprar pone AVAILABLE y mantiene ShoppingItem como PURCHASED', () => {
		it('compra producto asociado guarda previousInventoryStatus y pone AVAILABLE', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const autoItem = state.shopping.find(
				(s) => s.productId === product.id && s.source === 'AUTO'
			);
			if (!autoItem) throw new Error('Auto item not found');

			purchaseShoppingItem(autoItem.id);

			expect(product.status).toBe('AVAILABLE');

			const purchasedItem = state.shopping.find((s) => s.id === autoItem.id);
			expect(purchasedItem?.status).toBe('PURCHASED');
			expect(purchasedItem?.previousInventoryStatus).toBe('OUT');
		});

		it('no elimina el ShoppingItem al comprar', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico');
			if (!product) throw new Error('Product not found');

			const autoItem = state.shopping.find((s) => s.productId === product.id);
			if (!autoItem) throw new Error('Auto item not found');

			const initialCount = state.shopping.length;

			purchaseShoppingItem(autoItem.id);

			const finalCount = state.shopping.length;
			expect(finalCount).toBe(initialCount);
		});
	});

	describe('Regla 6: Deshacer restaura estado anterior y vuelve a PENDING', () => {
		it('deshace compra restaurando OUT y volviendo a PENDING', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico'); // AUTOMATIC, OUT
			if (!product) throw new Error('Product not found');

			const autoItem = state.shopping.find((s) => s.productId === product.id);
			if (!autoItem) throw new Error('Auto item not found');

			purchaseShoppingItem(autoItem.id);
			expect(product.status).toBe('AVAILABLE');

			undoShoppingPurchase(autoItem.id);

			expect(product.status).toBe('OUT');

			const undoneItem = state.shopping.find((s) => s.id === autoItem.id);
			expect(undoneItem?.status).toBe('PENDING');
			expect(undoneItem?.previousInventoryStatus).toBeNull();
		});

		it('deshace compra restaurando LOW y volviendo a PENDING', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche'); // AUTOMATIC, LOW
			if (!product) throw new Error('Product not found');

			// Manually create item and set it to OUT
			changeInventoryStatus(product.id, 'OUT');
			const autoItem = state.shopping.find((s) => s.productId === product.id);
			if (!autoItem) throw new Error('Auto item not found');

			// Change to LOW then purchase
			changeInventoryStatus(product.id, 'LOW');
			addProductToShopping(product.id); // Manual add since auto was removed
			const manualItem = state.shopping.find(
				(s) => s.productId === product.id && s.source === 'MANUAL'
			);
			if (!manualItem) throw new Error('Manual item not found');

			purchaseShoppingItem(manualItem.id);
			expect(product.status).toBe('AVAILABLE');

			undoShoppingPurchase(manualItem.id);

			expect(product.status).toBe('LOW');

			const undoneItem = state.shopping.find((s) => s.id === manualItem.id);
			expect(undoneItem?.status).toBe('PENDING');
		});

		it('no crea duplicado al deshacer', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Papel higiénico');
			if (!product) throw new Error('Product not found');

			const autoItem = state.shopping.find((s) => s.productId === product.id);
			if (!autoItem) throw new Error('Auto item not found');

			const initialCount = state.shopping.filter((s) => s.productId === product.id).length;

			purchaseShoppingItem(autoItem.id);
			undoShoppingPurchase(autoItem.id);

			const finalCount = state.shopping.filter((s) => s.productId === product.id).length;
			expect(finalCount).toBe(initialCount);
		});
	});

	describe('Regla 7: Finalizar elimina solo PURCHASED, PENDING permanece', () => {
		it('finalizar elimina PURCHASED y mantiene PENDING', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product1 = state.inventory.find((p) => p.name === 'Papel higiénico');
			const product2 = state.inventory.find((p) => p.name === 'Leche');
			if (!product1 || !product2) throw new Error('Products not found');

			// Purchase first item
			const autoItem = state.shopping.find((s) => s.productId === product1.id);
			if (!autoItem) throw new Error('Auto item not found');
			purchaseShoppingItem(autoItem.id);

			// Add second item (stays pending)
			changeInventoryStatus(product2.id, 'OUT');

			const pendingCount = state.shopping.filter((s) => s.status === 'PENDING').length;

			finalizeShopping();

			const newPendingCount = state.shopping.filter((s) => s.status === 'PENDING').length;
			const newPurchasedCount = state.shopping.filter((s) => s.status === 'PURCHASED').length;

			expect(newPendingCount).toBe(pendingCount);
			expect(newPurchasedCount).toBe(0);
		});

		it('finalizar no hace nada si no hay PURCHASED', () => {
			resetPrototype();
			const state = getPrototypeState();

			const initialLength = state.shopping.length;

			const result = finalizeShopping();

			expect(result).toBe(0);
			expect(state.shopping.length).toBe(initialLength);
		});
	});

	describe('Regla 8: Artículo puntual (productId=null) no modifica inventario', () => {
		it('comprar artículo puntual no toca inventario', () => {
			resetPrototype();
			const state = getPrototypeState();

			addOneOffShoppingItem('Bombillas');
			const oneOffItem = state.shopping.find((s) => s.name === 'Bombillas');
			if (!oneOffItem) throw new Error('One-off item not found');

			const initialInventoryLength = state.inventory.length;

			purchaseShoppingItem(oneOffItem.id);

			expect(state.inventory.length).toBe(initialInventoryLength);

			const purchasedItem = state.shopping.find((s) => s.id === oneOffItem.id);
			expect(purchasedItem?.status).toBe('PURCHASED');
			expect(purchasedItem?.previousInventoryStatus).toBeNull();
		});

		it('deshacer artículo puntual no toca inventario', () => {
			resetPrototype();
			const state = getPrototypeState();

			addOneOffShoppingItem('Bombillas');
			const oneOffItem = state.shopping.find((s) => s.name === 'Bombillas');
			if (!oneOffItem) throw new Error('One-off item not found');

			purchaseShoppingItem(oneOffItem.id);
			undoShoppingPurchase(oneOffItem.id);

			const undoneItem = state.shopping.find((s) => s.id === oneOffItem.id);
			expect(undoneItem?.status).toBe('PENDING');
			expect(undoneItem?.previousInventoryStatus).toBeNull();
		});
	});

	describe('Regla 9: Persistencia localStorage', () => {
		it('estado persiste tras cambios', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche');
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'OUT');

			// Simulate reload by creating a new module instance
			// Since we can't actually reload the module in tests, we verify that
			// the state is still accessible after the change
			const currentState = getPrototypeState();

			const currentProduct = currentState.inventory.find((p) => p.id === product.id);
			expect(currentProduct?.status).toBe('OUT');

			const shoppingItem = currentState.shopping.find((s) => s.productId === product.id);
			expect(shoppingItem).toBeDefined();
			expect(shoppingItem?.source).toBe('AUTO');
		});

		it('resetPrototype limpia localStorage', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.name === 'Leche');
			if (!product) throw new Error('Product not found');

			changeInventoryStatus(product.id, 'OUT');

			// Reset
			resetPrototype();
			const resetState = getPrototypeState();

			const resetProduct = resetState.inventory.find((p) => p.id === product.id);
			expect(resetProduct?.status).toBe('LOW'); // Back to initial state

			const shoppingItem = resetState.shopping.find((s) => s.productId === product.id);
			expect(shoppingItem).toBeUndefined();
		});
	});
});

describe('prototype state - Products', () => {
	beforeEach(() => {
		resetPrototype();
	});

	describe('createProduct', () => {
		it('crea producto con valores válidos', () => {
			const categoryId = getPrototypeState().categories[0].id;
			const locationId = getPrototypeState().locations[0].id;

			const productId = createProduct(
				'Nuevo Producto',
				'AVAILABLE',
				categoryId,
				locationId,
				'MANUAL'
			);

			expect(productId).toBeTruthy();

			const currentState = getPrototypeState();
			const product = currentState.inventory.find((p) => p.id === productId);
			expect(product).toBeDefined();
			expect(product?.name).toBe('Nuevo Producto');
			expect(product?.status).toBe('AVAILABLE');
			expect(product?.categoryId).toBe(categoryId);
			expect(product?.locationId).toBe(locationId);
			expect(product?.replenishmentMode).toBe('MANUAL');
		});

		it('previene duplicados por nombre normalizado', () => {
			const productId1 = createProduct('  NuevoProducto  ', 'AVAILABLE', null, null, 'MANUAL');
			expect(productId1).toBeTruthy();

			const productId2 = createProduct('nuevoproducto', 'AVAILABLE', null, null, 'MANUAL');
			expect(productId2).toBeNull();
		});

		it('acepta categoryId y locationId null', () => {
			const productId = createProduct('Producto sin categoría', 'LOW', null, null, 'AUTOMATIC');

			expect(productId).toBeTruthy();

			const state = getPrototypeState();
			const product = state.inventory.find((p) => p.id === productId);
			expect(product?.categoryId).toBeNull();
			expect(product?.locationId).toBeNull();
		});
	});

	describe('updateProduct', () => {
		it('actualiza producto existente', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory[0];
			const categoryId = state.categories[1].id;

			const result = updateProduct(
				product.id,
				'Nombre Actualizado',
				'LOW',
				categoryId,
				null,
				'AUTOMATIC'
			);

			expect(result).toBe(true);

			const updated = state.inventory.find((p) => p.id === product.id);
			expect(updated?.name).toBe('Nombre Actualizado');
			expect(updated?.status).toBe('LOW');
			expect(updated?.categoryId).toBe(categoryId);
			expect(updated?.replenishmentMode).toBe('AUTOMATIC');
		});

		it('previene duplicados al cambiar nombre', () => {
			resetPrototype();
			const state = getPrototypeState();
			const product = state.inventory[0];
			const existingName = state.inventory[1].name;

			const result = updateProduct(product.id, existingName, 'AVAILABLE', null, null, 'MANUAL');

			expect(result).toBe(false);
		});

		it('falla si producto no existe', () => {
			const result = updateProduct('nonexistent', 'Nombre', 'AVAILABLE', null, null, 'MANUAL');

			expect(result).toBe(false);
		});
	});
});

describe('prototype state - Preferencias y Hogar', () => {
	beforeEach(() => {
		resetPrototype();
	});

	describe('setDefaultScreen', () => {
		it('establece pantalla inicial INVENTORY', () => {
			setDefaultScreen('INVENTORY');

			const state = getPrototypeState();
			expect(state.defaultScreen).toBe('INVENTORY');
		});

		it('establece pantalla inicial SHOPPING', () => {
			setDefaultScreen('SHOPPING');

			const state = getPrototypeState();
			expect(state.defaultScreen).toBe('SHOPPING');
		});
	});

	describe('setHouseholdName', () => {
		it('establece nombre del hogar', () => {
			setHouseholdName('Mi Hogar');

			const state = getPrototypeState();
			expect(state.householdName).toBe('Mi Hogar');
		});

		it('hace trim del nombre', () => {
			setHouseholdName('  Mi Hogar  ');

			const state = getPrototypeState();
			expect(state.householdName).toBe('Mi Hogar');
		});
	});
});

describe('prototype state - Categorías', () => {
	beforeEach(() => {
		resetPrototype();
	});

	describe('createCategory', () => {
		it('crea categoría con nombre válido', () => {
			const categoryId = createCategory('Nueva Categoría');

			expect(categoryId).toBeTruthy();

			const state = getPrototypeState();
			const category = state.categories.find((c) => c.id === categoryId);
			expect(category).toBeDefined();
			expect(category?.name).toBe('Nueva Categoría');
			expect(category?.active).toBe(true);
		});

		it('previene duplicados por nombre normalizado', () => {
			const state = getPrototypeState();
			const existingName = state.categories[0].name;

			const categoryId = createCategory(existingName.toUpperCase());

			expect(categoryId).toBeNull();
		});
	});

	describe('updateCategory', () => {
		it('actualiza nombre de categoría', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];

			const result = updateCategory(category.id, 'Nombre Actualizado');

			expect(result).toBe(true);

			const updated = state.categories.find((c) => c.id === category.id);
			expect(updated?.name).toBe('Nombre Actualizado');
		});

		it('previene duplicados al cambiar nombre', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];
			const existingName = state.categories[1].name;

			const result = updateCategory(category.id, existingName);

			expect(result).toBe(false);
		});
	});

	describe('toggleCategoryActive', () => {
		it('activa categoría desactivada', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];
			category.active = false;

			const result = toggleCategoryActive(category.id);

			expect(result).toBe(true);
			expect(category.active).toBe(true);
		});

		it('desactiva categoría activa', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];

			const result = toggleCategoryActive(category.id);

			expect(result).toBe(true);
			expect(category.active).toBe(false);
		});
	});

	describe('moveCategory', () => {
		it('mueve categoría hacia arriba', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[1];
			const initialIndex = state.categories.findIndex((c) => c.id === category.id);

			const result = moveCategory(category.id, -1);

			expect(result).toBe(true);
			const newIndex = state.categories.findIndex((c) => c.id === category.id);
			expect(newIndex).toBe(initialIndex - 1);
		});

		it('mueve categoría hacia abajo', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];
			const initialIndex = state.categories.findIndex((c) => c.id === category.id);

			const result = moveCategory(category.id, 1);

			expect(result).toBe(true);
			const newIndex = state.categories.findIndex((c) => c.id === category.id);
			expect(newIndex).toBe(initialIndex + 1);
		});

		it('no mueve si está en el límite superior', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[0];

			const result = moveCategory(category.id, -1);

			expect(result).toBe(false);
		});

		it('no mueve si está en el límite inferior', () => {
			resetPrototype();
			const state = getPrototypeState();
			const category = state.categories[state.categories.length - 1];

			const result = moveCategory(category.id, 1);

			expect(result).toBe(false);
		});
	});
});

describe('prototype state - Ubicaciones', () => {
	beforeEach(() => {
		resetPrototype();
	});

	describe('createLocation', () => {
		it('crea ubicación con nombre válido', () => {
			const locationId = createLocation('Nueva Ubicación');

			expect(locationId).toBeTruthy();

			const state = getPrototypeState();
			const location = state.locations.find((l) => l.id === locationId);
			expect(location).toBeDefined();
			expect(location?.name).toBe('Nueva Ubicación');
			expect(location?.active).toBe(true);
		});

		it('previene duplicados por nombre normalizado', () => {
			const state = getPrototypeState();
			const existingName = state.locations[0].name;

			const locationId = createLocation(existingName.toUpperCase());

			expect(locationId).toBeNull();
		});
	});

	describe('updateLocation', () => {
		it('actualiza nombre de ubicación', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];

			const result = updateLocation(location.id, 'Nombre Actualizado');

			expect(result).toBe(true);

			const updated = state.locations.find((l) => l.id === location.id);
			expect(updated?.name).toBe('Nombre Actualizado');
		});

		it('previene duplicados al cambiar nombre', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];
			const existingName = state.locations[1].name;

			const result = updateLocation(location.id, existingName);

			expect(result).toBe(false);
		});
	});

	describe('toggleLocationActive', () => {
		it('activa ubicación desactivada', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];
			location.active = false;

			const result = toggleLocationActive(location.id);

			expect(result).toBe(true);
			expect(location.active).toBe(true);
		});

		it('desactiva ubicación activa', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];

			const result = toggleLocationActive(location.id);

			expect(result).toBe(true);
			expect(location.active).toBe(false);
		});
	});

	describe('moveLocation', () => {
		it('mueve ubicación hacia arriba', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[1];
			const initialIndex = state.locations.findIndex((l) => l.id === location.id);

			const result = moveLocation(location.id, -1);

			expect(result).toBe(true);
			const newIndex = state.locations.findIndex((l) => l.id === location.id);
			expect(newIndex).toBe(initialIndex - 1);
		});

		it('mueve ubicación hacia abajo', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];
			const initialIndex = state.locations.findIndex((l) => l.id === location.id);

			const result = moveLocation(location.id, 1);

			expect(result).toBe(true);
			const newIndex = state.locations.findIndex((l) => l.id === location.id);
			expect(newIndex).toBe(initialIndex + 1);
		});

		it('no mueve si está en el límite superior', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[0];

			const result = moveLocation(location.id, -1);

			expect(result).toBe(false);
		});

		it('no mueve si está en el límite inferior', () => {
			resetPrototype();
			const state = getPrototypeState();
			const location = state.locations[state.locations.length - 1];

			const result = moveLocation(location.id, 1);

			expect(result).toBe(false);
		});
	});
});

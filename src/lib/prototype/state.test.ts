import { beforeEach, describe, expect, it } from 'vitest';
import {
	changeInventoryQuantity,
	deleteProduct,
	addProductToShopping,
	addOneOffShoppingItem,
	saveShoppingItemAsProduct,
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
	setCategoryColor,
	createLocation,
	updateLocation,
	toggleLocationActive,
	moveLocation,
	setDefaultScreen,
	setHouseholdName
} from './state.svelte';

describe('Cantidades, reposición y compra', () => {
	beforeEach(() => resetPrototype());
	const product = () => getPrototypeState().inventory.find((item) => item.id === '1')!;
	const linked = () => getPrototypeState().shopping.filter((item) => item.productId === '1');

	it.each([
		[0, 'OUT'],
		[1, 'LOW'],
		[2, 'AVAILABLE'],
		[8, 'AVAILABLE']
	] as const)('calcula el estado de %i existencias', (quantity, status) => {
		expect(changeInventoryQuantity('1', quantity)).toBe(true);
		expect(product().status).toBe(status);
		expect(product().quantity).toBe(quantity);
	});

	it('admite umbrales iguales y repone al alcanzar el límite sin duplicar', () => {
		expect(updateProduct('1', 'Leche', 3, null, null, 'AUTOMATIC', 2, 2)).toBe(true);
		expect(linked()).toHaveLength(0);
		changeInventoryQuantity('1', 2);
		expect(product().status).toBe('LOW');
		expect(linked()).toHaveLength(1);
		expect(linked()[0]).toMatchObject({ quantity: 1, source: 'AUTO', status: 'PENDING' });
		changeInventoryQuantity('1', 1);
		expect(linked()).toHaveLength(1);
	});

	it('separa Poco y reposición, y solo retira pendientes automáticos al reponer fuera de la app', () => {
		updateProduct('1', 'Leche', 3, null, null, 'AUTOMATIC', 2, 1);
		changeInventoryQuantity('1', 2);
		expect(linked()).toHaveLength(0);
		changeInventoryQuantity('1', 1);
		expect(linked()).toHaveLength(1);
		changeInventoryQuantity('1', 4);
		expect(linked()).toHaveLength(0);
		addProductToShopping('1', 2);
		changeInventoryQuantity('1', 0);
		changeInventoryQuantity('1', 4);
		expect(linked()[0].source).toBe('MANUAL');
	});

	it('crear o configurar un automático ya bajo mínimos genera su pendiente', () => {
		const id = createProduct('Arroz', 1, null, null, 'AUTOMATIC', 2, 1)!;
		expect(getPrototypeState().shopping.find((item) => item.productId === id)?.source).toBe('AUTO');
		expect(updateProduct('1', 'Leche', 1, null, null, 'AUTOMATIC', 1, 1)).toBe(true);
		expect(linked()).toHaveLength(1);
	});

	it('no añade productos manuales al llegar a cero', () => {
		changeInventoryQuantity('2', 0);
		expect(getPrototypeState().shopping.some((item) => item.productId === '2')).toBe(false);
	});

	it('añade y corrige existencias en una sola operación sin duplicados automáticos', () => {
		expect(addProductToShopping('1', 3, 0)).toBe(true);
		expect(product()).toMatchObject({ quantity: 0, status: 'OUT' });
		expect(linked()).toHaveLength(1);
		expect(linked()[0]).toMatchObject({ quantity: 3, source: 'MANUAL' });
		expect(addProductToShopping('1', 2, 9)).toBe(false);
		expect(product().quantity).toBe(0);
	});

	it('suma lo realmente comprado y descuenta una existente solo si se solicita', () => {
		addProductToShopping('1', 5);
		const item = linked()[0];
		expect(purchaseShoppingItem(item.id, 2, true)).toBe(true);
		expect(product()).toMatchObject({ quantity: 2, status: 'AVAILABLE' });
		expect(item).toMatchObject({ quantity: 2, purchaseDelta: 1, status: 'PURCHASED' });
		expect(purchaseShoppingItem(item.id, 2)).toBe(false);
		expect(product().quantity).toBe(2);
		expect(undoShoppingPurchase(item.id)).toBe(true);
		expect(product()).toMatchObject({ quantity: 1, status: 'LOW' });
		expect(item).toMatchObject({ status: 'PENDING', purchaseDelta: null });
	});

	it('no descuenta existencias cuando no hay y mantiene la operación atómica', () => {
		addProductToShopping('1', 2, 0);
		const item = linked()[0];
		expect(purchaseShoppingItem(item.id, 2, true)).toBe(false);
		expect(product().quantity).toBe(0);
		expect(item.status).toBe('PENDING');
		expect(purchaseShoppingItem(item.id, 2)).toBe(true);
		expect(product().quantity).toBe(2);
	});

	it('no repone otra vez al comprar bajo mínimos ni al finalizar', () => {
		updateProduct('1', 'Leche', 0, null, null, 'AUTOMATIC', 3, 2);
		const item = linked()[0];
		purchaseShoppingItem(item.id, 1);
		expect(product().status).toBe('LOW');
		expect(linked()).toHaveLength(1);
		expect(finalizeShopping()).toBe(1);
		expect(linked()).toHaveLength(0);
		changeInventoryQuantity('1', 0);
		expect(linked()).toHaveLength(1);
	});

	it('deshacer conserva los ajustes posteriores de inventario', () => {
		addProductToShopping('1', 2);
		const item = linked()[0];
		purchaseShoppingItem(item.id);
		changeInventoryQuantity('1', 5);
		expect(undoShoppingPurchase(item.id)).toBe(true);
		expect(product().quantity).toBe(3);
		expect(linked()).toHaveLength(1);
	});

	it('impide deshacer si produciría existencias negativas, sin modificar datos', () => {
		addProductToShopping('1', 3);
		const item = linked()[0];
		purchaseShoppingItem(item.id);
		changeInventoryQuantity('1', 1);
		const before = JSON.stringify(getPrototypeState());
		expect(undoShoppingPurchase(item.id)).toBe(false);
		expect(JSON.stringify(getPrototypeState())).toBe(before);
	});

	it('deshace una compra con incremento neto cero sin descontar otra unidad', () => {
		addProductToShopping('1');
		const item = linked()[0];
		purchaseShoppingItem(item.id, 1, true);
		expect(product().quantity).toBe(1);
		expect(undoShoppingPurchase(item.id)).toBe(true);
		expect(product().quantity).toBe(1);
	});

	it('requiere revisar recuentos antiguos antes de comprar y guarda la corrección explícita', () => {
		product().quantityNeedsReview = true;
		addProductToShopping('1', 2);
		const item = linked()[0];
		expect(purchaseShoppingItem(item.id)).toBe(false);
		expect(purchaseShoppingItem(item.id, 2, false, 4)).toBe(true);
		expect(product()).toMatchObject({ quantity: 6, quantityNeedsReview: false });
		undoShoppingPurchase(item.id);
		expect(product().quantity).toBe(4);
	});

	it('conserva artículos independientes y cantidades al comprar, deshacer y finalizar', () => {
		addOneOffShoppingItem('Pan extra', 4);
		const item = getPrototypeState().shopping.find((item) => item.name === 'Pan extra')!;
		const before = JSON.stringify(getPrototypeState().inventory);
		expect(purchaseShoppingItem(item.id, 3)).toBe(true);
		expect(item.quantity).toBe(3);
		expect(undoShoppingPurchase(item.id)).toBe(true);
		purchaseShoppingItem(item.id);
		expect(finalizeShopping()).toBe(1);
		expect(JSON.stringify(getPrototypeState().inventory)).toBe(before);
		expect(getPrototypeState().shopping.some((item) => item.name === 'Pan')).toBe(true);
	});

	it('crea desde Compra con cero existencias por defecto y permite indicar las que había', () => {
		const id = saveShoppingItemAsProduct('Arroz', 3)!;
		const state = getPrototypeState();
		expect(state.inventory.find((item) => item.id === id)?.quantity).toBe(0);
		purchaseShoppingItem(state.shopping.find((item) => item.productId === id)!.id);
		expect(state.inventory.find((item) => item.id === id)?.quantity).toBe(3);
		const second = saveShoppingItemAsProduct('Lentejas', 2, 4)!;
		expect(state.inventory.find((item) => item.id === second)?.quantity).toBe(4);
		expect(saveShoppingItemAsProduct(' ARROZ ', 1)).toBeNull();
	});

	it('renombrar sincroniza las líneas de compra y cambiar a manual conserva solo los pendientes manuales', () => {
		updateProduct('1', 'Leche', 0, null, null, 'AUTOMATIC');
		expect(linked()).toHaveLength(1);
		updateProduct('1', 'Leche entera', 0, null, null, 'MANUAL');
		expect(linked()).toHaveLength(0);
		addProductToShopping('1');
		updateProduct('1', 'Leche nueva', 2, null, null, 'MANUAL');
		expect(linked()[0].name).toBe('Leche nueva');
	});

	it('rechaza umbrales invertidos y cantidades no enteras o negativas sin cambios', () => {
		const before = JSON.stringify(getPrototypeState());
		expect(createProduct('Inválido', 1, null, null, 'AUTOMATIC', 1, 2)).toBeNull();
		expect(updateProduct('1', 'Leche', 1, null, null, 'AUTOMATIC', 1, 2)).toBe(false);
		for (const quantity of [-1, 1.5, NaN, Infinity, 1000000]) {
			expect(changeInventoryQuantity('1', quantity)).toBe(false);
			expect(addProductToShopping('1', quantity)).toBe(false);
		}
		expect(addProductToShopping('1', 0)).toBe(false);
		expect(JSON.stringify(getPrototypeState())).toBe(before);
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

			const productId = createProduct('Nuevo Producto', 3, categoryId, locationId, 'MANUAL');

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
			const productId1 = createProduct('  NuevoProducto  ', 3, null, null, 'MANUAL');
			expect(productId1).toBeTruthy();

			const productId2 = createProduct('nuevoproducto', 3, null, null, 'MANUAL');
			expect(productId2).toBeNull();
		});

		it('acepta categoryId y locationId null', () => {
			const productId = createProduct('Producto sin categoría', 1, null, null, 'AUTOMATIC');

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
				1,
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

			const result = updateProduct(product.id, existingName, 3, null, null, 'MANUAL');

			expect(result).toBe(false);
		});

		it('falla si producto no existe', () => {
			const result = updateProduct('nonexistent', 'Nombre', 3, null, null, 'MANUAL');

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

	describe('setCategoryColor', () => {
		it('guarda el color elegido en la categoría', () => {
			const category = getPrototypeState().categories[0];

			expect(setCategoryColor(category.id, 'teal')).toBe(true);
			expect(category.color).toBe('teal');
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

describe('Eliminar productos', () => {
	beforeEach(() => resetPrototype());

	it('borra el producto y permite crear de nuevo el mismo nombre normalizado', () => {
		const state = getPrototypeState();
		expect(deleteProduct('2')).toBe(true);
		expect(state.inventory.some((product) => product.id === '2')).toBe(false);
		const id = createProduct('  HUEVOS  ', 3, null, null, 'MANUAL');
		expect(id).not.toBeNull();
		expect(id).not.toBe('2');
	});

	it('borra los pendientes vinculados y conserva los artículos independientes, incluso con el mismo nombre', () => {
		const state = getPrototypeState();
		addOneOffShoppingItem('Papel higiénico');
		expect(deleteProduct('3')).toBe(true);
		expect(state.shopping.some((item) => item.productId === '3')).toBe(false);
		expect(
			state.shopping.some((item) => item.name === 'Papel higiénico' && item.productId === null)
		).toBe(true);
		expect(state.shopping.some((item) => item.name === 'Pan')).toBe(true);
		expect(state.inventory.some((product) => product.id === '1')).toBe(true);
	});

	it('también elimina los comprados vinculados sin dejar una acción Deshacer sobre un producto inexistente', () => {
		const state = getPrototypeState();
		const item = state.shopping.find((candidate) => candidate.productId === '3')!;
		expect(purchaseShoppingItem(item.id)).toBe(true);
		expect(deleteProduct('3')).toBe(true);
		expect(state.shopping.some((candidate) => candidate.id === item.id)).toBe(false);
		expect(undoShoppingPurchase(item.id)).toBe(false);
	});

	it('retira productos sugeridos e impide generar nuevas reposiciones después de borrarlos', () => {
		const state = getPrototypeState();
		expect(deleteProduct('1')).toBe(true);
		expect(state.inventory.some((product) => product.id === '1')).toBe(false);
		expect(changeInventoryQuantity('1', 0)).toBe(false);
		expect(addProductToShopping('1')).toBe(false);
		expect(state.shopping.some((item) => item.productId === '1')).toBe(false);
	});

	it('permite borrar productos desactivados por versiones anteriores', () => {
		const state = getPrototypeState();
		state.inventory[0].active = false;
		expect(deleteProduct(state.inventory[0].id)).toBe(true);
		expect(state.inventory.some((product) => product.name === 'Leche')).toBe(false);
		expect(createProduct('Leche', 1, null, null, 'MANUAL')).not.toBeNull();
	});

	it('rechaza identificadores inexistentes y eliminaciones repetidas sin modificar otros datos', () => {
		const state = getPrototypeState();
		const before = JSON.stringify(state);
		expect(deleteProduct('missing')).toBe(false);
		expect(JSON.stringify(state)).toBe(before);
		expect(deleteProduct('1')).toBe(true);
		expect(deleteProduct('1')).toBe(false);
	});
});

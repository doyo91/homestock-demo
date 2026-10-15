import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('Preferencia de apariencia', () => {
	it('recupera el tema oscuro al volver a abrir la demo', async () => {
		let stored: string | null = null;
		vi.stubGlobal('window', {
			localStorage: {
				getItem: () => stored,
				setItem: (_key: string, value: string) => {
					stored = value;
				}
			}
		});
		const { setTheme } = await import('./appearance.svelte');
		expect(setTheme('dark')).toBe(true);
		vi.resetModules();
		const { appearance } = await import('./appearance.svelte');
		expect(appearance.theme).toBe('dark');
	});

	it('usa el tema claro si la preferencia guardada no es válida', async () => {
		vi.stubGlobal('window', { localStorage: { getItem: () => 'invalid' } });
		const { appearance } = await import('./appearance.svelte');
		expect(appearance.theme).toBe('light');
	});

	it('permite cambiar de tema aunque el navegador bloquee el almacenamiento', async () => {
		vi.stubGlobal('window', {
			get localStorage() {
				throw new Error('Storage blocked');
			}
		});
		const { appearance, setTheme } = await import('./appearance.svelte');
		expect(appearance.theme).toBe('light');
		expect(setTheme('dark')).toBe(false);
		expect(appearance.theme).toBe('dark');
	});
});

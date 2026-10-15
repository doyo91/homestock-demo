export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'homestock-theme';

function loadTheme(): Theme {
	try {
		return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'dark'
			? 'dark'
			: 'light';
	} catch {
		return 'light';
	}
}

export const appearance = $state<{ theme: Theme }>({ theme: loadTheme() });

export function setTheme(theme: Theme): boolean {
	appearance.theme = theme;
	try {
		window.localStorage.setItem(STORAGE_KEY, theme);
		return true;
	} catch {
		return false;
	}
}

<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const navigation = [
		{ href: '/', label: 'Inventario' },
		{ href: '/shopping', label: 'Compra' },
		{ href: '/settings', label: 'Ajustes' }
	] as const;

	function isActive(href: (typeof navigation)[number]['href']) {
		if (href === '/') {
			return page.url.pathname.replace(/\/$/, '') === resolve('/').replace(/\/$/, '');
		}

		return page.url.pathname.startsWith(resolve(href));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="app">
	<main>
		{@render children()}
	</main>

	<nav aria-label="Navegación principal">
		{#each navigation as item (item.href)}
			<a
				href={resolve(item.href)}
				class:active={isActive(item.href)}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				{item.label}
			</a>
		{/each}
	</nav>
</div>

<style>
	.app {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		padding-bottom: 4rem;
	}

	nav {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		background: white;
		border-top: 1px solid #ddd;
	}

	nav a {
		padding: 1rem 0.5rem;
		text-align: center;
		text-decoration: none;
		color: #666;
	}

	nav a.active {
		font-weight: 600;
		color: #111;
	}
</style>

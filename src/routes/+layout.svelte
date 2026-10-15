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
	<header class="brand-header">
		<a class="brand" href={resolve('/')} aria-label="HomeStock, inicio">
			<span class="brand-mark" aria-hidden="true"
				><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
					><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path
						d="M9 21v-8h6v8"
					/></svg
				></span
			>
			<span>HomeStock</span>
		</a>
		<span class="demo-badge">Demo</span>
	</header>
	<a class="skip-link" href="#main-content">Saltar al contenido</a>
	<main id="main-content">
		{@render children()}
	</main>

	<nav aria-label="Navegación principal">
		{#each navigation as item (item.href)}
			<a
				href={resolve(item.href)}
				class:active={isActive(item.href)}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					{#if item.href === '/'}<rect x="3" y="3" width="18" height="18" rx="4" /><path
							d="M3 10h18M10 10v11M8 6.5h2M14 15h3"
						/>
					{:else if item.href === '/shopping'}<path
							d="m3 4 2 0 3 12h11l2-8H6M10 20h.01M18 20h.01"
						/>
					{:else}<path
							fill="currentColor"
							stroke="none"
							fill-rule="evenodd"
							d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.63 7.48a.5.5 0 0 0 .12.64l2.03 1.58a7.75 7.75 0 0 0-.07.94c0 .32.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54a.49.49 0 0 0 .49.42h3.84a.49.49 0 0 0 .49-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
						/>{/if}
				</svg>
				<span>{item.label}</span>
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
	.brand-header {
		width: min(100%, 48rem);
		margin: 0 auto;
		padding: 1.1rem 1rem 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--ink);
		font-weight: 750;
		font-size: 1.05rem;
		letter-spacing: -0.03em;
	}
	.brand-mark {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.75rem;
		background: var(--accent);
		color: white;
	}
	.brand-mark svg {
		width: 1.3rem;
		height: 1.3rem;
	}
	.demo-badge {
		padding: 0.25rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 650;
	}
	.skip-link {
		position: fixed;
		top: -10rem;
		left: 1rem;
		z-index: 200;
		padding: 0.75rem;
		background: white;
	}
	.skip-link:focus {
		top: 1rem;
	}
	main {
		flex: 1;
		padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
	}
	nav {
		position: fixed;
		z-index: 40;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.3rem;
		padding: 0.6rem max(0.75rem, env(safe-area-inset-right, 0px))
			calc(0.6rem + env(safe-area-inset-bottom, 0px)) max(0.75rem, env(safe-area-inset-left, 0px));
		background: rgb(255 255 255 / 96%);
		border-top: 1px solid var(--line);
		box-shadow: 0 -4px 24px rgb(36 59 52 / 4%);
	}
	nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: 3.2rem;
		padding: 0.45rem;
		border-radius: 1rem;
		text-decoration: none;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
	}
	nav a svg {
		width: 1.35rem;
		height: 1.35rem;
	}
	nav a.active {
		background: var(--accent-soft);
		color: var(--accent);
	}
	@media (min-width: 640px) {
		.brand-header {
			padding: 1.5rem 2rem 0;
		}
		nav {
			left: 50%;
			right: auto;
			bottom: 1rem;
			width: min(calc(100% - 2rem), 32rem);
			transform: translateX(-50%);
			border: 1px solid var(--line);
			border-radius: 1.4rem;
			box-shadow: 0 8px 32px rgb(36 59 52 / 10%);
		}
	}
</style>

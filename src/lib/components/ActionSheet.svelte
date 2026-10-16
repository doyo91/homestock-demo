<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	let { title, onClose, children }: { title: string; onClose: () => void; children: Snippet } =
		$props();
	let dialog: HTMLDialogElement;
	onMount(() => {
		const overflow = document.body.style.overflow;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
		return () => {
			dialog.close();
			document.body.style.overflow = overflow;
		};
	});
	function backdrop(event: MouseEvent) {
		if (event.target !== dialog) return;
		const r = dialog.getBoundingClientRect();
		if (
			event.clientX < r.left ||
			event.clientX > r.right ||
			event.clientY < r.top ||
			event.clientY > r.bottom
		)
			onClose();
	}
</script>

<dialog
	bind:this={dialog}
	aria-label={title}
	onclick={backdrop}
	oncancel={(event) => {
		event.preventDefault();
		onClose();
	}}
>
	<header>
		<h2>{title}</h2>
		<button type="button" class="close" aria-label="Cerrar" onclick={onClose}>×</button>
	</header>
	{@render children()}
</dialog>

<style>
	dialog {
		position: fixed;
		inset: auto 0 0;
		width: min(100%, 32rem);
		max-width: 100%;
		max-height: 85dvh;
		margin: 0 auto;
		padding: 1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom));
		box-sizing: border-box;
		overflow-y: auto;
		border: 1px solid var(--line);
		border-radius: 1.5rem 1.5rem 0 0;
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 -8px 32px rgb(0 0 0 / 15%);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	h2 {
		margin: 0.5rem 0;
		font-size: 1.2rem;
		overflow-wrap: anywhere;
	}
	.close {
		flex-shrink: 0;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: var(--surface-soft);
		color: var(--muted);
		font-size: 1.5rem;
		cursor: pointer;
	}
	@media (min-width: 640px) {
		dialog {
			inset: 0;
			margin: auto;
			border-radius: 1.5rem;
		}
	}
</style>

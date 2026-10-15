export function createFeedback() {
	let current = $state<{ text: string; persistent: boolean } | null>(null);

	$effect(() => {
		const notification = current;
		if (!notification || notification.persistent) return;

		const timer = setTimeout(() => {
			if (current === notification) current = null;
		}, 2000);

		return () => clearTimeout(timer);
	});

	return {
		get message() {
			return current?.text ?? null;
		},
		show(text: string | null, persistent = false) {
			current = text ? { text, persistent } : null;
		},
		clear() {
			current = null;
		}
	};
}

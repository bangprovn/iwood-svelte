export type LightboxItem = {
	img: string;
	vi?: string;
	loc?: string;
	year?: number;
	area?: string;
};

function createLightboxStore() {
	let open = $state(false);
	let items = $state<LightboxItem[]>([]);
	let index = $state(0);

	function show(nextItems: LightboxItem[], nextIndex = 0) {
		items = nextItems;
		index = nextIndex;
		open = true;
	}

	function close() {
		open = false;
	}

	function next() {
		if (items.length === 0) return;
		index = (index + 1) % items.length;
	}

	function prev() {
		if (items.length === 0) return;
		index = (index - 1 + items.length) % items.length;
	}

	return {
		get open() {
			return open;
		},
		get items() {
			return items;
		},
		get index() {
			return index;
		},
		show,
		close,
		next,
		prev
	};
}

export const lightbox = createLightboxStore();

import type { ProductDTO } from '$lib/types';

export type InquiryItem = ProductDTO & { qty: number };

function createInquiryStore() {
	let items = $state<InquiryItem[]>([]);
	let drawerOpen = $state(false);

	const total = $derived(items.reduce((s, it) => s + it.price * it.qty, 0));
	const lineCount = $derived(items.length);

	function add(p: ProductDTO, qty = 10) {
		const ex = items.find((it) => it.id === p.id);
		if (ex) {
			ex.qty += qty;
		} else {
			items.push({ ...p, qty });
		}
		drawerOpen = true;
	}

	function setQty(id: string, qty: number) {
		const it = items.find((x) => x.id === id);
		if (it) it.qty = qty;
	}

	function remove(id: string) {
		items = items.filter((it) => it.id !== id);
	}

	function open() {
		drawerOpen = true;
	}

	function close() {
		drawerOpen = false;
	}

	return {
		get items() {
			return items;
		},
		get drawerOpen() {
			return drawerOpen;
		},
		get total() {
			return total;
		},
		get lineCount() {
			return lineCount;
		},
		add,
		setQty,
		remove,
		open,
		close
	};
}

export const inquiry = createInquiryStore();

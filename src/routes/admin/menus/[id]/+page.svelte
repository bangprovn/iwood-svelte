<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Kind =
		| 'custom'
		| 'page'
		| 'category'
		| 'project_category'
		| 'post'
		| 'showroom'
		| 'route'
		| 'mega_column'
		| 'mega_promo'
		| 'mega_featured';

	type Node = {
		id: string;
		kind: Kind;
		refId: string | null;
		url: string | null;
		labelVi: string;
		labelEn: string | null;
		target: '_self' | '_blank';
		isMega: boolean;
		data: Record<string, unknown>;
		children: Node[];
		_open?: boolean;
	};

	function uid(): string {
		return 'tmp-' + Math.random().toString(36).slice(2, 10);
	}

	function fromServer(items: PageData['menu']['items']): Node[] {
		const map = (n: PageData['menu']['items'][number]): Node => ({
			id: n.id,
			kind: n.kind as Kind,
			refId: n.refId ?? null,
			url: n.url ?? null,
			labelVi: n.labelVi ?? '',
			labelEn: n.labelEn ?? null,
			target: n.target === '_blank' ? '_blank' : '_self',
			isMega: !!n.isMega,
			data: (n.dataParsed ?? {}) as Record<string, unknown>,
			children: (n.children ?? []).map(map),
			_open: false
		});
		return items.map(map);
	}

	let nodes = $state<Node[]>(fromServer(data.menu.items));

	let menuName = $state(data.menu.name);
	let menuSlug = $state(data.menu.slug);
	let menuLocation = $state(data.menu.location ?? '');
	let menuActive = $state(!!data.menu.isActive);

	// Sidebar add-item picker
	let addKind = $state<Kind>('custom');
	let pickerSearch = $state('');

	// --- Tree mutation helpers ----------------------------------------------

	function findParent(list: Node[], id: string): { parent: Node[]; idx: number } | null {
		for (let i = 0; i < list.length; i++) {
			if (list[i].id === id) return { parent: list, idx: i };
			const sub = findParent(list[i].children, id);
			if (sub) return sub;
		}
		return null;
	}

	function findNode(list: Node[], id: string): Node | null {
		for (const n of list) {
			if (n.id === id) return n;
			const sub = findNode(n.children, id);
			if (sub) return sub;
		}
		return null;
	}

	function moveUp(id: string) {
		const found = findParent(nodes, id);
		if (!found || found.idx === 0) return;
		const tmp = found.parent[found.idx - 1];
		found.parent[found.idx - 1] = found.parent[found.idx];
		found.parent[found.idx] = tmp;
		nodes = nodes;
	}

	function moveDown(id: string) {
		const found = findParent(nodes, id);
		if (!found || found.idx >= found.parent.length - 1) return;
		const tmp = found.parent[found.idx + 1];
		found.parent[found.idx + 1] = found.parent[found.idx];
		found.parent[found.idx] = tmp;
		nodes = nodes;
	}

	function indent(id: string) {
		// Make this node a child of the previous sibling.
		const found = findParent(nodes, id);
		if (!found || found.idx === 0) return;
		const node = found.parent.splice(found.idx, 1)[0];
		const newParent = found.parent[found.idx - 1];
		newParent.children.push(node);
		newParent._open = true;
		nodes = nodes;
	}

	function outdent(id: string) {
		// Move this node out one level (i.e. become a sibling of its parent).
		// Walk: find its parent node, then that parent's parent list.
		const stack: { list: Node[]; node: Node | null }[] = [{ list: nodes, node: null }];
		const visit = (list: Node[], parent: Node | null): boolean => {
			for (let i = 0; i < list.length; i++) {
				const n = list[i];
				if (n.id === id) {
					if (!parent) return false; // already top-level
					// Find parent's position in its own parent list
					const grand = findParent(nodes, parent.id);
					if (!grand) return false;
					list.splice(i, 1);
					grand.parent.splice(grand.idx + 1, 0, n);
					return true;
				}
				if (visit(n.children, n)) return true;
			}
			return false;
		};
		if (visit(nodes, null)) {
			nodes = nodes;
		}
	}

	function removeNode(id: string) {
		if (!confirm('Remove this menu item and all of its children?')) return;
		const found = findParent(nodes, id);
		if (!found) return;
		found.parent.splice(found.idx, 1);
		nodes = nodes;
	}

	function appendChild(parentId: string | null, child: Node) {
		if (parentId === null) {
			nodes.push(child);
		} else {
			const parent = findNode(nodes, parentId);
			if (!parent) return;
			parent.children.push(child);
			parent._open = true;
		}
		nodes = nodes;
	}

	// --- Add new items ------------------------------------------------------

	function newCustomLink(label: string, url: string): Node {
		return {
			id: uid(),
			kind: 'custom',
			refId: null,
			url,
			labelVi: label,
			labelEn: null,
			target: '_self',
			isMega: false,
			data: {},
			children: [],
			_open: false
		};
	}

	function newRefItem(kind: Kind, refId: string, labelVi: string, labelEn?: string): Node {
		return {
			id: uid(),
			kind,
			refId,
			url: null,
			labelVi,
			labelEn: labelEn ?? null,
			target: '_self',
			isMega: false,
			data: {},
			children: [],
			_open: false
		};
	}

	function addQuickCustom(toParentId: string | null = null) {
		appendChild(toParentId, newCustomLink('New link', '/'));
	}

	function addMegaColumn(parentId: string) {
		appendChild(
			parentId,
			{
				id: uid(),
				kind: 'mega_column',
				refId: null,
				url: null,
				labelVi: 'Cột mới',
				labelEn: 'New column',
				target: '_self',
				isMega: false,
				data: {},
				children: [],
				_open: true
			}
		);
	}

	function addMegaPromo(parentId: string) {
		appendChild(
			parentId,
			{
				id: uid(),
				kind: 'mega_promo',
				refId: null,
				url: '',
				labelVi: 'Tiêu đề khuyến mãi',
				labelEn: 'Promo heading',
				target: '_self',
				isMega: false,
				data: {
					imageUrl: '',
					eyebrowVi: '',
					eyebrowEn: '',
					descVi: '',
					descEn: '',
					ctaLabelVi: '',
					ctaLabelEn: '',
					ctaUrl: ''
				},
				children: [],
				_open: true
			}
		);
	}

	function addMegaFeatured(parentId: string) {
		appendChild(
			parentId,
			{
				id: uid(),
				kind: 'mega_featured',
				refId: null,
				url: null,
				labelVi: 'Sản phẩm nổi bật',
				labelEn: 'Featured products',
				target: '_self',
				isMega: false,
				data: { productIds: [] as string[] },
				children: [],
				_open: true
			}
		);
	}

	function toggleProductPick(node: Node, productId: string) {
		const ids = Array.isArray(node.data.productIds) ? [...(node.data.productIds as string[])] : [];
		const i = ids.indexOf(productId);
		if (i >= 0) ids.splice(i, 1);
		else ids.push(productId);
		node.data.productIds = ids;
		nodes = nodes;
	}

	// Sidebar bulk pickers
	let pickedItems = $state<Set<string>>(new Set());

	function togglePicked(key: string) {
		if (pickedItems.has(key)) pickedItems.delete(key);
		else pickedItems.add(key);
		pickedItems = new Set(pickedItems);
	}

	function addPickedToMenu() {
		for (const key of pickedItems) {
			const [k, id] = key.split('::');
			if (k === 'category') {
				const c = data.picks.cats.find((x) => x.id === id);
				if (c) appendChild(null, newRefItem('category', c.id, c.vi, c.en));
			} else if (k === 'project_category') {
				const c = data.picks.pcats.find((x) => x.id === id);
				if (c) appendChild(null, newRefItem('project_category', c.id, c.vi, c.en));
			} else if (k === 'page') {
				const p = data.picks.pages.find((x) => x.id === id);
				if (p) appendChild(null, newRefItem('page', p.id, p.vi, p.en));
			} else if (k === 'post') {
				const p = data.picks.posts.find((x) => x.id === id);
				if (p) appendChild(null, newRefItem('post', p.id, p.vi, p.en));
			} else if (k === 'showroom') {
				const s = data.picks.showrooms.find((x) => x.id === id);
				if (s) appendChild(null, newRefItem('showroom', s.id, s.city));
			}
		}
		pickedItems = new Set();
	}

	let customLabel = $state('');
	let customUrl = $state('/');
	function addCustomFromForm() {
		appendChild(null, newCustomLink(customLabel || 'New link', customUrl || '/'));
		customLabel = '';
		customUrl = '/';
	}

	// --- Serialize for save -------------------------------------------------

	function serializeTree(list: Node[]): unknown[] {
		return list.map((n) => ({
			id: n.id.startsWith('tmp-') ? undefined : n.id,
			kind: n.kind,
			refId: n.refId,
			url: n.url,
			labelVi: n.labelVi,
			labelEn: n.labelEn,
			target: n.target,
			isMega: n.isMega,
			data: n.data,
			children: serializeTree(n.children)
		}));
	}

	const treeJson = $derived(JSON.stringify(serializeTree(nodes)));

	const KIND_LABEL: Record<Kind, string> = {
		custom: 'Custom link',
		page: 'Page',
		category: 'Category',
		project_category: 'Project category',
		post: 'Post',
		showroom: 'Showroom',
		route: 'Built-in route',
		mega_column: 'Mega: column',
		mega_promo: 'Mega: promo block',
		mega_featured: 'Mega: featured products'
	};

	function filteredCats() {
		const q = pickerSearch.trim().toLowerCase();
		if (!q) return data.picks.cats;
		return data.picks.cats.filter(
			(c) => c.vi.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
		);
	}
	function filteredPcats() {
		const q = pickerSearch.trim().toLowerCase();
		if (!q) return data.picks.pcats;
		return data.picks.pcats.filter(
			(c) => c.vi.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
		);
	}
	function filteredPages() {
		const q = pickerSearch.trim().toLowerCase();
		if (!q) return data.picks.pages;
		return data.picks.pages.filter(
			(c) => c.vi.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
		);
	}
	function filteredPosts() {
		const q = pickerSearch.trim().toLowerCase();
		if (!q) return data.picks.posts;
		return data.picks.posts.filter(
			(c) => c.vi.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)
		);
	}
	function filteredProducts() {
		const q = pickerSearch.trim().toLowerCase();
		if (!q) return data.picks.products;
		return data.picks.products.filter(
			(p) => p.vi.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
		);
	}
</script>

<header class="adm-header">
	<div>
		<h1>Edit menu — {data.menu.name}</h1>
		<p>WordPress-style editor with full mega menu support. Items support custom links, pages, categories, project categories, posts, and showrooms.</p>
	</div>
	<a href="/admin/menus" class="adm-btn ghost">← Back to menus</a>
</header>

{#if form?.success}
	<p class="adm-flash">Menu saved.</p>
{/if}
{#if form?.message}
	<p class="adm-error">{form.message}</p>
{/if}

<form
	method="post"
	action="?/save"
	class="menu-shell"
	use:enhance={() =>
		async ({ update }) => {
			await update({ reset: false });
		}}
>
	<input type="hidden" name="tree" value={treeJson} />

	<aside class="menu-side">
		<div class="card">
			<h3>Menu identity</h3>
			<div class="adm-field">
				<label class="lbl" for="m-name">Name</label>
				<input id="m-name" class="adm-input" name="name" bind:value={menuName} required />
			</div>
			<div class="adm-field">
				<label class="lbl" for="m-slug">Slug</label>
				<input id="m-slug" class="adm-input" name="slug" bind:value={menuSlug} />
			</div>
			<div class="adm-field">
				<label class="lbl" for="m-loc">Location</label>
				<select id="m-loc" class="adm-select" name="location" bind:value={menuLocation}>
					<option value="">— None —</option>
					{#each data.locations as loc (loc)}
						<option value={loc}>{loc}</option>
					{/each}
				</select>
				<p class="adm-help">Only one menu can occupy a location at a time.</p>
			</div>
			<label class="toggle-row">
				<input type="checkbox" name="isActive" value="1" bind:checked={menuActive} />
				<span class="toggle-text">
					<span class="lbl as-label">Active</span>
					<span class="adm-help">Inactive menus are not loaded by the public site.</span>
				</span>
			</label>
		</div>

		<div class="card">
			<h3>Add custom link</h3>
			<div class="adm-field">
				<label class="lbl" for="cu-label">Label</label>
				<input id="cu-label" class="adm-input" bind:value={customLabel} placeholder="Trang mới" />
			</div>
			<div class="adm-field">
				<label class="lbl" for="cu-url">URL</label>
				<input id="cu-url" class="adm-input" bind:value={customUrl} placeholder="/path or https://..." />
			</div>
			<button type="button" class="adm-btn" onclick={addCustomFromForm}>+ Add custom</button>
		</div>

		<div class="card">
			<h3>Add from content</h3>
			<input
				type="search"
				class="adm-input"
				placeholder="Filter…"
				bind:value={pickerSearch}
				style="margin-bottom:8px"
			/>
			<details class="picker-section" open>
				<summary>Categories</summary>
				<ul class="pick-list">
					{#each filteredCats() as c (c.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={pickedItems.has(`category::${c.id}`)}
									onchange={() => togglePicked(`category::${c.id}`)}
								/>
								<span>{c.vi} <em>({c.en})</em></span>
							</label>
						</li>
					{/each}
				</ul>
			</details>
			<details class="picker-section">
				<summary>Project categories</summary>
				<ul class="pick-list">
					{#each filteredPcats() as c (c.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={pickedItems.has(`project_category::${c.id}`)}
									onchange={() => togglePicked(`project_category::${c.id}`)}
								/>
								<span>{c.vi} <em>({c.en})</em></span>
							</label>
						</li>
					{/each}
				</ul>
			</details>
			<details class="picker-section">
				<summary>Pages</summary>
				<ul class="pick-list">
					{#each filteredPages() as p (p.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={pickedItems.has(`page::${p.id}`)}
									onchange={() => togglePicked(`page::${p.id}`)}
								/>
								<span>{p.vi}</span>
							</label>
						</li>
					{:else}
						<li class="empty">No pages.</li>
					{/each}
				</ul>
			</details>
			<details class="picker-section">
				<summary>Posts</summary>
				<ul class="pick-list">
					{#each filteredPosts() as p (p.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={pickedItems.has(`post::${p.id}`)}
									onchange={() => togglePicked(`post::${p.id}`)}
								/>
								<span>{p.vi}</span>
							</label>
						</li>
					{/each}
				</ul>
			</details>
			<details class="picker-section">
				<summary>Showrooms</summary>
				<ul class="pick-list">
					{#each data.picks.showrooms as s (s.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={pickedItems.has(`showroom::${s.id}`)}
									onchange={() => togglePicked(`showroom::${s.id}`)}
								/>
								<span>{s.city}</span>
							</label>
						</li>
					{/each}
				</ul>
			</details>
			<button
				type="button"
				class="adm-btn primary"
				disabled={pickedItems.size === 0}
				onclick={addPickedToMenu}
			>
				+ Add {pickedItems.size || ''} to menu
			</button>
		</div>
	</aside>

	<section class="menu-main">
		<div class="card">
			<div class="menu-main-head">
				<h3>Menu structure</h3>
				<div class="actions">
					<button type="button" class="adm-btn sm" onclick={() => addQuickCustom(null)}>+ Add link</button>
					<button type="submit" class="adm-btn primary">Save menu</button>
				</div>
			</div>
			{#if nodes.length === 0}
				<p class="adm-help" style="padding:24px; text-align:center">
					This menu has no items yet. Use the panel on the left to add some.
				</p>
			{:else}
				<ul class="tree">
					{#each nodes as n, i (n.id)}
						{@render itemRow(n, i, nodes.length, 0)}
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</form>

{#snippet itemRow(node: Node, index: number, total: number, depth: number)}
	<li class="tree-item" data-depth={depth}>
		<div class="row">
			<button
				type="button"
				class="chev-btn"
				aria-label="Expand"
				onclick={() => (node._open = !node._open)}
			>
				<Icon name={node._open ? 'chev' : 'chevR'} size={14} stroke={2} />
			</button>
			<span class="kind-pill">{KIND_LABEL[node.kind]}</span>
			<span class="row-label">{node.labelVi || '(no label)'}</span>
			<div class="row-actions">
				<button type="button" class="icon-btn" title="Up" onclick={() => moveUp(node.id)} disabled={index === 0}>
					<Icon name="chev" size={12} stroke={2} style="transform:rotate(180deg)" />
				</button>
				<button type="button" class="icon-btn" title="Down" onclick={() => moveDown(node.id)} disabled={index === total - 1}>
					<Icon name="chev" size={12} stroke={2} />
				</button>
				<button type="button" class="icon-btn" title="Indent" onclick={() => indent(node.id)} disabled={index === 0}>
					→
				</button>
				<button type="button" class="icon-btn" title="Outdent" onclick={() => outdent(node.id)} disabled={depth === 0}>
					←
				</button>
				<button type="button" class="icon-btn danger" title="Remove" onclick={() => removeNode(node.id)}>
					<Icon name="close" size={12} stroke={2} />
				</button>
			</div>
		</div>

		{#if node._open}
			<div class="row-body">
				<div class="grid-2">
					<div class="adm-field">
						<label class="lbl">Label (VI)</label>
						<input class="adm-input" bind:value={node.labelVi} />
					</div>
					<div class="adm-field">
						<label class="lbl">Label (EN)</label>
						<input
							class="adm-input"
							value={node.labelEn ?? ''}
							oninput={(e) => (node.labelEn = (e.currentTarget as HTMLInputElement).value || null)}
						/>
					</div>
				</div>

				<div class="grid-2">
					<div class="adm-field">
						<label class="lbl">Item type</label>
						<select
							class="adm-select"
							value={node.kind}
							onchange={(e) => {
								node.kind = (e.currentTarget as HTMLSelectElement).value as Kind;
								node.refId = null;
							}}
						>
							{#each data.kinds as k (k)}
								<option value={k}>{KIND_LABEL[k as Kind]}</option>
							{/each}
						</select>
					</div>
					<div class="adm-field">
						<label class="lbl">Open in</label>
						<select class="adm-select" bind:value={node.target}>
							<option value="_self">Same tab</option>
							<option value="_blank">New tab</option>
						</select>
					</div>
				</div>

				{#if node.kind === 'custom' || node.kind === 'route'}
					<div class="adm-field">
						<label class="lbl">URL</label>
						<input class="adm-input" value={node.url ?? ''} oninput={(e) => (node.url = (e.currentTarget as HTMLInputElement).value)} placeholder="/products or https://..." />
					</div>
				{:else if node.kind === 'category'}
					<div class="adm-field">
						<label class="lbl">Category</label>
						<select class="adm-select" value={node.refId ?? ''} onchange={(e) => (node.refId = (e.currentTarget as HTMLSelectElement).value || null)}>
							<option value="">— Pick category —</option>
							{#each data.picks.cats as c (c.id)}
								<option value={c.id}>{c.vi} ({c.en})</option>
							{/each}
						</select>
					</div>
				{:else if node.kind === 'project_category'}
					<div class="adm-field">
						<label class="lbl">Project category</label>
						<select class="adm-select" value={node.refId ?? ''} onchange={(e) => (node.refId = (e.currentTarget as HTMLSelectElement).value || null)}>
							<option value="">— Pick —</option>
							{#each data.picks.pcats as c (c.id)}
								<option value={c.id}>{c.vi} ({c.en})</option>
							{/each}
						</select>
					</div>
				{:else if node.kind === 'page'}
					<div class="adm-field">
						<label class="lbl">Page</label>
						<select class="adm-select" value={node.refId ?? ''} onchange={(e) => (node.refId = (e.currentTarget as HTMLSelectElement).value || null)}>
							<option value="">— Pick —</option>
							{#each data.picks.pages as p (p.id)}
								<option value={p.id}>{p.vi}</option>
							{/each}
						</select>
					</div>
				{:else if node.kind === 'post'}
					<div class="adm-field">
						<label class="lbl">Post</label>
						<select class="adm-select" value={node.refId ?? ''} onchange={(e) => (node.refId = (e.currentTarget as HTMLSelectElement).value || null)}>
							<option value="">— Pick —</option>
							{#each data.picks.posts as p (p.id)}
								<option value={p.id}>{p.vi}</option>
							{/each}
						</select>
					</div>
				{:else if node.kind === 'showroom'}
					<div class="adm-field">
						<label class="lbl">Showroom</label>
						<select class="adm-select" value={node.refId ?? ''} onchange={(e) => (node.refId = (e.currentTarget as HTMLSelectElement).value || null)}>
							<option value="">— Pick —</option>
							{#each data.picks.showrooms as s (s.id)}
								<option value={s.id}>{s.city}</option>
							{/each}
						</select>
					</div>
				{:else if node.kind === 'mega_promo'}
					{@render megaPromoEditor(node)}
				{:else if node.kind === 'mega_featured'}
					{@render megaFeaturedEditor(node)}
				{/if}

				{#if depth === 0}
					<label class="toggle-row">
						<input
							type="checkbox"
							checked={node.isMega}
							onchange={(e) => (node.isMega = (e.currentTarget as HTMLInputElement).checked)}
						/>
						<span class="toggle-text">
							<span class="lbl as-label">Mega menu</span>
							<span class="adm-help">When on, child items render as mega menu columns / promo / featured products.</span>
						</span>
					</label>

					{#if node.isMega}
						<div class="mega-actions">
							<button type="button" class="adm-btn sm" onclick={() => addMegaColumn(node.id)}>+ Column</button>
							<button type="button" class="adm-btn sm" onclick={() => addMegaFeatured(node.id)}>+ Featured products</button>
							<button type="button" class="adm-btn sm" onclick={() => addMegaPromo(node.id)}>+ Promo block</button>
						</div>
					{/if}
				{/if}

				<div class="child-actions">
					<button type="button" class="adm-btn sm ghost" onclick={() => addQuickCustom(node.id)}>+ Add child link</button>
				</div>
			</div>
		{/if}

		{#if node.children.length > 0}
			<ul class="tree">
				{#each node.children as child, ci (child.id)}
					{@render itemRow(child, ci, node.children.length, depth + 1)}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

{#snippet megaPromoEditor(node: Node)}
	<div class="mega-block">
		<h4>Promo block</h4>
		<div class="adm-field">
			<label class="lbl">Image</label>
			<ImageField
				name="_promo_img"
				value={String(node.data.imageUrl ?? '')}
				prefix="menu-promo"
				oninput={(v) => (node.data.imageUrl = v)}
			/>
		</div>
		<div class="grid-2">
			<div class="adm-field">
				<label class="lbl">Eyebrow (VI)</label>
				<input
					class="adm-input"
					value={String(node.data.eyebrowVi ?? '')}
					oninput={(e) => (node.data.eyebrowVi = (e.currentTarget as HTMLInputElement).value)}
				/>
			</div>
			<div class="adm-field">
				<label class="lbl">Eyebrow (EN)</label>
				<input
					class="adm-input"
					value={String(node.data.eyebrowEn ?? '')}
					oninput={(e) => (node.data.eyebrowEn = (e.currentTarget as HTMLInputElement).value)}
				/>
			</div>
		</div>
		<p class="adm-help">The heading uses this item's <strong>Label (VI/EN)</strong> above.</p>
		<div class="grid-2">
			<div class="adm-field">
				<label class="lbl">Description (VI)</label>
				<textarea
					class="adm-textarea"
					value={String(node.data.descVi ?? '')}
					oninput={(e) => (node.data.descVi = (e.currentTarget as HTMLTextAreaElement).value)}
				></textarea>
			</div>
			<div class="adm-field">
				<label class="lbl">Description (EN)</label>
				<textarea
					class="adm-textarea"
					value={String(node.data.descEn ?? '')}
					oninput={(e) => (node.data.descEn = (e.currentTarget as HTMLTextAreaElement).value)}
				></textarea>
			</div>
		</div>
		<div class="grid-2">
			<div class="adm-field">
				<label class="lbl">CTA label (VI)</label>
				<input
					class="adm-input"
					value={String(node.data.ctaLabelVi ?? '')}
					oninput={(e) => (node.data.ctaLabelVi = (e.currentTarget as HTMLInputElement).value)}
				/>
			</div>
			<div class="adm-field">
				<label class="lbl">CTA label (EN)</label>
				<input
					class="adm-input"
					value={String(node.data.ctaLabelEn ?? '')}
					oninput={(e) => (node.data.ctaLabelEn = (e.currentTarget as HTMLInputElement).value)}
				/>
			</div>
		</div>
		<div class="adm-field">
			<label class="lbl">CTA URL</label>
			<input
				class="adm-input"
				value={String(node.data.ctaUrl ?? '')}
				oninput={(e) => (node.data.ctaUrl = (e.currentTarget as HTMLInputElement).value)}
				placeholder="/quote"
			/>
		</div>
	</div>
{/snippet}

{#snippet megaFeaturedEditor(node: Node)}
	<div class="mega-block">
		<h4>Featured products</h4>
		<p class="adm-help">Pick the products shown in this column. The heading uses this item's Label.</p>
		<div class="featured-pick">
			{#each filteredProducts() as p (p.id)}
				<label class="featured-row">
					<input
						type="checkbox"
						checked={Array.isArray(node.data.productIds) && (node.data.productIds as string[]).includes(p.id)}
						onchange={() => toggleProductPick(node, p.id)}
					/>
					<span>{p.vi} <em style="color:var(--fg-3)">{p.code}</em></span>
				</label>
			{/each}
		</div>
	</div>
{/snippet}

<style>
	.menu-shell {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 24px;
		align-items: start;
	}
	@media (max-width: 1100px) {
		.menu-shell {
			grid-template-columns: 1fr;
		}
	}
	.menu-side {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.card {
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 16px;
		box-shadow: var(--shadow-1);
	}
	.card h3 {
		margin: 0 0 12px;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 800;
	}
	.menu-main-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}
	.menu-main-head h3 {
		margin: 0;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.menu-main-head .actions {
		display: flex;
		gap: 8px;
	}
	.tree {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.tree .tree {
		margin-left: 32px;
		border-left: 2px solid var(--hairline);
		padding-left: 12px;
		margin-top: 6px;
	}
	.tree-item .row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.tree-item .chev-btn {
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
		display: inline-flex;
		padding: 2px 4px;
	}
	.tree-item .kind-pill {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--fg-2);
	}
	.tree-item .row-label {
		flex: 1;
		font-weight: 600;
		font-size: 14px;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tree-item .row-actions {
		display: flex;
		gap: 4px;
	}
	.tree-item .row-actions .icon-btn {
		appearance: none;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 4px 8px;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
	}
	.tree-item .row-actions .icon-btn[disabled] {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.tree-item .row-actions .icon-btn.danger {
		color: var(--danger);
	}
	.row-body {
		margin: 8px 0 4px 28px;
		padding: 12px;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		background: var(--paper);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	@media (max-width: 720px) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}
	.mega-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.mega-block {
		padding: 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bone);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.mega-block h4 {
		margin: 0;
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.featured-pick {
		max-height: 220px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.featured-row {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 4px 8px;
		font-size: 13px;
		cursor: pointer;
	}
	.featured-row:hover {
		background: var(--bone);
	}
	.picker-section {
		border-top: 1px solid var(--hairline);
		padding-top: 8px;
		margin-top: 8px;
	}
	.picker-section summary {
		font-weight: 700;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		padding: 4px 0;
	}
	.pick-list {
		list-style: none;
		margin: 4px 0 0;
		padding: 0;
		max-height: 180px;
		overflow-y: auto;
	}
	.pick-list li {
		padding: 2px 0;
	}
	.pick-list label {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
		cursor: pointer;
	}
	.pick-list em {
		color: var(--fg-3);
		font-style: normal;
		font-size: 11px;
	}
	.pick-list .empty {
		color: var(--fg-3);
		font-size: 12px;
	}
	.toggle-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: start;
		cursor: pointer;
		margin-top: 8px;
	}
	.toggle-row input[type='checkbox'] {
		appearance: none;
		width: 38px;
		height: 22px;
		background: var(--hairline);
		border-radius: 999px;
		position: relative;
		cursor: pointer;
		margin-top: 2px;
		transition: background var(--dur-base) var(--ease-out);
		flex: none;
	}
	.toggle-row input[type='checkbox']::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--paper);
		border-radius: 50%;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		transition: transform var(--dur-base) var(--ease-out);
	}
	.toggle-row input[type='checkbox']:checked {
		background: var(--accent);
	}
	.toggle-row input[type='checkbox']:checked::after {
		transform: translateX(16px);
	}
	.toggle-row .toggle-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.toggle-row .as-label {
		font-family: var(--font-body);
		font-size: var(--fs-xs);
		font-weight: var(--fw-bold);
		color: var(--fg-2);
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
	}
	.child-actions {
		display: flex;
		gap: 8px;
	}
</style>

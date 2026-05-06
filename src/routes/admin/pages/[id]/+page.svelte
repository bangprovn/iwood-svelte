<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { page as pageStore } from '$app/state';
	import type { ActionData, PageData } from './$types';
	import BlockRow from '$lib/components/admin/builder/BlockRow.svelte';
	import BlockInspector from '$lib/components/admin/builder/BlockInspector.svelte';
	import BlockLibraryDrawer from '$lib/components/admin/builder/BlockLibraryDrawer.svelte';
	import PageSettingsDrawer from '$lib/components/admin/builder/PageSettingsDrawer.svelte';
	import type { BlockType } from '$lib/page-blocks/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let p = $derived(data.page);
	let dirty = $derived(data.dirty);
	let blockDefinitions = $derived(data.blockDefinitions);

	let localBlocks = $state([...p.blocks]);
	$effect(() => {
		// Re-sync from server data after invalidation (add/duplicate/delete/reorder)
		localBlocks = [...p.blocks];
	});

	let selectedId = $state<string | null>(null);
	$effect(() => {
		const fromQuery = pageStore.url.searchParams.get('block');
		if (fromQuery && localBlocks.some((b) => b.id === fromQuery)) {
			selectedId = fromQuery;
		} else if (selectedId && !localBlocks.some((b) => b.id === selectedId)) {
			selectedId = null;
		}
	});

	const selectedBlock = $derived(
		selectedId ? localBlocks.find((b) => b.id === selectedId) : null
	);
	const selectedDef = $derived(
		selectedBlock ? blockDefinitions.find((d) => d.type === selectedBlock.type) : null
	);

	function selectBlock(id: string) {
		selectedId = id;
		const url = new URL(pageStore.url);
		url.searchParams.set('block', id);
		goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function clearSelection() {
		selectedId = null;
		const url = new URL(pageStore.url);
		url.searchParams.delete('block');
		goto(url.pathname + (url.search || ''), { replaceState: true, noScroll: true, keepFocus: true });
	}

	// ---- Library drawer ----
	let libraryOpen = $state(false);
	// When set, a new block created via the library will be inserted right
	// after this block id ('__start__' to insert at the very top, null = append).
	let insertAfter = $state<string | null>(null);

	function openLibrary(after: string | null = null) {
		insertAfter = after;
		libraryOpen = true;
	}

	async function handlePickFromLibrary(type: BlockType) {
		const fd = new FormData();
		fd.append('type', type);
		if (insertAfter !== null) fd.append('insertAfter', insertAfter);
		const beforeIds = new Set(data.page.blocks.map((b) => b.id));
		try {
			const res = await fetch(`/admin/pages/${p.id}?/addBlock`, { method: 'POST', body: fd });
			if (!res.ok) return;
			await invalidateAll();
			const newBlock = data.page.blocks.find((b) => !beforeIds.has(b.id));
			if (newBlock) selectBlock(newBlock.id);
		} finally {
			insertAfter = null;
		}
	}

	// ---- Settings drawer ----
	let settingsOpen = $state(false);

	// ---- Drag and drop ----
	let dragId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	function onDragStart(e: DragEvent, id: string) {
		dragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}
	function onDragOver(e: DragEvent, id: string) {
		e.preventDefault();
		if (dragId && dragId !== id) dragOverId = id;
	}
	function onDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!dragId || dragId === targetId) {
			dragId = null;
			dragOverId = null;
			return;
		}
		const fromIdx = localBlocks.findIndex((b) => b.id === dragId);
		const toIdx = localBlocks.findIndex((b) => b.id === targetId);
		if (fromIdx === -1 || toIdx === -1) return;
		const reordered = [...localBlocks];
		const [moved] = reordered.splice(fromIdx, 1);
		reordered.splice(toIdx, 0, moved);
		localBlocks = reordered;
		dragId = null;
		dragOverId = null;
		void persistOrder(reordered.map((b) => b.id));
	}
	function onDragEnd() {
		dragId = null;
		dragOverId = null;
	}

	async function persistOrder(order: string[]) {
		try {
			await fetch(`/admin/pages/${p.id}/blocks/reorder`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ order })
			});
			invalidateAll();
		} catch {
			/* swallow */
		}
	}

	const publishLabel = $derived(p.publishedAt ? (dirty ? 'Publish changes' : 'Up to date') : 'Publish');
	const publishDisabled = $derived(!dirty && !!p.publishedAt);
</script>

<div class="builder">
	<header class="bar">
		<div class="bar-left">
			<a class="back-link" href="/admin/pages" title="Back to pages">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
			<div class="title-block">
				<h1>{p.titleVi}</h1>
				<div class="meta">
					<code>/{p.slug}</code>
					{#if p.publishedAt}
						<span class="status pub" title={`Published ${new Date(p.publishedAt).toLocaleString()}`}>
							<span class="status-dot"></span> Published
						</span>
						{#if dirty}
							<span class="status dirty">Unpublished changes</span>
						{/if}
					{:else}
						<span class="status draft">
							<span class="status-dot"></span> Draft — never published
						</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="bar-right">
			<button type="button" class="adm-btn ghost" onclick={() => (settingsOpen = true)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
				Settings
			</button>
			<a class="adm-btn ghost" href={`/admin/pages/${p.id}/revisions`}>Revisions</a>
			<a class="adm-btn ghost" href={`/admin/pages/${p.id}/preview`} target="_blank">
				Preview
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="7" y1="17" x2="17" y2="7" /><polyline points="9 7 17 7 17 15" />
				</svg>
			</a>
			<form method="post" action="?/publish" use:enhance>
				<button type="submit" class="adm-btn primary" disabled={publishDisabled}>
					{publishLabel}
				</button>
			</form>
		</div>
	</header>

	{#if form?.scope === 'page' && form?.success}
		<div class="page-banner success">Page settings saved.</div>
	{/if}
	{#if form?.scope === 'publish' && form?.success}
		<div class="page-banner success">Published successfully.</div>
	{/if}
	{#if form?.scope === 'page' && form?.error}
		<div class="page-banner error">{form.error}</div>
	{/if}

	<div class="grid">
		<section class="left" aria-label="Page blocks">
			<div class="left-head">
				<div class="left-head-l">
					<strong>Blocks</strong>
					<span class="muted">{localBlocks.length} {localBlocks.length === 1 ? 'block' : 'blocks'}</span>
				</div>
				<div class="left-head-r">
					<form
						method="post"
						action="?/copyLocale"
						use:enhance={() => async ({ update }) => {
							if (
								confirm(
									'Copy all Vietnamese content into English? This overwrites English content for every block.'
								)
							)
								await update();
						}}
					>
						<input type="hidden" name="from" value="vi" />
						<input type="hidden" name="to" value="en" />
						<button type="submit" class="link-btn" title="Copy VI → EN for every block on this page">VI → EN</button>
					</form>
					<button type="button" class="adm-btn primary sm" onclick={() => openLibrary(null)}>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Add block
					</button>
				</div>
			</div>

			{#if localBlocks.length === 0}
				<div class="empty">
					<div class="empty-icon">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
						</svg>
					</div>
					<h2>Start with your first block</h2>
					<p>Pick a hero, text, image, or any other block from the library.</p>
					<button type="button" class="adm-btn primary" onclick={() => openLibrary(null)}>+ Add a block</button>
				</div>
			{:else}
				<ol class="block-list">
					<li class="insert-zone start" aria-hidden="false">
						<button type="button" class="insert-btn" onclick={() => openLibrary('__start__')}>
							<span class="insert-line"></span>
							<span class="insert-tag">+ Insert block</span>
							<span class="insert-line"></span>
						</button>
					</li>
					{#each localBlocks as block (block.id)}
						<li>
							<BlockRow
								{block}
								selected={selectedId === block.id}
								isDragging={dragId === block.id}
								isDragOver={dragOverId === block.id}
								onSelect={selectBlock}
								{onDragStart}
								{onDragOver}
								{onDrop}
								{onDragEnd}
							/>
							<div class="insert-zone">
								<button type="button" class="insert-btn" onclick={() => openLibrary(block.id)}>
									<span class="insert-line"></span>
									<span class="insert-tag">+ Insert block</span>
									<span class="insert-line"></span>
								</button>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<section class="right" aria-label="Block inspector">
			{#if selectedBlock && selectedDef}
				{#key selectedBlock.id}
					<BlockInspector
						block={selectedBlock}
						definition={selectedDef}
						pageId={p.id}
						onClose={clearSelection}
					/>
				{/key}
			{:else}
				<div class="empty-inspector">
					<div class="empty-inspector-icon">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
							<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
							<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
							<line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
						</svg>
					</div>
					<h3>Select a block</h3>
					<p>Click any block on the left to edit its content and style. Changes save automatically.</p>
				</div>
			{/if}
		</section>
	</div>
</div>

{#if libraryOpen}
	<BlockLibraryDrawer onSelect={handlePickFromLibrary} onClose={() => (libraryOpen = false)} />
{/if}

{#if settingsOpen}
	<PageSettingsDrawer
		page={p}
		formError={form?.scope === 'page' && form?.error ? form.error : null}
		formSuccess={form?.scope === 'page' && form?.success === true}
		onClose={() => (settingsOpen = false)}
	/>
{/if}

<style>
	.builder {
		margin: -32px calc(-1 * clamp(20px, 4vw, 40px)) -64px;
		display: flex;
		flex-direction: column;
		min-height: calc(100vh);
		background: var(--bone);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 18px;
		background: var(--paper);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 50;
	}
	.bar-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }
	.bar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.back-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 4px;
		color: var(--fg-2) !important;
		border: 1.5px solid var(--border);
		text-decoration: none;
		transition: all 120ms var(--ease-out);
	}
	.back-link:hover { background: var(--bone); color: var(--ink) !important; }
	.title-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.title-block h1 {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
	}
	.meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.meta code {
		font-size: 11px;
		color: var(--fg-3);
		background: var(--bone);
		padding: 1px 6px;
		border-radius: 3px;
		font-family: ui-monospace, monospace;
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 2px 8px;
		border-radius: 3px;
	}
	.status-dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}
	.status.pub { color: var(--success); background: #d4edda; }
	.status.pub .status-dot { background: var(--success); }
	.status.draft { color: var(--fg-3); background: var(--bone); border: 1px solid var(--border); }
	.status.draft .status-dot { background: var(--fg-4); }
	.status.dirty { color: #856404; background: #fff3cd; }

	.adm-btn.sm {
		padding: 4px 10px !important;
		font-size: 11px !important;
	}

	.page-banner {
		padding: 8px 18px;
		font-size: 13px;
		font-weight: 500;
	}
	.page-banner.success { background: #d4edda; color: var(--success); border-bottom: 1px solid var(--success); }
	.page-banner.error { background: #f8d7da; color: var(--danger, #c00); border-bottom: 1px solid var(--danger, #c00); }

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(380px, 440px);
		flex: 1;
		min-height: 0;
	}
	@media (max-width: 1100px) {
		.grid { grid-template-columns: minmax(0, 1fr) minmax(340px, 400px); }
	}
	@media (max-width: 880px) {
		.grid { grid-template-columns: 1fr; }
	}

	.left {
		padding: 16px 18px 60px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.left-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 4px 2px 8px;
	}
	.left-head-l { display: flex; align-items: baseline; gap: 8px; }
	.left-head-l strong {
		font-family: var(--font-display);
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink);
	}
	.left-head-l .muted {
		font-size: 11px;
		color: var(--fg-3);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.left-head-r { display: flex; align-items: center; gap: 8px; }
	.link-btn {
		appearance: none;
		background: transparent;
		border: none;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-3);
		cursor: pointer;
		padding: 4px 6px;
	}
	.link-btn:hover { color: var(--accent); }

	.empty {
		text-align: center;
		padding: 60px 24px;
		background: var(--paper);
		border: 1.5px dashed var(--border);
		border-radius: 6px;
		color: var(--fg-3);
	}
	.empty-icon { color: var(--fg-4); margin-bottom: 8px; display: flex; justify-content: center; }
	.empty h2 {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		color: var(--ink);
		text-transform: uppercase;
		letter-spacing: 0.02em;
		margin: 0 0 4px;
	}
	.empty p { margin: 0 0 18px; font-size: 13px; }

	.block-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.block-list > li { display: flex; flex-direction: column; }

	.insert-zone {
		display: flex;
		justify-content: center;
		height: 16px;
		position: relative;
		opacity: 0;
		transition: opacity 120ms var(--ease-out);
	}
	.insert-zone.start {
		height: 14px;
		opacity: 1;
	}
	.insert-zone:hover,
	.block-list > li:hover > .insert-zone,
	.block-list > li:focus-within > .insert-zone {
		opacity: 1;
	}
	.insert-btn {
		appearance: none;
		background: transparent;
		border: none;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		cursor: pointer;
		padding: 0 4px;
		color: var(--accent);
	}
	.insert-line {
		flex: 1;
		height: 1.5px;
		background: var(--accent);
		opacity: 0.35;
	}
	.insert-tag {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		background: var(--accent);
		color: var(--paper);
		border-radius: 3px;
		white-space: nowrap;
	}
	.insert-btn:hover .insert-line { opacity: 0.7; }

	.right {
		background: var(--paper);
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 64px);
		position: sticky;
		top: 64px;
		max-height: calc(100vh - 64px);
	}
	@media (max-width: 880px) {
		.right { position: static; border-left: none; border-top: 1px solid var(--border); max-height: none; }
	}

	.empty-inspector {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 48px 32px;
		color: var(--fg-3);
	}
	.empty-inspector-icon { color: var(--fg-4); margin-bottom: 12px; }
	.empty-inspector h3 {
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink);
		margin: 0 0 6px;
	}
	.empty-inspector p { margin: 0; font-size: 13px; max-width: 240px; line-height: 1.5; }
</style>

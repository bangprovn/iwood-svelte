<script lang="ts">
	import { enhance } from '$app/forms';
	import { getBlockDefinition } from '$lib/page-blocks/registry';
	import type { BlockType } from '$lib/page-blocks/types';
	import {
		blockIconPath,
		getBlockSummary,
		getBlockThumb,
		localeHasContent,
		type BlockLike
	} from './block-meta';

	type Block = BlockLike & {
		id: string;
		type: string;
		isActive: boolean;
		sortOrder: number;
	};

	type Props = {
		block: Block;
		selected?: boolean;
		isDragging?: boolean;
		isDragOver?: boolean;
		onSelect: (id: string) => void;
		onDragStart: (e: DragEvent, id: string) => void;
		onDragOver: (e: DragEvent, id: string) => void;
		onDrop: (e: DragEvent, id: string) => void;
		onDragEnd: () => void;
	};

	let {
		block,
		selected = false,
		isDragging = false,
		isDragOver = false,
		onSelect,
		onDragStart,
		onDragOver,
		onDrop,
		onDragEnd
	}: Props = $props();

	const def = $derived(getBlockDefinition(block.type as BlockType));
	const label = $derived(def?.label ?? block.type);
	const summary = $derived(getBlockSummary(block));
	const thumb = $derived(getBlockThumb(block));
	const hasVi = $derived(localeHasContent(block, 'vi'));
	const hasEn = $derived(localeHasContent(block, 'en'));
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="row"
	class:selected
	class:dragging={isDragging}
	class:drag-over={isDragOver}
	class:inactive={!block.isActive}
	role="button"
	tabindex="0"
	draggable="true"
	onclick={() => onSelect(block.id)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(block.id);
		}
	}}
	ondragstart={(e) => onDragStart(e, block.id)}
	ondragover={(e) => onDragOver(e, block.id)}
	ondrop={(e) => onDrop(e, block.id)}
	ondragend={onDragEnd}
>
	<div class="handle" title="Drag to reorder" aria-hidden="true">
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
			<circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
		</svg>
	</div>

	<div class="thumb-wrap">
		{#if thumb}
			<img class="thumb" src={thumb} alt="" loading="lazy" />
		{:else}
			<div class="icon-thumb">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
					<path d={blockIconPath(block.type)} />
				</svg>
			</div>
		{/if}
	</div>

	<div class="info">
		<div class="title-row">
			<strong class="title">{label}</strong>
			{#if !block.isActive}
				<span class="hidden-tag" title="Hidden — not shown on the published page">Hidden</span>
			{/if}
		</div>
		<span class="summary">{summary}</span>
	</div>

	<div class="locales" aria-label="Languages with content">
		<span class="dot" class:on={hasVi} title={hasVi ? 'Vietnamese content' : 'No Vietnamese content'}>VI</span>
		<span class="dot" class:on={hasEn} title={hasEn ? 'English content' : 'No English content'}>EN</span>
	</div>

	<div class="actions" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="group" aria-label="Block actions">
		<form method="post" action="?/toggleActive" use:enhance>
			<input type="hidden" name="blockId" value={block.id} />
			<input type="hidden" name="isActive" value={block.isActive ? '0' : '1'} />
			<button type="submit" class="row-act" title={block.isActive ? 'Hide block' : 'Show block'} aria-label={block.isActive ? 'Hide block' : 'Show block'}>
				{#if block.isActive}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
					</svg>
				{:else}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
					</svg>
				{/if}
			</button>
		</form>
		<form method="post" action="?/duplicate" use:enhance>
			<input type="hidden" name="blockId" value={block.id} />
			<button type="submit" class="row-act" title="Duplicate" aria-label="Duplicate block">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
				</svg>
			</button>
		</form>
		<form
			method="post"
			action="?/deleteBlock"
			use:enhance={() => async ({ update }) => {
				if (confirm('Delete this block?')) await update();
			}}
		>
			<input type="hidden" name="blockId" value={block.id} />
			<button type="submit" class="row-act danger" title="Delete" aria-label="Delete block">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
			</button>
		</form>
	</div>
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: 18px 44px 1fr auto auto;
		grid-gap: 10px;
		align-items: center;
		padding: 10px 12px;
		background: var(--paper);
		border: 1.5px solid var(--border);
		border-radius: 6px;
		cursor: pointer;
		transition: all 120ms var(--ease-out);
		position: relative;
		user-select: none;
	}
	.row:hover {
		border-color: var(--ink-2, #444);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}
	.row.selected {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent), 0 4px 14px rgba(227, 6, 19, 0.12);
		background: var(--paper);
	}
	.row.selected::before {
		content: '';
		position: absolute;
		left: -1.5px;
		top: -1.5px;
		bottom: -1.5px;
		width: 4px;
		background: var(--accent);
		border-radius: 6px 0 0 6px;
	}
	.row.dragging { opacity: 0.4; }
	.row.drag-over { border-color: var(--accent); background: var(--iwood-red-soft); }
	.row.inactive .thumb-wrap,
	.row.inactive .info { opacity: 0.55; }

	.handle {
		color: var(--fg-4);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
	}
	.handle:active { cursor: grabbing; }

	.thumb-wrap {
		width: 44px;
		height: 36px;
		border-radius: 4px;
		overflow: hidden;
		background: var(--bone);
		border: 1px solid var(--border);
		flex-shrink: 0;
	}
	.thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.icon-thumb {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
		background: var(--bone);
	}

	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.title {
		font-size: 13px;
		font-weight: 700;
		color: var(--ink);
		letter-spacing: 0.01em;
	}
	.hidden-tag {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-3);
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 0 5px;
	}
	.summary {
		font-size: 12px;
		color: var(--fg-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.locales {
		display: flex;
		gap: 3px;
	}
	.dot {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.08em;
		padding: 2px 5px;
		border-radius: 3px;
		background: transparent;
		color: var(--fg-4);
		border: 1px solid var(--border);
	}
	.dot.on {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
	}

	.actions {
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity 100ms var(--ease-out);
	}
	.row:hover .actions,
	.row.selected .actions,
	.row:focus-within .actions {
		opacity: 1;
	}
	.row-act {
		appearance: none;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		padding: 4px;
		color: var(--fg-3);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.row-act:hover {
		background: var(--bone);
		color: var(--ink);
		border-color: var(--border);
	}
	.row-act.danger:hover {
		color: var(--danger);
		border-color: var(--danger);
		background: transparent;
	}
	form { display: inline; }
</style>

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { BlockDefinition } from '$lib/page-blocks/registry';
	import BlockField from './BlockField.svelte';
	import { blockIconPath } from './block-meta';

	type BlockData = {
		id: string;
		type: string;
		isActive: boolean;
		globalSettings: string | null;
		content: Record<string, Record<string, unknown>>;
	};

	type Props = {
		block: BlockData;
		definition: BlockDefinition;
		pageId: string;
		onClose: () => void;
	};

	let { block, definition, pageId, onClose }: Props = $props();

	type Tab = 'content' | 'style';
	let activeTab = $state<Tab>('content');
	let activeLocale = $state<'vi' | 'en'>('vi');

	// Each inspector mount corresponds to one selected block (parent uses {#key
	// blockId}), so reading block props at init is intentional — we never need
	// to swap blocks within a single inspector instance.
	let settings = $state<Record<string, unknown>>(
		untrack(() => parseJson(block.globalSettings || '{}'))
	);
	let viContent = $state<Record<string, unknown>>(
		untrack(() => (block.content?.vi as Record<string, unknown>) || {})
	);
	let enContent = $state<Record<string, unknown>>(
		untrack(() => (block.content?.en as Record<string, unknown>) || {})
	);

	type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';
	let settingsStatus = $state<SaveStatus>('idle');
	let viStatus = $state<SaveStatus>('idle');
	let enStatus = $state<SaveStatus>('idle');

	let lastSavedSettings = untrack(() => JSON.stringify(settings));
	let lastSavedVi = untrack(() => JSON.stringify(viContent));
	let lastSavedEn = untrack(() => JSON.stringify(enContent));

	let settingsTimer: ReturnType<typeof setTimeout> | undefined;
	let viTimer: ReturnType<typeof setTimeout> | undefined;
	let enTimer: ReturnType<typeof setTimeout> | undefined;

	const DEBOUNCE_MS = 600;

	function parseJson(s: string): Record<string, unknown> {
		try {
			const v = JSON.parse(s);
			return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}

	$effect(() => {
		const cur = JSON.stringify(settings);
		if (cur === lastSavedSettings) return;
		settingsStatus = 'pending';
		clearTimeout(settingsTimer);
		settingsTimer = setTimeout(() => saveSettings(cur), DEBOUNCE_MS);
	});
	$effect(() => {
		const cur = JSON.stringify(viContent);
		if (cur === lastSavedVi) return;
		viStatus = 'pending';
		clearTimeout(viTimer);
		viTimer = setTimeout(() => saveContent('vi', cur), DEBOUNCE_MS);
	});
	$effect(() => {
		const cur = JSON.stringify(enContent);
		if (cur === lastSavedEn) return;
		enStatus = 'pending';
		clearTimeout(enTimer);
		enTimer = setTimeout(() => saveContent('en', cur), DEBOUNCE_MS);
	});

	async function saveSettings(snapshot: string) {
		settingsStatus = 'saving';
		const fd = new FormData();
		fd.append('blockId', block.id);
		for (const f of definition.settingsFields) {
			const v = settings[f.key];
			fd.append(`setting_${f.key}`, fieldToFormValue(v, f.type));
		}
		try {
			const res = await fetch(`/admin/pages/${pageId}?/saveBlockSettings`, {
				method: 'POST',
				body: fd
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			lastSavedSettings = snapshot;
			settingsStatus = 'saved';
			scheduleClear(() => (settingsStatus = 'idle'));
			invalidateAll();
		} catch {
			settingsStatus = 'error';
		}
	}

	async function saveContent(locale: 'vi' | 'en', snapshot: string) {
		const setStatus = (s: SaveStatus) => {
			if (locale === 'vi') viStatus = s;
			else enStatus = s;
		};
		setStatus('saving');
		const fd = new FormData();
		fd.append('blockId', block.id);
		fd.append('locale', locale);
		const bag = locale === 'vi' ? viContent : enContent;
		for (const f of definition.contentFields) {
			const v = bag[f.key];
			fd.append(`content_${f.key}`, fieldToFormValue(v, f.type));
		}
		try {
			const res = await fetch(`/admin/pages/${pageId}?/saveBlockContent`, {
				method: 'POST',
				body: fd
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			if (locale === 'vi') lastSavedVi = snapshot;
			else lastSavedEn = snapshot;
			setStatus('saved');
			scheduleClear(() => setStatus('idle'));
			invalidateAll();
		} catch {
			setStatus('error');
		}
	}

	function fieldToFormValue(v: unknown, type: string): string {
		if (type === 'imagelist') {
			return JSON.stringify(Array.isArray(v) ? v : []);
		}
		if (type === 'boolean') return v ? '1' : '0';
		if (v == null) return '';
		return String(v);
	}

	function scheduleClear(fn: () => void) {
		setTimeout(fn, 1500);
	}

	async function copyFromVi() {
		const fd = new FormData();
		fd.append('blockId', block.id);
		try {
			const res = await fetch(`/admin/pages/${pageId}?/copyBlockFromVi`, {
				method: 'POST',
				body: fd
			});
			if (!res.ok) return;
			const cloned = JSON.parse(JSON.stringify(viContent));
			enContent = cloned;
			lastSavedEn = JSON.stringify(cloned);
			enStatus = 'saved';
			scheduleClear(() => (enStatus = 'idle'));
			invalidateAll();
		} catch {
			enStatus = 'error';
		}
	}

	const overallStatus = $derived(
		([settingsStatus, viStatus, enStatus].includes('error')
			? 'error'
			: [settingsStatus, viStatus, enStatus].includes('saving')
				? 'saving'
				: [settingsStatus, viStatus, enStatus].includes('pending')
					? 'pending'
					: [settingsStatus, viStatus, enStatus].includes('saved')
						? 'saved'
						: 'idle') satisfies SaveStatus
	);

	const statusLabel = $derived(
		overallStatus === 'pending'
			? 'Unsaved'
			: overallStatus === 'saving'
				? 'Saving…'
				: overallStatus === 'saved'
					? 'Saved'
					: overallStatus === 'error'
						? 'Save failed'
						: ''
	);
</script>

<aside class="inspector">
	<header class="ins-head">
		<div class="ins-block">
			<div class="ins-icon" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d={blockIconPath(block.type)} />
				</svg>
			</div>
			<div class="ins-titles">
				<strong>{definition.label}</strong>
				<span>{definition.description}</span>
			</div>
		</div>
		<button type="button" class="close" onclick={onClose} aria-label="Close inspector">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
			</svg>
		</button>
	</header>

	<div class="ins-statusbar">
		<div class="tabs">
			<button type="button" class="tab" class:active={activeTab === 'content'} onclick={() => (activeTab = 'content')}>Content</button>
			<button type="button" class="tab" class:active={activeTab === 'style'} onclick={() => (activeTab = 'style')}>Style</button>
		</div>
		{#if statusLabel}
			<span class="ins-status" data-status={overallStatus}>{statusLabel}</span>
		{/if}
	</div>

	<div class="ins-body">
		{#if activeTab === 'content'}
			<div class="locale-switch" role="tablist" aria-label="Locale">
				<button
					type="button"
					role="tab"
					aria-selected={activeLocale === 'vi'}
					class:active={activeLocale === 'vi'}
					onclick={() => (activeLocale = 'vi')}
				>
					🇻🇳 Vietnamese
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeLocale === 'en'}
					class:active={activeLocale === 'en'}
					onclick={() => (activeLocale = 'en')}
				>
					🇬🇧 English
				</button>
				{#if activeLocale === 'en'}
					<button type="button" class="copy-from-vi" onclick={copyFromVi} title="Copy Vietnamese content into English">
						↩ Copy from VI
					</button>
				{/if}
			</div>

			{#if definition.contentFields.length === 0}
				<p class="empty-fields">This block has no per-language content. Edit its style instead.</p>
			{:else if activeLocale === 'vi'}
				<div class="fields">
					{#each definition.contentFields as field (field.key)}
						<BlockField {field} inputName={`content_${field.key}`} bag={viContent} />
					{/each}
				</div>
			{:else}
				<div class="fields">
					{#each definition.contentFields as field (field.key)}
						<BlockField {field} inputName={`content_${field.key}`} bag={enContent} />
					{/each}
				</div>
			{/if}
		{:else}
			{#if definition.settingsFields.length === 0}
				<p class="empty-fields">This block has no style options.</p>
			{:else}
				<div class="fields">
					{#each definition.settingsFields as field (field.key)}
						<BlockField {field} inputName={`setting_${field.key}`} bag={settings} />
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</aside>

<style>
	.inspector {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		background: var(--paper);
		border-left: 1px solid var(--border);
	}
	.ins-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.ins-block { display: flex; align-items: center; gap: 10px; min-width: 0; }
	.ins-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--accent);
		flex-shrink: 0;
	}
	.ins-titles { display: flex; flex-direction: column; min-width: 0; }
	.ins-titles strong {
		font-family: var(--font-display);
		font-size: 15px;
		font-weight: 700;
		color: var(--ink);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	.ins-titles span {
		font-size: 11px;
		color: var(--fg-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.close {
		appearance: none;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		padding: 6px;
		color: var(--fg-3);
		cursor: pointer;
	}
	.close:hover { background: var(--bone); color: var(--ink); border-color: var(--border); }

	.ins-statusbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 16px 0;
		border-bottom: 1px solid var(--border);
	}
	.tabs { display: flex; gap: 2px; }
	.tab {
		appearance: none;
		background: none;
		border: none;
		padding: 8px 14px 10px;
		font-family: var(--font-body);
		font-size: 12px;
		font-weight: 700;
		color: var(--fg-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	.tab:hover { color: var(--ink); }
	.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

	.ins-status {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--bone);
		color: var(--fg-3);
		margin-bottom: 6px;
	}
	.ins-status[data-status='saved'] { background: #d4edda; color: var(--success); }
	.ins-status[data-status='saving'] { background: #fff3cd; color: #856404; }
	.ins-status[data-status='pending'] { background: #fff3cd; color: #856404; }
	.ins-status[data-status='error'] { background: #f8d7da; color: var(--danger, #c00); }

	.ins-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.locale-switch {
		display: flex;
		gap: 4px;
		padding: 3px;
		background: var(--bone);
		border-radius: 6px;
		align-self: flex-start;
		flex-wrap: wrap;
	}
	.locale-switch button {
		appearance: none;
		background: transparent;
		border: none;
		padding: 5px 12px;
		font-family: var(--font-body);
		font-size: 12px;
		font-weight: 600;
		color: var(--fg-2);
		border-radius: 4px;
		cursor: pointer;
	}
	.locale-switch button:hover { color: var(--ink); }
	.locale-switch button.active { background: var(--paper); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
	.copy-from-vi {
		margin-left: 4px;
		font-size: 11px !important;
		color: var(--fg-3) !important;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.empty-fields {
		font-size: 13px;
		color: var(--fg-3);
		font-style: italic;
		margin: 0;
		padding: 12px 0;
	}
</style>

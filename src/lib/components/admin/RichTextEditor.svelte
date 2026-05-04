<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		name: string;
		value?: string | null;
		minHeight?: string;
		placeholder?: string;
		required?: boolean;
	};
	let {
		name,
		value = $bindable(''),
		minHeight = '220px',
		placeholder = 'Start writing…',
		required = false
	}: Props = $props();

	let editor: HTMLDivElement | undefined = $state();
	let activeMarks = $state<Record<string, boolean>>({});
	let mode = $state<'wysiwyg' | 'html'>('wysiwyg');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		if (editor && (value ?? '') !== editor.innerHTML) editor.innerHTML = value ?? '';
		refreshMarks();
	});

	$effect(() => {
		if (!editor || !mounted) return;
		const v = value ?? '';
		if (v !== editor.innerHTML && document.activeElement !== editor) editor.innerHTML = v;
	});

	function syncFromEditor() {
		if (!editor) return;
		const html = editor.innerHTML;
		if (html !== (value ?? '')) value = html;
	}

	function exec(cmd: string, arg?: string) {
		if (!editor) return;
		editor.focus();
		document.execCommand(cmd, false, arg);
		syncFromEditor();
		refreshMarks();
	}

	function block(tag: string) {
		exec('formatBlock', tag);
	}

	function refreshMarks() {
		if (typeof document === 'undefined') return;
		try {
			activeMarks = {
				bold: document.queryCommandState('bold'),
				italic: document.queryCommandState('italic'),
				underline: document.queryCommandState('underline'),
				ul: document.queryCommandState('insertUnorderedList'),
				ol: document.queryCommandState('insertOrderedList')
			};
		} catch {
			activeMarks = {};
		}
	}

	function onPaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text/plain') || '';
		const cleaned = stripUnsafe(text);
		document.execCommand('insertHTML', false, cleaned);
		syncFromEditor();
	}

	function stripUnsafe(html: string): string {
		// Quick client-side cleanup of pasted markup. Final allowlist sanitisation
		// happens server-side on save.
		const tpl = document.createElement('template');
		tpl.innerHTML = html;
		tpl.content.querySelectorAll('script,style,link,meta,iframe,object,embed').forEach((n) => n.remove());
		tpl.content.querySelectorAll<HTMLElement>('*').forEach((el) => {
			for (const a of [...el.attributes]) {
				if (a.name.startsWith('on') || a.name === 'style' || a.name === 'class') {
					el.removeAttribute(a.name);
				}
				if ((a.name === 'href' || a.name === 'src') && /^\s*javascript:/i.test(a.value)) {
					el.removeAttribute(a.name);
				}
			}
		});
		return tpl.innerHTML;
	}

	function onLink() {
		const url = prompt('URL (https://… or /path)');
		if (!url) return;
		const safe = url.trim();
		if (/^\s*javascript:/i.test(safe)) return;
		exec('createLink', safe);
	}

	function onUnlink() {
		exec('unlink');
	}

	function onClear() {
		exec('removeFormat');
		block('p');
	}

	function toolbarBtn(label: string, key: string) {
		return { label, key };
	}

	const toolbar = [
		{ key: 'bold', label: 'B', title: 'Bold (Ctrl/Cmd+B)', style: 'font-weight:800', fn: () => exec('bold') },
		{ key: 'italic', label: 'I', title: 'Italic (Ctrl/Cmd+I)', style: 'font-style:italic', fn: () => exec('italic') },
		{ key: 'underline', label: 'U', title: 'Underline', style: 'text-decoration:underline', fn: () => exec('underline') }
	];

	const blocks = [
		{ key: 'p', label: 'P', title: 'Paragraph', tag: 'p' },
		{ key: 'h2', label: 'H2', title: 'Heading 2', tag: 'h2' },
		{ key: 'h3', label: 'H3', title: 'Heading 3', tag: 'h3' },
		{ key: 'blockquote', label: '“”', title: 'Quote', tag: 'blockquote' }
	];
</script>

<div class="rte" data-mode={mode}>
	<div class="rte-bar">
		{#each toolbar as t (t.key)}
			<button
				type="button"
				title={t.title}
				class="rte-btn"
				class:active={activeMarks[t.key]}
				style={t.style}
				onclick={t.fn}
				disabled={mode === 'html'}>{t.label}</button
			>
		{/each}
		<span class="rte-sep"></span>
		{#each blocks as b (b.key)}
			<button
				type="button"
				title={b.title}
				class="rte-btn"
				onclick={() => block(b.tag)}
				disabled={mode === 'html'}>{b.label}</button
			>
		{/each}
		<span class="rte-sep"></span>
		<button
			type="button"
			class="rte-btn"
			class:active={activeMarks.ul}
			title="Bullet list"
			onclick={() => exec('insertUnorderedList')}
			disabled={mode === 'html'}>• List</button
		>
		<button
			type="button"
			class="rte-btn"
			class:active={activeMarks.ol}
			title="Numbered list"
			onclick={() => exec('insertOrderedList')}
			disabled={mode === 'html'}>1. List</button
		>
		<span class="rte-sep"></span>
		<button type="button" class="rte-btn" title="Insert link" onclick={onLink} disabled={mode === 'html'}>Link</button>
		<button type="button" class="rte-btn" title="Remove link" onclick={onUnlink} disabled={mode === 'html'}>Unlink</button>
		<button type="button" class="rte-btn" title="Clear formatting" onclick={onClear} disabled={mode === 'html'}>Clear</button>
		<span class="rte-sep flex"></span>
		<button
			type="button"
			class="rte-btn"
			class:active={mode === 'html'}
			title="Edit raw HTML"
			onclick={() => (mode = mode === 'html' ? 'wysiwyg' : 'html')}>{'</>'}</button
		>
	</div>

	{#if mode === 'wysiwyg'}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={editor}
			class="rte-surface"
			style:min-height={minHeight}
			contenteditable="true"
			role="textbox"
			tabindex="0"
			aria-multiline="true"
			data-placeholder={placeholder}
			oninput={syncFromEditor}
			onblur={syncFromEditor}
			onpaste={onPaste}
			onkeyup={refreshMarks}
			onmouseup={refreshMarks}
		></div>
	{:else}
		<textarea
			class="rte-source"
			style:min-height={minHeight}
			bind:value
			spellcheck={false}
		></textarea>
	{/if}

	<textarea {name} {required} hidden tabindex="-1" aria-hidden="true" value={value ?? ''}></textarea>
</div>

<style>
	.rte {
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--paper);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
	}
	.rte:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}

	.rte-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 6px 8px;
		background: var(--bone);
		border-bottom: 1px solid var(--border);
		align-items: center;
	}
	.rte-btn {
		appearance: none;
		border: 1px solid transparent;
		background: transparent;
		padding: 4px 9px;
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--fg-2);
		border-radius: 3px;
		cursor: pointer;
		min-width: 28px;
		height: 28px;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
	}
	.rte-btn:hover:not(:disabled) {
		background: var(--paper);
		border-color: var(--border);
		color: var(--fg-1);
	}
	.rte-btn.active {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}
	.rte-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.rte-sep {
		display: inline-block;
		width: 1px;
		height: 18px;
		background: var(--border);
		margin: 0 4px;
	}
	.rte-sep.flex {
		flex: 1;
		background: transparent;
	}

	.rte-surface {
		padding: 14px 16px;
		font-family: var(--font-body);
		font-size: var(--fs-sm);
		line-height: var(--lh-normal);
		color: var(--fg-1);
		outline: none;
		overflow-y: auto;
		max-height: 600px;
	}
	.rte-surface:empty::before {
		content: attr(data-placeholder);
		color: var(--fg-4);
		pointer-events: none;
	}
	.rte-surface :global(p) {
		margin: 0 0 0.8em;
	}
	.rte-surface :global(p:last-child) {
		margin-bottom: 0;
	}
	.rte-surface :global(h2) {
		font-size: 1.4em;
		margin: 1.2em 0 0.5em;
		font-weight: 700;
	}
	.rte-surface :global(h3) {
		font-size: 1.15em;
		margin: 1em 0 0.4em;
		font-weight: 700;
	}
	.rte-surface :global(blockquote) {
		margin: 0.8em 0;
		padding: 4px 16px;
		border-left: 3px solid var(--accent);
		color: var(--fg-2);
		font-style: italic;
	}
	.rte-surface :global(ul),
	.rte-surface :global(ol) {
		padding-left: 24px;
		margin: 0.5em 0;
	}
	.rte-surface :global(a) {
		color: var(--accent);
		text-decoration: underline;
	}
	.rte-surface :global(img) {
		max-width: 100%;
		height: auto;
	}

	.rte-source {
		width: 100%;
		padding: 12px 14px;
		border: 0;
		outline: none;
		resize: vertical;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 13px;
		line-height: 1.5;
		background: var(--paper);
		color: var(--fg-1);
	}
</style>

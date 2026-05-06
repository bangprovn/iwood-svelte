<script lang="ts">
	import BlockRenderer from '$lib/components/blocks/BlockRenderer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const page = $derived(data.page);
	const locale = $derived(data.locale);
</script>

<svelte:head>
	<title>Preview — {page.titleVi}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="preview-bar">
	<div class="preview-bar-inner">
		<strong>Preview</strong>
		<span>{page.titleVi}</span>
		<span class="dot">·</span>
		<span class="muted">Live working copy — not the published version</span>
		<span class="spacer"></span>
		<form method="get" class="locale-switch">
			Locale:
			<select name="locale" onchange={(e) => { (e.currentTarget.form as HTMLFormElement).submit(); }}>
				{#each data.availableLocales as l (l)}
					<option value={l} selected={l === locale}>{l}</option>
				{/each}
			</select>
		</form>
		<a href={`/admin/pages/${page.id}/blocks`} class="back">← Back to editor</a>
	</div>
</div>

<article class="custom-page">
	{#if page.blocks.length === 0}
		<div class="empty">No active blocks on this page yet.</div>
	{/if}
	{#each page.blocks as block (block.id)}
		<BlockRenderer {block} {locale} />
	{/each}
</article>

<style>
	.preview-bar {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #1a1a1a;
		color: #fff;
		font-size: 13px;
		padding: 8px 16px;
	}
	.preview-bar-inner {
		max-width: 1280px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.preview-bar strong { color: #ffc107; letter-spacing: 0.04em; }
	.muted { opacity: 0.6; }
	.dot { opacity: 0.4; }
	.spacer { flex: 1; }
	.locale-switch select {
		background: #333;
		color: #fff;
		border: 1px solid #555;
		border-radius: 3px;
		padding: 2px 6px;
	}
	.back { color: #fff; opacity: 0.85; text-decoration: none; }
	.back:hover { opacity: 1; }
	.empty { padding: 4rem; text-align: center; color: var(--fg-3); }
	.custom-page { min-height: 50vh; }
</style>

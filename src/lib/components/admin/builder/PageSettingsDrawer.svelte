<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import type { PageDTO } from '$lib/server/cms/admin';

	type Props = {
		page: PageDTO;
		onClose: () => void;
		formError?: string | null;
		formSuccess?: boolean;
	};

	let { page, onClose, formError = null, formSuccess = false }: Props = $props();

	let typeValue = $state(untrack(() => page.type));
	let activeValue = $state(untrack(() => (page.isActive ? '1' : '0')));
	let ogImageValue = $state(untrack(() => page.ogImage ?? ''));
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="backdrop"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
></div>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<aside class="b-drawer" role="dialog" aria-modal="true" aria-label="Page settings" tabindex="-1">
	<header class="dr-head">
		<div>
			<h2>Page settings</h2>
			<p>Slug, page metadata, and SEO.</p>
		</div>
		<button type="button" class="close" onclick={onClose} aria-label="Close settings">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
			</svg>
		</button>
	</header>

	<form
		method="post"
		action="?/savePage"
		use:enhance={() => async ({ update }) => {
			await update({ reset: false });
		}}
		class="dr-body"
	>
		{#if formSuccess}
			<p class="banner success">Settings saved.</p>
		{/if}
		{#if formError}
			<p class="banner error">{formError}</p>
		{/if}

		<div class="grid-2">
			<div class="field">
				<label for="ps-titleVi">Title (Vietnamese) *</label>
				<input id="ps-titleVi" type="text" name="titleVi" value={page.titleVi} required />
			</div>
			<div class="field">
				<label for="ps-titleEn">Title (English)</label>
				<input id="ps-titleEn" type="text" name="titleEn" value={page.titleEn || ''} />
			</div>
		</div>

		<div class="field">
			<label for="ps-slug">Slug *</label>
			<input id="ps-slug" type="text" name="slug" value={page.slug} required />
		</div>

		<div class="grid-2">
			<div class="field">
				<label for="ps-type">Page type</label>
				<select id="ps-type" name="type" bind:value={typeValue}>
					<option value="custom">Custom page</option>
					<option value="override">Override existing route</option>
				</select>
			</div>
			<div class="field">
				<label for="ps-active">Status</label>
				<select id="ps-active" name="isActive" bind:value={activeValue}>
					<option value="1">Active</option>
					<option value="0">Inactive</option>
				</select>
			</div>
		</div>

		{#if typeValue === 'override'}
			<div class="field">
				<label for="ps-route">Route to override</label>
				<input id="ps-route" type="text" name="routePattern" value={page.routePattern || ''} placeholder="/about" />
			</div>
		{/if}

		<div class="field">
			<label for="ps-metaVi">Meta description (Vietnamese)</label>
			<textarea id="ps-metaVi" name="metaDescVi" rows="2">{page.metaDescVi || ''}</textarea>
		</div>
		<div class="field">
			<label for="ps-metaEn">Meta description (English)</label>
			<textarea id="ps-metaEn" name="metaDescEn" rows="2">{page.metaDescEn || ''}</textarea>
		</div>

		<fieldset class="seo">
			<legend>SEO &amp; sharing</legend>
			<div class="field">
				<ImageField name="ogImage" bind:value={ogImageValue} prefix="pages" label="OG image" />
				<span class="hint">Used for social previews (Facebook, Twitter, etc.)</span>
			</div>
			<div class="grid-2">
				<div class="field">
					<label for="ps-canonical">Canonical URL</label>
					<input id="ps-canonical" type="url" name="canonicalUrl" value={page.canonicalUrl || ''} placeholder="https://..." />
				</div>
				<div class="field">
					<label for="ps-robots">Robots</label>
					<select id="ps-robots" name="robots" value={page.robots || 'index,follow'}>
						<option value="index,follow">index, follow</option>
						<option value="noindex,follow">noindex, follow</option>
						<option value="index,nofollow">index, nofollow</option>
						<option value="noindex,nofollow">noindex, nofollow</option>
					</select>
				</div>
			</div>
		</fieldset>

		<div class="dr-actions">
			<button type="button" class="adm-btn ghost" onclick={onClose}>Close</button>
			<button type="submit" class="adm-btn primary">Save settings</button>
		</div>
	</form>
</aside>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 15, 16, 0.45);
		z-index: 80;
		animation: fade-in 120ms ease-out;
	}
	.b-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(520px, 100vw);
		background: var(--paper);
		z-index: 81;
		display: flex;
		flex-direction: column;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.18);
		animation: slide-in 180ms var(--ease-out);
	}
	.dr-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 18px 22px 14px;
		border-bottom: 1px solid var(--border);
	}
	.dr-head h2 {
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 700;
		margin: 0 0 2px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	.dr-head p { margin: 0; font-size: 12px; color: var(--fg-3); }
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

	.dr-body {
		flex: 1;
		overflow-y: auto;
		padding: 18px 22px 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
	.field { display: flex; flex-direction: column; gap: 6px; }
	label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg-2);
	}
	input[type='text'], input[type='url'], select, textarea {
		padding: 8px 10px;
		border: 1.5px solid var(--border);
		border-radius: 4px;
		font-family: var(--font-body);
		font-size: 13px;
		background: var(--paper);
		color: var(--ink);
	}
	input:focus, select:focus, textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}
	textarea { resize: vertical; min-height: 50px; font-family: var(--font-body); }

	.seo {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.seo legend {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--fg-2);
		padding: 0 6px;
	}
	.hint { font-size: 11px; color: var(--fg-3); }

	.dr-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding-top: 6px;
		border-top: 1px solid var(--border);
		margin-top: 4px;
		padding-top: 14px;
	}

	.banner {
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 13px;
		margin: 0;
	}
	.banner.success { background: #d4edda; border: 1px solid var(--success); color: var(--success); }
	.banner.error { background: #f8d7da; border: 1px solid var(--danger, #c00); color: var(--danger, #c00); }

	@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
	@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
</style>

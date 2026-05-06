<script lang="ts">
	import { getAllBlockDefinitions, type BlockDefinition } from '$lib/page-blocks/registry';
	import type { BlockType } from '$lib/page-blocks/types';
	import { BLOCK_CATEGORIES, blockIconPath } from './block-meta';

	type Props = {
		onSelect: (type: BlockType) => void;
		onClose: () => void;
	};

	let { onSelect, onClose }: Props = $props();

	const all = getAllBlockDefinitions();
	const byType = new Map<string, BlockDefinition>(all.map((d) => [d.type, d]));

	let q = $state('');

	const groups = $derived.by(() => {
		const term = q.trim().toLowerCase();
		const matches = (def: BlockDefinition) =>
			!term ||
			def.label.toLowerCase().includes(term) ||
			def.description.toLowerCase().includes(term) ||
			def.type.toLowerCase().includes(term);

		return BLOCK_CATEGORIES.map((cat) => ({
			...cat,
			defs: cat.types
				.map((t) => byType.get(t))
				.filter((d): d is BlockDefinition => !!d && matches(d))
		})).filter((g) => g.defs.length > 0);
	});

	function pick(t: BlockType) {
		onSelect(t);
		onClose();
	}
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
<aside class="b-drawer" role="dialog" aria-modal="true" aria-label="Block library" tabindex="-1">
	<header class="dr-head">
		<div>
			<h2>Add a block</h2>
			<p>Pick a building block to insert into the page.</p>
		</div>
		<button type="button" class="close" onclick={onClose} aria-label="Close library">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
			</svg>
		</button>
	</header>

	<div class="dr-search">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.65" y2="16.65" />
		</svg>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="search"
			placeholder="Search blocks…"
			bind:value={q}
			autofocus
		/>
	</div>

	<div class="dr-body">
		{#if groups.length === 0}
			<p class="no-results">No blocks match “{q}”.</p>
		{/if}
		{#each groups as g (g.key)}
			<section class="group">
				<h3>{g.label}</h3>
				<div class="grid">
					{#each g.defs as def (def.type)}
						<button type="button" class="card" onclick={() => pick(def.type)}>
							<div class="card-icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
									<path d={blockIconPath(def.type)} />
								</svg>
							</div>
							<div class="card-info">
								<strong>{def.label}</strong>
								<span>{def.description}</span>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	</div>
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
		width: min(440px, 100vw);
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
		padding: 18px 18px 14px;
		border-bottom: 1px solid var(--border);
	}
	.dr-head h2 {
		font-family: var(--font-display);
		font-size: 20px;
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

	.dr-search {
		position: relative;
		display: flex;
		align-items: center;
		padding: 12px 18px 6px;
	}
	.dr-search svg {
		position: absolute;
		left: 28px;
		color: var(--fg-3);
	}
	.dr-search input {
		flex: 1;
		padding: 8px 10px 8px 36px;
		border: 1.5px solid var(--border);
		border-radius: 6px;
		font-family: var(--font-body);
		font-size: 13px;
		background: var(--paper);
		color: var(--ink);
	}
	.dr-search input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}

	.dr-body {
		flex: 1;
		overflow-y: auto;
		padding: 12px 18px 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.group h3 {
		margin: 0 0 8px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--fg-3);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.card {
		appearance: none;
		background: var(--paper);
		border: 1.5px solid var(--border);
		border-radius: 6px;
		padding: 10px;
		text-align: left;
		cursor: pointer;
		display: flex;
		gap: 10px;
		align-items: flex-start;
		transition: all 120ms var(--ease-out);
	}
	.card:hover {
		border-color: var(--accent);
		background: var(--bone);
		transform: translateY(-1px);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
	}
	.card-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--accent);
		flex-shrink: 0;
	}
	.card:hover .card-icon { background: var(--paper); }
	.card-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.card-info strong { font-size: 13px; font-weight: 700; color: var(--ink); }
	.card-info span { font-size: 11px; color: var(--fg-3); line-height: 1.35; }

	.no-results {
		text-align: center;
		color: var(--fg-3);
		font-size: 13px;
		padding: 24px 0;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes slide-in {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}
</style>

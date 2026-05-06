<script lang="ts">
	import { getAllBlockDefinitions } from '$lib/page-blocks/registry';

	type Props = {
		onSelect: (type: string) => void;
		onClose: () => void;
	};

	let { onSelect, onClose }: Props = $props();

	const blockTypes = getAllBlockDefinitions();

	function handleSelect(type: string) {
		onSelect(type);
		onClose();
	}

	const ICON_PATHS: Record<string, string> = {
		layout: 'M3 3h18v18H3zM3 9h18M9 21V9',
		type: 'M4 7V4h16v3M9 20h6M12 4v16',
		image: 'M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
		grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
		'mouse-pointer-click': 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
		box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
		layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
		quote: 'M3 21c3 0 7-1 9-2 2 1 4 2 6 2M15 21c3 0 7-1 9-2 2 1 4 2 6 2',
		code: 'M16 18l6-6-6-6M8 6l-6 6 6 6'
	};
	function iconPath(name: string): string {
		return ICON_PATHS[name] ?? ICON_PATHS.box;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="dialog" aria-modal="true" aria-label="Block library">
	<div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="document">
		<div class="modal-header">
			<h2>Block Library</h2>
			<button type="button" class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</div>
		<div class="modal-body">
			<div class="block-grid">
				{#each blockTypes as bt (bt.type)}
					<button type="button" class="block-card" onclick={() => handleSelect(bt.type)}>
						<div class="block-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
								<path d={iconPath(bt.icon)} />
							</svg>
						</div>
						<div class="block-info">
							<strong>{bt.label}</strong>
							<span>{bt.description}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}
	.modal {
		background: var(--paper);
		border-radius: var(--radius-md);
		width: 100%;
		max-width: 680px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0,0,0,0.2);
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.modal-header h2 {
		font-family: var(--font-display);
		font-size: var(--fs-xl);
		font-weight: 700;
		margin: 0;
	}
	.close-btn {
		appearance: none;
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--fg-3);
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}
	.close-btn:hover { color: var(--ink); }
	.modal-body { padding: 1.5rem; overflow-y: auto; }
	.block-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}
	.block-card {
		appearance: none;
		background: var(--bone);
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 1rem;
		text-align: left;
		cursor: pointer;
		display: flex;
		gap: 0.75rem;
		transition: all var(--dur-base) var(--ease-out);
	}
	.block-card:hover {
		border-color: var(--accent);
		background: var(--paper);
		box-shadow: 0 2px 12px rgba(0,0,0,0.08);
		transform: translateY(-1px);
	}
	.block-icon {
		width: 40px;
		height: 40px;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--iwood-red);
		flex-shrink: 0;
	}
	.block-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.block-info strong {
		font-size: var(--fs-sm);
		font-weight: 700;
		color: var(--ink);
	}
	.block-info span {
		font-size: 12px;
		color: var(--fg-3);
		line-height: 1.3;
	}
</style>

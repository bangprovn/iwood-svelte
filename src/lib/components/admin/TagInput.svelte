<script lang="ts">
	// Simple chip input. Emits the chips as repeated form fields under `name`.
	type Props = {
		name: string;
		values?: string[];
		placeholder?: string;
		label?: string;
	};
	let { name, values = $bindable<string[]>([]), placeholder = 'Type and press Enter', label }: Props = $props();
	let draft = $state('');

	function add(s: string) {
		const v = s.trim();
		if (!v) return;
		values = [...values, v];
		draft = '';
	}
	function remove(i: number) {
		values = values.filter((_, idx) => idx !== i);
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			add(draft);
		} else if (e.key === 'Backspace' && draft === '' && values.length) {
			values = values.slice(0, -1);
		}
	}
</script>

<div class="tag-field">
	{#if label}<label class="tag-label">{label}</label>{/if}
	<div class="tag-box">
		{#each values as v, i (i)}
			<span class="chip">
				{v}
				<button type="button" aria-label="Remove" onclick={() => remove(i)}>×</button>
				<input type="hidden" {name} value={v} />
			</span>
		{/each}
		<input
			type="text"
			class="tag-input"
			bind:value={draft}
			onkeydown={onKey}
			onblur={() => add(draft)}
			{placeholder}
		/>
	</div>
</div>

<style>
	.tag-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.tag-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--fg-2);
	}
	.tag-box {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--paper);
		min-height: 44px;
	}
	.tag-input {
		flex: 1;
		min-width: 160px;
		border: none;
		outline: none;
		font: inherit;
		padding: 4px;
		background: transparent;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		padding: 3px 8px 3px 10px;
		font-size: 13px;
	}
	.chip button {
		background: none;
		border: none;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		color: var(--fg-3);
		padding: 0 2px;
	}
	.chip button:hover {
		color: var(--accent);
	}
</style>

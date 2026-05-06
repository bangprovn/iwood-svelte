<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		cols?: 1 | 2 | 3;
		children: Snippet;
	};

	let { cols = 2, children }: Props = $props();
</script>

<div class="adm-form-row" data-cols={cols}>
	{@render children()}
</div>

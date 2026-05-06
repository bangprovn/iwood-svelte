<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title?: string;
		description?: string;
		dense?: boolean;
		children: Snippet;
		aside?: Snippet;
	};

	let { title, description, dense = false, children, aside }: Props = $props();
</script>

<section class="adm-form-section" class:dense>
	{#if title || description || aside}
		<header class="adm-form-section-head">
			<div>
				{#if title}<h2>{title}</h2>{/if}
				{#if description}<p>{description}</p>{/if}
			</div>
			{#if aside}<div class="adm-form-section-aside">{@render aside()}</div>{/if}
		</header>
	{/if}
	<div class="adm-form-section-body">
		{@render children()}
	</div>
</section>

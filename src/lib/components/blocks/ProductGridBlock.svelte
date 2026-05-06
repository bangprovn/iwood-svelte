<script lang="ts">
	import type { ProductGridSettings, ProductGridContent } from '$lib/page-blocks/types';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import type { ProductDTO } from '$lib/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: ProductGridSettings;
		locale: string;
		data?: ProductDTO[];
	};

	let { content, settings, data = [] }: Props = $props();

	const c = content as unknown as ProductGridContent;
	const products = $derived(data ?? []);
</script>

<section class="product-grid-block">
	{#if c.title}
		<h2 class="section-title">{c.title}</h2>
	{/if}
	{#if products.length > 0}
		<div
			class="product-grid"
			style:grid-template-columns={`repeat(${settings.columns || 4}, 1fr)`}
			style:gap={`${settings.gapSize || 24}px`}
		>
			{#each products as p (p.id)}
				<ProductCard {p} />
			{/each}
		</div>
	{:else}
		<p class="empty">No products found.</p>
	{/if}
</section>

<style>
	.product-grid-block {
		padding: 3rem 0;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--fs-2xl);
		font-weight: 800;
		color: var(--ink);
		margin: 0 0 2rem;
		text-align: center;
	}

	.product-grid {
		display: grid;
	}

	.empty {
		text-align: center;
		color: var(--fg-3);
		padding: 2rem;
	}
</style>

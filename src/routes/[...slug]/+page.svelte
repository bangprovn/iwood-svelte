<script lang="ts">
	import type { PageData } from './$types';
	import BlockRenderer from '$lib/components/blocks/BlockRenderer.svelte';

	let { data }: { data: PageData } = $props();
	let page = $derived(data.page);
	let locale = $derived(data.locale);
</script>

<svelte:head>
	<title>{page.titleVi}</title>
	{#if page.metaDescVi}
		<meta name="description" content={page.metaDescVi} />
	{/if}
	{#if page.robots}
		<meta name="robots" content={page.robots} />
	{/if}
	{#if page.canonicalUrl}
		<link rel="canonical" href={page.canonicalUrl} />
	{/if}
	{#if page.ogImage}
		<meta property="og:image" content={page.ogImage} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	<meta property="og:title" content={page.titleVi} />
	{#if page.metaDescVi}
		<meta property="og:description" content={page.metaDescVi} />
	{/if}
</svelte:head>

<article class="custom-page">
	{#each page.blocks as block (block.id)}
		<BlockRenderer {block} {locale} />
	{/each}
</article>

<style>
	.custom-page {
		min-height: 50vh;
	}
</style>

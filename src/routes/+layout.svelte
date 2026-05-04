<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { setI18n, localizedHref, t } from '$lib/i18n';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import InquiryDrawer from '$lib/components/InquiryDrawer.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import FloatingActions from '$lib/components/FloatingActions.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const i18n = setI18n(data.i18n);
	$effect(() => {
		i18n.set(data.i18n);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t($i18n, 'layout.title')}</title>
	<meta
		name="description"
		content={t($i18n, 'layout.meta_description')}
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
</svelte:head>

<Header navCategories={data.navCategories} megaFeatured={data.megaFeatured} />
{@render children()}
<Footer navCategories={data.navCategories} />
<FloatingActions />
<InquiryDrawer />
<Lightbox />

<div style="display:none">
	{#each data.i18n.locales as locale (locale.code)}
		<a href={localizedHref(data.i18n, page.url.pathname, locale.code)}>{locale.code}</a>
	{/each}
</div>

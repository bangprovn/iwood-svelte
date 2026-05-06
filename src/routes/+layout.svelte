<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { setI18n, localizedHref, t } from '$lib/i18n';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import InquiryDrawer from '$lib/components/InquiryDrawer.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import FloatingActions from '$lib/components/FloatingActions.svelte';
	import BlockRenderer from '$lib/components/blocks/BlockRenderer.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const i18n = setI18n(data.i18n);
	$effect(() => {
		i18n.set(data.i18n);
	});

	const override = $derived(data.pageOverride);
	const overrideTitle = $derived(
		override ? ($i18n.locale === 'en' && override.titleEn ? override.titleEn : override.titleVi) : null
	);
	const overrideDesc = $derived(
		override ? ($i18n.locale === 'en' && override.metaDescEn ? override.metaDescEn : override.metaDescVi) : null
	);

	const settings = $derived(data.site?.settings ?? {});
	const siteName = $derived(String(settings['system.site_name'] ?? ''));
	const defaultMetaTitle = $derived(String(settings['seo.default_meta_title'] ?? ''));
	const defaultMetaDesc = $derived(String(settings['seo.default_meta_description'] ?? ''));
	const defaultOgImage = $derived(String(settings['seo.default_og_image'] ?? ''));
	const robotsDefault = $derived(String(settings['seo.robots_default'] ?? 'index,follow'));
	const customFavicon = $derived(String(settings['appearance.favicon'] ?? ''));
	const gtmId = $derived(String(settings['integrations.gtm_id'] ?? '').trim());
	const ga4Id = $derived(String(settings['integrations.ga4_id'] ?? '').trim());
	const metaPixelId = $derived(String(settings['integrations.meta_pixel_id'] ?? '').trim());

	const baseTitle = $derived(t($i18n, 'layout.title'));
	const baseDesc = $derived(t($i18n, 'layout.meta_description'));
	const titleText = $derived(
		overrideTitle ?? (defaultMetaTitle || (siteName ? `${siteName} — ${baseTitle}` : baseTitle))
	);
	const descText = $derived(overrideDesc ?? defaultMetaDesc ?? baseDesc);
	const ogImage = $derived(override?.ogImage || defaultOgImage || '');

	// Admin routes get their own shell (header / footer / drawers all live there).
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	{#if data.site?.cssVars && !isAdmin}
		{@html `<style id="site-tokens">${data.site.cssVars}</style>`}
	{/if}
	<link rel="icon" href={customFavicon || favicon} />
	<title>{titleText}</title>
	<meta name="description" content={descText} />
	<meta name="robots" content={override?.robots ?? robotsDefault} />
	{#if override?.canonicalUrl}
		<link rel="canonical" href={override.canonicalUrl} />
	{/if}
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	<meta property="og:title" content={titleText} />
	<meta property="og:description" content={descText} />
	{#if siteName}
		<meta property="og:site_name" content={siteName} />
	{/if}
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	{#if data.site?.fontsHref}
		<link rel="stylesheet" href={data.site.fontsHref} />
	{/if}
	{#if gtmId}
		{@html `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`}
	{:else if ga4Id}
		<script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}></script>
		{@html `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');</script>`}
	{/if}
	{#if metaPixelId}
		{@html `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');</script>`}
	{/if}
</svelte:head>

{#if isAdmin}
	{@render children()}
{:else}
	<Header
		navCategories={data.navCategories}
		megaFeatured={data.megaFeatured}
		primaryNav={data.primaryNav}
		user={data.user}
	/>
	{#if override?.blocks?.length}
		<main>
			{#each override.blocks as block (block.id)}
				<BlockRenderer {block} locale={$i18n.locale} />
			{/each}
		</main>
	{:else}
		{@render children()}
	{/if}
	<Footer navCategories={data.navCategories} />
	<FloatingActions />
	<InquiryDrawer />
	<Lightbox />

	<div style="display:none">
		{#each data.i18n.locales as locale (locale.code)}
			<a href={localizedHref(data.i18n, page.url.pathname, locale.code)}>{locale.code}</a>
		{/each}
	</div>
{/if}

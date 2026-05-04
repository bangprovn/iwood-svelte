<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import MegaMenu from './MegaMenu.svelte';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { useI18n, t, localizedHref } from '$lib/i18n';
	import type { CategoryDTO, ProductDTO } from '$lib/types';

	const i18n = useI18n();
	const PHONE = '0915 000 000';

	type Props = {
		dark?: boolean;
		navCategories: CategoryDTO[];
		megaFeatured: ProductDTO[];
	};
	let { dark = false, navCategories, megaFeatured }: Props = $props();

	let scrolled = $state(false);
	let megaOpen = $state(false);
	let mobileNavOpen = $state(false);
	let langOpen = $state(false);

	$effect(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 8;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	$effect(() => {
		if (mobileNavOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	const path = $derived(page.url.pathname);
	$effect(() => {
		// close mobile nav on route change
		path;
		mobileNavOpen = false;
		langOpen = false;
	});
	const isActive = (target: string) =>
		path === target || (target !== '/' && path.startsWith(target));

	const inquiryCount = $derived(inquiry.lineCount);

	function toggleLang() {
		langOpen = !langOpen;
	}
</script>

<div class="topbar">
	<div class="topbar-inner">
		<div class="topbar-left">
			<span class="topbar-cert">ISO 9001 · Quatest 3</span>
			<span style="opacity: 0.6;">{t($i18n, 'topbar.warranty')}</span>
		</div>
		<div class="topbar-right">
			<a href="/contact">
				<Icon
					name="map"
					size={12}
					style="display:inline; margin-right:4px; vertical-align:middle;"
				/>
				{t($i18n, 'topbar.showrooms')}
			</a>
			<span style="opacity: 0.4;">·</span>
			<div style="position: relative; display: inline-block;">
				<button
					onclick={toggleLang}
					style="background: none; border: none; cursor: pointer; font: inherit; color: inherit; padding: 0;"
				>
					<Icon
						name="globe"
						size={12}
						style="display:inline; margin-right:4px; vertical-align:middle;"
					/> {$i18n.locale.toUpperCase()}
				</button>
				{#if langOpen}
					<div
						style="position: absolute; right: 0; top: 100%; background: white; border: 1px solid var(--hairline); border-radius: 6px; box-shadow: var(--shadow-2); z-index: 100; min-width: 120px; overflow: hidden;"
					>
						{#each $i18n.locales as loc (loc.code)}
							<a
								href={localizedHref($i18n, path, loc.code)}
								style="display: block; padding: 10px 16px; font-size: 13px; font-weight: {$i18n.locale === loc.code ? '700' : '400'}; color: {$i18n.locale === loc.code ? 'var(--tw-red)' : 'var(--ink)'}; text-decoration: none; background: {$i18n.locale === loc.code ? 'var(--bone)' : 'white'};"
								onclick={() => (langOpen = false)}
							>
								{loc.label}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
<header class={'site-header ' + (dark ? 'is-dark ' : '') + (scrolled ? 'is-scrolled' : '')}>
	<div class="header-row" style="position: relative;">
		<Logo light={dark} />
		<nav class="nav">
			<a class={'nav-link ' + (path === '/' ? 'active' : '')} href="/">{t($i18n, 'nav.home')}</a>
			<a class={'nav-link ' + (isActive('/about') ? 'active' : '')} href="/about"
				>{t($i18n, 'nav.about')}</a
			>
			<a
				class={'nav-link ' + (isActive('/products') || isActive('/product') ? 'active' : '')}
				href="/products"
				onmouseenter={() => (megaOpen = true)}
				aria-expanded={megaOpen}
			>
				{t($i18n, 'nav.products')} <Icon name="chev" size={14} class="chev" />
			</a>
			<a class={'nav-link ' + (isActive('/projects') ? 'active' : '')} href="/projects"
				>{t($i18n, 'nav.projects')}</a
			>
			<a class={'nav-link ' + (isActive('/news') ? 'active' : '')} href="/news"
				>{t($i18n, 'nav.news')}</a
			>
			<a class={'nav-link ' + (isActive('/contact') ? 'active' : '')} href="/contact"
				>{t($i18n, 'nav.contact')}</a
			>
		</nav>
		<div class="header-cta">
			<button class="icon-btn search-btn" aria-label={t($i18n, 'header.search')}>
				<Icon name="search" size={20} />
			</button>
			<button
				class="icon-btn"
				aria-label={t($i18n, 'header.inquiry_list')}
				onclick={() => inquiry.open()}
			>
				<Icon name="bag" size={20} />
				{#if inquiryCount > 0}
					<span class="badge-dot">{inquiryCount}</span>
				{/if}
			</button>
			<a href="tel:0915000000" class="phone-pill" aria-label={t($i18n, 'header.call_aria', { phone: PHONE })}>
				<Icon name="phone" size={16} />
				<span class="phone-pill-num">{PHONE}</span>
			</a>
			<button
				class="icon-btn nav-toggle"
				aria-label={t($i18n, mobileNavOpen ? 'header.menu_close' : 'header.menu_open')}
				aria-expanded={mobileNavOpen}
				onclick={() => (mobileNavOpen = !mobileNavOpen)}
			>
				<Icon name={mobileNavOpen ? 'close' : 'menu'} size={22} />
			</button>
		</div>
		<MegaMenu
			open={megaOpen}
			onClose={() => (megaOpen = false)}
			categories={navCategories}
			featured={megaFeatured}
		/>
	</div>

	{#if mobileNavOpen}
		<div class="mobile-nav">
			<a class={'mobile-nav-link ' + (path === '/' ? 'active' : '')} href="/"
				>{t($i18n, 'nav.home')}</a
			>
			<a class={'mobile-nav-link ' + (isActive('/about') ? 'active' : '')} href="/about">
				{t($i18n, 'nav.about')}
			</a>
			<a
				class={'mobile-nav-link ' +
					(isActive('/products') || isActive('/product') ? 'active' : '')}
				href="/products"
			>
				{t($i18n, 'nav.products')}
			</a>
			<a class={'mobile-nav-link ' + (isActive('/projects') ? 'active' : '')} href="/projects">
				{t($i18n, 'nav.projects')}
			</a>
			<a class={'mobile-nav-link ' + (isActive('/news') ? 'active' : '')} href="/news"
				>{t($i18n, 'nav.news')}</a
			>
			<a class={'mobile-nav-link ' + (isActive('/contact') ? 'active' : '')} href="/contact">
				{t($i18n, 'nav.contact')}
			</a>
			<a href="/quote" class="btn btn-primary" style="margin-top: 12px; justify-content: center;">
				{t($i18n, 'cta.request_quote')}
			</a>
		</div>
	{/if}
</header>

<style>
	.nav-toggle {
		display: none;
	}
	.search-btn {
		display: inline-flex;
	}
	@media (max-width: 900px) {
		.nav-toggle {
			display: inline-flex;
		}
		.search-btn {
			display: none;
		}
	}
	.mobile-nav {
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		background: var(--paper);
		border-top: 1px solid var(--hairline);
		box-shadow: var(--shadow-3);
		padding: 12px 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-height: calc(100vh - 80px);
		overflow-y: auto;
		z-index: 70;
	}
	:global(.site-header.is-dark) .mobile-nav {
		background: var(--ink);
		color: var(--paper);
		border-top-color: rgba(255, 255, 255, 0.08);
	}
	.mobile-nav-link {
		padding: 14px 12px;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		border-bottom: 1px solid var(--hairline);
	}
	:global(.site-header.is-dark) .mobile-nav-link {
		border-bottom-color: rgba(255, 255, 255, 0.08);
		color: var(--paper);
	}
	.mobile-nav-link.active {
		color: var(--tw-red);
	}
</style>

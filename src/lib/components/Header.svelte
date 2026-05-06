<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import MegaMenu from './MegaMenu.svelte';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { useI18n, t, localizedHref } from '$lib/i18n';
	import type { CategoryDTO, ProductDTO } from '$lib/types';
	import type { ResolvedNavItem } from '$lib/server/cms/admin';

	const i18n = useI18n();
	const PHONE = '0915 000 000';

	type AuthUser = { id: string; name: string; email: string; role: string };
	type Props = {
		dark?: boolean;
		navCategories: CategoryDTO[];
		megaFeatured: ProductDTO[];
		primaryNav?: ResolvedNavItem[];
		user?: AuthUser | null;
	};
	let {
		dark = false,
		navCategories,
		megaFeatured,
		primaryNav = [],
		user = null
	}: Props = $props();

	let scrolled = $state(false);
	let megaOpenId = $state<string | null>(null);
	let mobileNavOpen = $state(false);
	let langOpen = $state(false);
	let acctOpen = $state(false);

	// Fallback links shown when no menu has been configured yet.
	const fallbackNav: ResolvedNavItem[] = [
		{ id: 'home', href: '/', label: t($i18n, 'nav.home'), target: '_self', kind: 'route', children: [], isMega: false },
		{ id: 'about', href: '/about', label: t($i18n, 'nav.about'), target: '_self', kind: 'route', children: [], isMega: false },
		{ id: 'products', href: '/products', label: t($i18n, 'nav.products'), target: '_self', kind: 'route', children: [], isMega: false },
		{ id: 'projects', href: '/projects', label: t($i18n, 'nav.projects'), target: '_self', kind: 'route', children: [], isMega: false },
		{ id: 'news', href: '/news', label: t($i18n, 'nav.news'), target: '_self', kind: 'route', children: [], isMega: false },
		{ id: 'contact', href: '/contact', label: t($i18n, 'nav.contact'), target: '_self', kind: 'route', children: [], isMega: false }
	];
	const navItems = $derived(primaryNav.length > 0 ? primaryNav : fallbackNav);

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
		acctOpen = false;
		megaOpenId = null;
	});

	$effect(() => {
		if (!acctOpen) return;
		const onDocClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.acct')) acctOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') acctOpen = false;
		};
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	});
	const isActive = (target: string) => {
		if (!target) return false;
		const clean = target.split('?')[0].split('#')[0];
		if (clean === '/') return path === '/';
		return path === clean || path.startsWith(clean + '/');
	};

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
			{#if user}
				<div class="acct" style="position: relative; display: inline-block;">
					<button
						type="button"
						onclick={() => (acctOpen = !acctOpen)}
						aria-haspopup="menu"
						aria-expanded={acctOpen}
						style="background: none; border: none; cursor: pointer; font: inherit; color: inherit; padding: 0;"
					>
						<Icon
							name="user"
							size={12}
							style="display:inline; margin-right:4px; vertical-align:middle;"
						/>
						{user.name?.split(' ')[0] || user.email.split('@')[0]}
					</button>
					{#if acctOpen}
						<div class="acct-menu" role="menu">
							<a href="/account" role="menuitem" onclick={() => (acctOpen = false)}>
								{t($i18n, 'auth.account')}
							</a>
							{#if user.role === 'admin'}
								<a href="/admin" role="menuitem" onclick={() => (acctOpen = false)}>Admin</a>
							{/if}
							<form method="post" action="/login?/signOut" style="margin:0">
								<button type="submit" role="menuitem">{t($i18n, 'auth.sign_out')}</button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login">
					<Icon
						name="user"
						size={12}
						style="display:inline; margin-right:4px; vertical-align:middle;"
					/>
					{t($i18n, 'auth.sign_in')}
				</a>
				<span style="opacity: 0.4;">·</span>
				<a href="/register">{t($i18n, 'auth.register')}</a>
			{/if}
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
			{#each navItems as item (item.id)}
				{#if item.isMega || item.children.length > 0}
					<a
						class={'nav-link ' + (isActive(item.href) ? 'active' : '')}
						href={item.href || '#'}
						target={item.target}
						rel={item.target === '_blank' ? 'noopener' : undefined}
						onmouseenter={() => (megaOpenId = item.id)}
						aria-expanded={megaOpenId === item.id}
					>
						{item.label} <Icon name="chev" size={14} class="chev" />
					</a>
				{:else}
					<a
						class={'nav-link ' + (isActive(item.href) ? 'active' : '')}
						href={item.href || '#'}
						target={item.target}
						rel={item.target === '_blank' ? 'noopener' : undefined}
					>
						{item.label}
					</a>
				{/if}
			{/each}
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
		{#each navItems as item (item.id)}
			{#if item.isMega || item.children.length > 0}
				<MegaMenu
					open={megaOpenId === item.id}
					onClose={() => (megaOpenId = null)}
					{item}
					fallbackCategories={navCategories}
					fallbackFeatured={megaFeatured}
				/>
			{/if}
		{/each}
	</div>

	{#if mobileNavOpen}
		<div class="mobile-nav">
			{#each navItems as item (item.id)}
				<a
					class={'mobile-nav-link ' + (isActive(item.href) ? 'active' : '')}
					href={item.href || '#'}
					target={item.target}
					rel={item.target === '_blank' ? 'noopener' : undefined}
				>
					{item.label}
				</a>
				{#if item.isMega && item.mega}
					{#each item.mega.columns as col, ci (ci)}
						{#each col.links as link (link.id)}
							<a class="mobile-nav-sub" href={link.href || '#'} target={link.target}>
								— {link.label}
							</a>
						{/each}
					{/each}
				{:else if item.children.length > 0}
					{#each item.children as child (child.id)}
						<a class="mobile-nav-sub" href={child.href || '#'} target={child.target}>
							— {child.label}
						</a>
					{/each}
				{/if}
			{/each}
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
	.mobile-nav-sub {
		padding: 10px 12px 10px 28px;
		font-size: 13px;
		color: var(--slate-2);
		border-bottom: 1px dashed var(--hairline);
	}
	:global(.site-header.is-dark) .mobile-nav-sub {
		color: rgba(255, 255, 255, 0.65);
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}
	.acct-menu {
		position: absolute;
		right: 0;
		top: 100%;
		margin-top: 4px;
		background: white;
		border: 1px solid var(--hairline);
		border-radius: 6px;
		box-shadow: var(--shadow-2);
		z-index: 100;
		min-width: 160px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.acct-menu a,
	.acct-menu button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 10px 14px;
		font: inherit;
		font-size: 13px;
		color: var(--ink);
		background: white;
		border: none;
		cursor: pointer;
		text-decoration: none;
	}
	.acct-menu a:hover,
	.acct-menu button:hover {
		background: var(--bone);
	}
</style>

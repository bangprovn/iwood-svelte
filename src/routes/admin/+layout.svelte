<script lang="ts">
	import './admin.css';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const i18n = useI18n();

	const path = $derived(page.url.pathname);
	const isLogin = $derived(path.startsWith('/admin/login'));
	const isPreview = $derived(/^\/admin\/pages\/[^/]+\/preview/.test(path));
	const isChromeless = $derived(isLogin || isPreview);

	const sections = $derived([
		{
			group: t($i18n, 'admin.nav.group.overview'),
			items: [{ href: '/admin', label: t($i18n, 'admin.nav.dashboard'), icon: 'grid' }]
		},
		{
			group: t($i18n, 'admin.nav.group.catalog'),
			items: [
				{ href: '/admin/categories', label: t($i18n, 'admin.nav.categories'), icon: 'layers' },
				{ href: '/admin/products', label: t($i18n, 'admin.nav.products'), icon: 'box' }
			]
		},
		{
			group: t($i18n, 'admin.nav.group.content'),
			items: [
				{ href: '/admin/pages', label: t($i18n, 'admin.nav.pages'), icon: 'layout' },
				{
					href: '/admin/project-categories',
					label: t($i18n, 'admin.nav.project_categories'),
					icon: 'tag'
				},
				{ href: '/admin/projects', label: t($i18n, 'admin.nav.projects'), icon: 'home' },
				{ href: '/admin/posts', label: t($i18n, 'admin.nav.posts'), icon: 'list' },
				{ href: '/admin/showrooms', label: t($i18n, 'admin.nav.showrooms'), icon: 'map' }
			]
		},
		{
			group: t($i18n, 'admin.nav.group.leads'),
			items: [
				{ href: '/admin/quotes', label: t($i18n, 'admin.nav.quotes'), icon: 'quote' },
				{ href: '/admin/contacts', label: t($i18n, 'admin.nav.contacts'), icon: 'chat' },
				{ href: '/admin/newsletter', label: t($i18n, 'admin.nav.newsletter'), icon: 'mail' }
			]
		},
		{
			group: t($i18n, 'admin.nav.group.access'),
			items: [{ href: '/admin/users', label: t($i18n, 'admin.nav.users'), icon: 'user' }]
		},
		{
			group: t($i18n, 'admin.nav.group.localization'),
			items: [
				{ href: '/admin/locales', label: t($i18n, 'admin.nav.locales'), icon: 'globe' },
				{ href: '/admin/translations', label: t($i18n, 'admin.nav.translations'), icon: 'list' }
			]
		},
		{
			group: t($i18n, 'admin.nav.group.settings'),
			items: [
				{ href: '/admin/menus', label: t($i18n, 'admin.nav.menus'), icon: 'list' },
				{ href: '/admin/settings', label: t($i18n, 'admin.nav.settings'), icon: 'sliders' }
			]
		}
	]);

	function isActive(href: string) {
		if (href === '/admin') return path === '/admin';
		return path === href || path.startsWith(href + '/');
	}

	// --- live site status ----------------------------------------------------
	type Status = 'checking' | 'live' | 'down';
	let status = $state<Status>('checking');
	let latencyMs = $state<number | null>(null);
	let lastCheck = $state<Date | null>(null);

	async function pingHealth() {
		const started = performance.now();
		try {
			const res = await fetch('/api/health', { cache: 'no-store' });
			if (!res.ok) throw new Error('non-2xx');
			latencyMs = Math.round(performance.now() - started);
			status = 'live';
		} catch {
			latencyMs = null;
			status = 'down';
		} finally {
			lastCheck = new Date();
		}
	}

	$effect(() => {
		if (isChromeless) return;
		pingHealth();
		const id = window.setInterval(pingHealth, 30_000);
		return () => window.clearInterval(id);
	});

	const statusLabel = $derived(
		status === 'live'
			? t($i18n, 'admin.topbar.status_live')
			: status === 'down'
				? t($i18n, 'admin.topbar.status_down')
				: t($i18n, 'admin.topbar.status_checking')
	);

	// --- user menu ----------------------------------------------------------
	let userMenuOpen = $state(false);
	let userMenuEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!userMenuOpen) return;
		const onDocClick = (e: MouseEvent) => {
			if (userMenuEl && !userMenuEl.contains(e.target as Node)) userMenuOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') userMenuOpen = false;
		};
		document.addEventListener('mousedown', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	});

	$effect(() => {
		// close on route change
		path;
		userMenuOpen = false;
	});
</script>

<svelte:head>
	<title>iWood Admin</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if isChromeless}
	{@render children()}
{:else}
	<div class="adm-shell">
		<header class="adm-topbar" class:status-down={status === 'down'}>
			<div class="tb-left">
				<a href="/admin" class="tb-brand" aria-label="iWood Admin">
					<span class="tb-mark"><span class="i">i</span>Wood</span>
				</a>
				<span class="tb-divider" aria-hidden="true"></span>
				<a
					class="tb-site"
					href="/"
					target="_blank"
					rel="noopener"
					title={t($i18n, 'admin.topbar.visit_site')}
				>
					<span class="tb-status-dot status-{status}" aria-hidden="true"></span>
					<span class="tb-site-status">{statusLabel}</span>
					<span class="tb-site-sep" aria-hidden="true">·</span>
					<span class="tb-site-cta">
						<Icon name="globe" size={14} stroke={1.75} />
						{t($i18n, 'admin.topbar.visit_site')}
					</span>
					{#if status === 'live' && latencyMs !== null}
						<span class="tb-latency">{latencyMs}ms</span>
					{/if}
				</a>
			</div>

			<div class="tb-right">
				<form method="post" action="/admin/api/locale" class="tb-locale">
					<input type="hidden" name="next" value={page.url.pathname + page.url.search} />
					<label class="vh" for="tb-locale-select">{t($i18n, 'admin.locale.switch_label')}</label>
					<select
						id="tb-locale-select"
						name="code"
						onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
					>
						{#each $i18n.locales as locale (locale.code)}
							<option value={locale.code} selected={locale.code === $i18n.locale}
								>{locale.label}</option
							>
						{/each}
					</select>
				</form>

				{#if data.user}
					<div class="tb-user" bind:this={userMenuEl}>
						<button
							type="button"
							class="tb-user-btn"
							aria-haspopup="menu"
							aria-expanded={userMenuOpen}
							onclick={() => (userMenuOpen = !userMenuOpen)}
						>
							<span class="tb-avatar" aria-hidden="true">
								{(data.user.name || data.user.email || '?').slice(0, 1).toUpperCase()}
							</span>
							<span class="tb-howdy">
								{t($i18n, 'admin.topbar.howdy')},
								<strong>{data.user.name || data.user.email.split('@')[0]}</strong>
							</span>
							<Icon name="chev" size={14} stroke={1.75} />
						</button>
						{#if userMenuOpen}
							<div class="tb-user-menu" role="menu">
								<div class="tb-user-meta">
									<div class="tb-user-name">{data.user.name || data.user.email}</div>
									<div class="tb-user-email">{data.user.email}</div>
								</div>
								<form method="post" action="/admin/login?/signOut">
									<button type="submit" class="tb-user-signout" role="menuitem">
										<Icon name="close" size={14} stroke={1.75} />
										{t($i18n, 'admin.sign_out')}
									</button>
								</form>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</header>

		<aside class="adm-side">
			<div class="brand">
				<span class="mark"><span class="i">i</span>Wood</span>
				<small>{t($i18n, 'admin.brand.subtitle')}</small>
			</div>
			<nav class="adm-nav">
				{#each sections as section (section.group)}
					<div class="group">{section.group}</div>
					{#each section.items as item (item.href)}
						<a href={item.href} class:active={isActive(item.href)}>
							<Icon name={item.icon} size={16} stroke={1.75} />
							<span>{item.label}</span>
						</a>
					{/each}
				{/each}
			</nav>
		</aside>
		<main class="adm-main">
			{@render children()}
		</main>
	</div>
{/if}

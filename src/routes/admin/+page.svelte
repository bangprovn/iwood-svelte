<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const i18n = useI18n();

	const stats = $derived(
		[
			{ key: 'categories', labelKey: 'admin.nav.categories', href: '/admin/categories', icon: 'layers' },
			{ key: 'products', labelKey: 'admin.nav.products', href: '/admin/products', icon: 'box' },
			{
				key: 'projectCategories',
				labelKey: 'admin.nav.project_categories',
				href: '/admin/project-categories',
				icon: 'tag'
			},
			{ key: 'projects', labelKey: 'admin.nav.projects', href: '/admin/projects', icon: 'home' },
			{ key: 'posts', labelKey: 'admin.nav.posts', href: '/admin/posts', icon: 'list' },
			{ key: 'showrooms', labelKey: 'admin.nav.showrooms', href: '/admin/showrooms', icon: 'map' },
			{ key: 'quotes', labelKey: 'admin.nav.quotes', href: '/admin/quotes', icon: 'quote' },
			{ key: 'contacts', labelKey: 'admin.nav.contacts', href: '/admin/contacts', icon: 'chat' },
			{ key: 'newsletter', labelKey: 'admin.nav.newsletter', href: '/admin/newsletter', icon: 'mail' }
		] as const
	);

	function fmtDate(time: Date | string) {
		const d = typeof time === 'string' ? new Date(time) : time;
		return d.toLocaleString($i18n.locale);
	}
</script>

<header class="adm-header">
	<div>
		<h1>{t($i18n, 'admin.dashboard.title')}</h1>
		<p>{t($i18n, 'admin.dashboard.sub')}</p>
	</div>
</header>

<div class="adm-grid" style="margin-bottom: 28px">
	{#each stats as s (s.key)}
		<a href={s.href} class="stat" style="display:block; color:inherit">
			<div class="lbl">
				<Icon name={s.icon} size={14} stroke={1.75} />
				<span>{t($i18n, s.labelKey)}</span>
			</div>
			<div class="num">{data.counts[s.key]}</div>
			<span style="color: var(--accent); font-size: var(--fs-xxs); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">
				{t($i18n, 'admin.dashboard.manage')}
			</span>
		</a>
	{/each}
</div>

<div style="display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr))">
	<section class="adm-card">
		<h2>{t($i18n, 'admin.dashboard.recent_quotes')}</h2>
		{#if data.recentQuotes.length === 0}
			<p style="color: var(--fg-3); font-size: var(--fs-sm); margin:0">
				{t($i18n, 'admin.dashboard.no_quotes')}
			</p>
		{:else}
			<table class="adm-table">
				<thead>
					<tr>
						<th>{t($i18n, 'admin.dashboard.col_when')}</th>
						<th>{t($i18n, 'admin.dashboard.col_name')}</th>
						<th>{t($i18n, 'admin.dashboard.col_phone')}</th>
						<th>{t($i18n, 'admin.dashboard.col_status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentQuotes as q (q.id)}
						<tr>
							<td>{fmtDate(q.createdAt)}</td>
							<td><strong>{q.name}</strong></td>
							<td>{q.phone}</td>
							<td><span class="pill {q.status}">{q.status}</span></td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p style="margin: 14px 0 0">
				<a href="/admin/quotes" class="adm-btn ghost sm">{t($i18n, 'admin.dashboard.all_quotes')}</a>
			</p>
		{/if}
	</section>

	<section class="adm-card">
		<h2>{t($i18n, 'admin.dashboard.recent_contacts')}</h2>
		{#if data.recentContacts.length === 0}
			<p style="color: var(--fg-3); font-size: var(--fs-sm); margin:0">
				{t($i18n, 'admin.dashboard.no_contacts')}
			</p>
		{:else}
			<table class="adm-table">
				<thead>
					<tr>
						<th>{t($i18n, 'admin.dashboard.col_when')}</th>
						<th>{t($i18n, 'admin.dashboard.col_name')}</th>
						<th>{t($i18n, 'admin.dashboard.col_subject')}</th>
						<th>{t($i18n, 'admin.dashboard.col_status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentContacts as c (c.id)}
						<tr>
							<td>{fmtDate(c.createdAt)}</td>
							<td><strong>{c.name}</strong></td>
							<td>{c.subject}</td>
							<td><span class="pill {c.status}">{c.status}</span></td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p style="margin: 14px 0 0">
				<a href="/admin/contacts" class="adm-btn ghost sm"
					>{t($i18n, 'admin.dashboard.all_contacts')}</a
				>
			</p>
		{/if}
	</section>
</div>

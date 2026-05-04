<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const stats = [
		{ key: 'categories', label: 'Categories', href: '/admin/categories', icon: 'layers' },
		{ key: 'products', label: 'Products', href: '/admin/products', icon: 'box' },
		{
			key: 'projectCategories',
			label: 'Project categories',
			href: '/admin/project-categories',
			icon: 'tag'
		},
		{ key: 'projects', label: 'Projects', href: '/admin/projects', icon: 'home' },
		{ key: 'posts', label: 'Posts', href: '/admin/posts', icon: 'list' },
		{ key: 'showrooms', label: 'Showrooms', href: '/admin/showrooms', icon: 'map' },
		{ key: 'quotes', label: 'Quotes', href: '/admin/quotes', icon: 'quote' },
		{ key: 'contacts', label: 'Contact messages', href: '/admin/contacts', icon: 'chat' },
		{ key: 'newsletter', label: 'Newsletter', href: '/admin/newsletter', icon: 'mail' }
	] as const;

	function fmtDate(t: Date | string) {
		const d = typeof t === 'string' ? new Date(t) : t;
		return d.toLocaleString();
	}
</script>

<header class="adm-header">
	<div>
		<h1>Dashboard</h1>
		<p>At-a-glance counts and the latest leads.</p>
	</div>
</header>

<div class="adm-grid" style="margin-bottom: 28px">
	{#each stats as s (s.key)}
		<a href={s.href} class="stat" style="display:block; color:inherit">
			<div class="lbl">
				<Icon name={s.icon} size={14} stroke={1.75} />
				<span>{s.label}</span>
			</div>
			<div class="num">{data.counts[s.key]}</div>
			<span style="color: var(--accent); font-size: var(--fs-xxs); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">
				Manage →
			</span>
		</a>
	{/each}
</div>

<div style="display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr))">
	<section class="adm-card">
		<h2>Recent quotes</h2>
		{#if data.recentQuotes.length === 0}
			<p style="color: var(--fg-3); font-size: var(--fs-sm); margin:0">No quotes yet.</p>
		{:else}
			<table class="adm-table">
				<thead>
					<tr><th>When</th><th>Name</th><th>Phone</th><th>Status</th></tr>
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
				<a href="/admin/quotes" class="adm-btn ghost sm">All quotes →</a>
			</p>
		{/if}
	</section>

	<section class="adm-card">
		<h2>Recent contact messages</h2>
		{#if data.recentContacts.length === 0}
			<p style="color: var(--fg-3); font-size: var(--fs-sm); margin:0">No messages yet.</p>
		{:else}
			<table class="adm-table">
				<thead>
					<tr><th>When</th><th>Name</th><th>Subject</th><th>Status</th></tr>
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
				<a href="/admin/contacts" class="adm-btn ghost sm">All messages →</a>
			</p>
		{/if}
	</section>
</div>

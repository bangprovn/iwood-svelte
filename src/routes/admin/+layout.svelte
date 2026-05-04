<script lang="ts">
	import './admin.css';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const path = $derived(page.url.pathname);
	const isLogin = $derived(path.startsWith('/admin/login'));

	const sections = [
		{
			group: 'Overview',
			items: [{ href: '/admin', label: 'Dashboard', icon: 'grid' }]
		},
		{
			group: 'Catalog',
			items: [
				{ href: '/admin/categories', label: 'Categories', icon: 'layers' },
				{ href: '/admin/products', label: 'Products', icon: 'box' }
			]
		},
		{
			group: 'Content',
			items: [
				{ href: '/admin/project-categories', label: 'Project categories', icon: 'tag' },
				{ href: '/admin/projects', label: 'Projects', icon: 'home' },
				{ href: '/admin/posts', label: 'Posts', icon: 'list' },
				{ href: '/admin/showrooms', label: 'Showrooms', icon: 'map' }
			]
		},
		{
			group: 'Leads',
			items: [
				{ href: '/admin/quotes', label: 'Quotes', icon: 'quote' },
				{ href: '/admin/contacts', label: 'Contact messages', icon: 'chat' },
				{ href: '/admin/newsletter', label: 'Newsletter', icon: 'mail' }
			]
		},
		{
			group: 'Access',
			items: [{ href: '/admin/users', label: 'Users', icon: 'user' }]
		},
		{
			group: 'Localization',
			items: [
				{ href: '/admin/locales', label: 'Locales', icon: 'globe' },
				{ href: '/admin/translations', label: 'Translations', icon: 'list' }
			]
		}
	];

	function isActive(href: string) {
		if (href === '/admin') return path === '/admin';
		return path === href || path.startsWith(href + '/');
	}
</script>

<svelte:head>
	<title>iWood Admin</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if isLogin}
	{@render children()}
{:else}
	<div class="adm-shell">
		<aside class="adm-side">
			<div class="brand">
				<span class="mark"><span class="i">i</span>Wood</span>
				<small>Admin console</small>
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
			<div class="me">
				{#if data.user}
					Signed in as
					<strong>{data.user.email}</strong>
					<form method="post" action="/admin/login?/signOut">
						<button type="submit" class="signout">Sign out</button>
					</form>
				{/if}
			</div>
		</aside>
		<main class="adm-main">
			{@render children()}
		</main>
	</div>
{/if}

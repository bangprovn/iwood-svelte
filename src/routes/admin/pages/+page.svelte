<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Pages</h1>
		<p>Custom page layouts with drag-and-drop block builder.</p>
	</div>
	<a href="/admin/pages/new" class="adm-btn primary">+ New page</a>
</header>

{#if form?.success}
	<p class="adm-success">Action completed successfully.</p>
{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Title (vi / en)</th>
			<th>Slug</th>
			<th>Type</th>
			<th>Active</th>
			<th>Blocks</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.pages as p (p.id)}
			<tr>
				<td>
					<strong>{p.titleVi}</strong><br />
					<span style="color: var(--fg-3); font-size:12px">{p.titleEn}</span>
				</td>
				<td><code style="font-size:12px">/{p.slug}</code></td>
				<td>
					<span class="badge">{p.type}</span>
					{#if p.routePattern}
						<span class="badge override">→ {p.routePattern}</span>
					{/if}
				</td>
				<td>
					<span class:dot-active={p.isActive} class:dot-inactive={!p.isActive}></span>
				</td>
				<td>{p.blockCount ?? 0}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/pages/${p.id}`}>Open builder</a>
					<form method="post" action="?/duplicate" use:enhance={() => async ({ update }) => { await update(); }} style="display:inline">
						<input type="hidden" name="id" value={p.id} />
						<button type="submit" class="adm-btn sm ghost">Duplicate</button>
					</form>
					<form method="post" action="?/delete" use:enhance={() => async ({ update }) => {
						if (confirm(`Delete page "${p.titleVi}"?`)) await update();
					}} style="display:inline">
						<input type="hidden" name="id" value={p.id} />
						<button type="submit" class="adm-btn sm danger">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="6" style="text-align:center; color:var(--fg-3); padding:24px">No pages yet. <a href="/admin/pages/new">Create one</a>.</td></tr>
		{/each}
	</tbody>
</table>

<style>
	.badge {
		display: inline-block;
		padding: 2px 8px;
		background: var(--bone);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.badge.override {
		background: var(--iwood-red-soft);
		border-color: var(--iwood-red);
		color: var(--iwood-red);
	}
	.dot-active, .dot-inactive {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.dot-active { background: var(--success); }
	.dot-inactive { background: var(--fg-4); }
	.adm-success {
		padding: 0.75rem 1rem;
		background: #d4edda;
		border: 1px solid var(--success);
		border-radius: var(--radius-sm);
		color: var(--success);
		margin-bottom: 1rem;
	}
</style>
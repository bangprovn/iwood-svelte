<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Menus</h1>
		<p>WordPress-style menus that drive the public header, mega menus, and footer.</p>
	</div>
	<a href="/admin/menus/new" class="adm-btn primary">+ New menu</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Name</th>
			<th>Slug</th>
			<th>Location</th>
			<th>Items</th>
			<th>Active</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><strong>{r.name}</strong></td>
				<td><code style="font-size:12px">{r.slug}</code></td>
				<td>
					{#if r.location}
						<span class="adm-pill">{r.location}</span>
					{:else}
						<span style="color:var(--fg-3)">—</span>
					{/if}
				</td>
				<td>{r.itemCount}</td>
				<td>
					{#if r.isActive}
						<span class="adm-pill adm-pill-ok">Yes</span>
					{:else}
						<span class="adm-pill" style="opacity:0.5">No</span>
					{/if}
				</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/menus/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete menu "${r.name}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button type="submit" class="adm-btn sm danger">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr>
				<td colspan="6" style="text-align:center; color:var(--fg-3); padding:24px">
					No menus yet. The Primary menu is auto-created on first public page load.
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.adm-pill {
		display: inline-flex;
		align-items: center;
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--bone);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.adm-pill-ok {
		background: rgba(34, 139, 34, 0.12);
		color: #1a7c1a;
	}
</style>

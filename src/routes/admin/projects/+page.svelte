<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const catName = (id: string) => data.cats.find((c) => c.id === id)?.nameVi ?? id;
</script>

<header class="adm-header">
	<div>
		<h1>Projects</h1>
		<p>{data.rows.length} project{data.rows.length === 1 ? '' : 's'}</p>
	</div>
	<a href="/admin/projects/new" class="adm-btn primary">+ New project</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th></th><th>Name (vi / en)</th><th>Category</th><th>Year</th><th>Location</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><img src={r.imageUrl} alt="" class="thumb" /></td>
				<td>
					<strong>{r.nameVi}</strong><br />
					<span style="color:var(--fg-3); font-size:12px">{r.nameEn}</span>
				</td>
				<td>{catName(r.categoryId)}</td>
				<td>{r.year}</td>
				<td>{r.location}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/projects/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete "${r.nameVi}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="6" style="text-align:center; color:var(--fg-3); padding:20px">No projects yet.</td></tr>
		{/each}
	</tbody>
</table>

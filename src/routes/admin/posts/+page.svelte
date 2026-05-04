<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Posts</h1>
		<p>{data.rows.length} post{data.rows.length === 1 ? '' : 's'}</p>
	</div>
	<a href="/admin/posts/new" class="adm-btn primary">+ New post</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th></th><th>Title (vi / en)</th><th>Category</th><th>Slug</th><th>Published</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><img src={r.imageUrl} alt="" class="thumb" /></td>
				<td>
					<strong>{r.titleVi}</strong><br />
					<span style="color:var(--fg-3); font-size:12px">{r.titleEn}</span>
				</td>
				<td>{r.category}</td>
				<td><code style="font-size:12px">{r.slug}</code></td>
				<td>{r.publishedAt}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/posts/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete "${r.titleVi}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="6" style="text-align:center; color:var(--fg-3); padding:20px">No posts yet.</td></tr>
		{/each}
	</tbody>
</table>

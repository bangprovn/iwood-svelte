<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function fmtPrice(v: number) {
		return new Intl.NumberFormat('vi-VN').format(v) + 'đ';
	}
</script>

<header class="adm-header">
	<div>
		<h1>Categories</h1>
		<p>Top-level groupings shown on /products and the mega menu.</p>
	</div>
	<a href="/admin/categories/new" class="adm-btn primary">+ New category</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Image</th>
			<th>Name (vi / en)</th>
			<th>ID</th>
			<th>From</th>
			<th>Display count</th>
			<th>Sort</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><img src={r.imageUrl} alt="" class="thumb" /></td>
				<td>
					<strong>{r.nameVi}</strong><br />
					<span style="color: var(--fg-3); font-size:12px">{r.nameEn}</span>
				</td>
				<td><code style="font-size:12px">{r.id}</code></td>
				<td>{fmtPrice(r.priceFrom)}</td>
				<td>{r.displayCount}</td>
				<td>{r.sortOrder}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/categories/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete category "${r.nameVi}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button type="submit" class="adm-btn sm danger">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="7" style="text-align:center; color:var(--fg-3); padding:24px">No categories yet.</td></tr>
		{/each}
	</tbody>
</table>

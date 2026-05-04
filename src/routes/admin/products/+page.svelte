<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const fmtPrice = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';
	const catName = (id: string) => data.categories.find((c) => c.id === id)?.nameVi ?? id;
</script>

<header class="adm-header">
	<div>
		<h1>Products</h1>
		<p>{data.rows.length} item{data.rows.length === 1 ? '' : 's'}</p>
	</div>
	<a href="/admin/products/new" class="adm-btn primary">+ New product</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<form method="get" class="adm-toolbar">
	<input
		type="search"
		class="adm-input"
		name="q"
		placeholder="Search code or name…"
		value={data.search}
		style="max-width:280px"
	/>
	<select name="cat" class="adm-select" style="max-width:200px">
		<option value="all">All categories</option>
		{#each data.categories as c (c.id)}
			<option value={c.id} selected={data.categoryId === c.id}>{c.nameVi}</option>
		{/each}
	</select>
	<button class="adm-btn ghost">Filter</button>
	{#if data.search || data.categoryId !== 'all'}
		<a href="/admin/products" class="adm-btn ghost sm">Clear</a>
	{/if}
</form>

<table class="adm-table">
	<thead>
		<tr>
			<th></th>
			<th>Code</th>
			<th>Name (vi / en)</th>
			<th>Category</th>
			<th>Price</th>
			<th>Tag</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><img src={r.imageUrl} alt="" class="thumb" /></td>
				<td><code style="font-size:12px">{r.code}</code></td>
				<td>
					<strong>{r.nameVi}</strong><br />
					<span style="color:var(--fg-3); font-size:12px">{r.nameEn}</span>
				</td>
				<td>{catName(r.categoryId)}</td>
				<td>{fmtPrice(r.price)}</td>
				<td>{r.tag ?? '—'}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/products/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete product "${r.nameVi}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button type="submit" class="adm-btn sm danger">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="7" style="text-align:center; color:var(--fg-3); padding:24px">No products match.</td></tr>
		{/each}
	</tbody>
</table>

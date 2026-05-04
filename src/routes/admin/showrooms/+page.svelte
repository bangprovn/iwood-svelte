<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>Showrooms</h1>
		<p>Locations shown on /contact and the topbar.</p>
	</div>
	<a href="/admin/showrooms/new" class="adm-btn primary">+ New showroom</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th></th><th>City</th><th>Address</th><th>Phone</th><th>Hours</th><th>Sort</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td><img src={r.imageUrl} alt="" class="thumb" /></td>
				<td><strong>{r.city}</strong></td>
				<td>{r.address}</td>
				<td>{r.phone}</td>
				<td>{r.hours}</td>
				<td>{r.sortOrder}</td>
				<td class="row-actions">
					<a class="adm-btn sm ghost" href={`/admin/showrooms/${r.id}`}>Edit</a>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete "${r.city}"?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="7" style="text-align:center; color:var(--fg-3); padding:20px">No showrooms yet.</td></tr>
		{/each}
	</tbody>
</table>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const fmtDate = (t: Date | string) => new Date(t as string).toLocaleString();
</script>

<header class="adm-header">
	<div>
		<h1>Newsletter</h1>
		<p>{data.rows.length} subscriber{data.rows.length === 1 ? '' : 's'}</p>
	</div>
	<a href="/admin/newsletter/export.csv" class="adm-btn ghost">Export CSV</a>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr><th>Email</th><th>Subscribed at</th><th></th></tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td>{r.email}</td>
				<td>{fmtDate(r.createdAt)}</td>
				<td>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Remove ${r.email}?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={r.id} />
						<button class="adm-btn sm danger" type="submit">Remove</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="3" style="text-align:center; color:var(--fg-3); padding:24px">No subscribers yet.</td></tr>
		{/each}
	</tbody>
</table>

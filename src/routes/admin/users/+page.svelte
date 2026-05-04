<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const fmtDate = (t: Date | string) => new Date(t as string).toLocaleString();
</script>

<header class="adm-header">
	<div>
		<h1>Users</h1>
		<p>{data.rows.length} account{data.rows.length === 1 ? '' : 's'}</p>
	</div>
</header>

<p class="adm-help">
	New accounts can be created via the public sign-in flow. Promote them to <strong>admin</strong>
	below to grant access to this console. (You can also pre-promote by adding the email to
	<code>ADMIN_EMAILS</code> in your env.)
</p>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr><th>Email</th><th>Name</th><th>Role</th><th>Verified</th><th>Joined</th><th></th></tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td>{r.email}</td>
				<td>{r.name}</td>
				<td><span class="pill {r.role}">{r.role}</span></td>
				<td>{r.emailVerified ? '✓' : '—'}</td>
				<td>{fmtDate(r.createdAt)}</td>
				<td>
					<form method="post" action="?/setRole" use:enhance style="display:inline">
						<input type="hidden" name="id" value={r.id} />
						<input type="hidden" name="role" value={r.role === 'admin' ? 'user' : 'admin'} />
						<button class="adm-btn sm ghost" type="submit">
							{r.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
						</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr><td colspan="6" style="text-align:center; color:var(--fg-3); padding:24px">No users yet.</td></tr>
		{/each}
	</tbody>
</table>

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let expanded = $state<string | null>(null);
	const fmtDate = (t: Date | string) => new Date(t as string).toLocaleString();
</script>

<header class="adm-header">
	<div>
		<h1>Contact messages</h1>
		<p>{data.rows.length} message{data.rows.length === 1 ? '' : 's'}</p>
	</div>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>When</th><th>Name / Phone</th><th>Subject</th><th>Status</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as c (c.id)}
			<tr>
				<td>{fmtDate(c.createdAt)}</td>
				<td>
					<strong>{c.name}</strong><br />
					<span style="color:var(--fg-3); font-size:12px">{c.phone}{c.email ? ' · ' + c.email : ''}</span>
				</td>
				<td>
					<button class="adm-btn sm ghost" onclick={() => (expanded = expanded === c.id ? null : c.id)}>
						{c.subject}
					</button>
				</td>
				<td>
					<form method="post" action="?/setStatus" use:enhance style="display:inline">
						<input type="hidden" name="id" value={c.id} />
						<select name="status" class="adm-select" style="padding:4px 8px; font-size:12px" onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>
							{#each data.statuses as s}
								<option value={s} selected={c.status === s}>{s}</option>
							{/each}
						</select>
					</form>
				</td>
				<td>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm('Delete this message?')) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={c.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
			{#if expanded === c.id}
				<tr>
					<td colspan="5" style="background:var(--bone)">
						<div style="padding: 8px 12px; white-space: pre-wrap">{c.message}</div>
					</td>
				</tr>
			{/if}
		{:else}
			<tr><td colspan="5" style="text-align:center; color:var(--fg-3); padding:24px">No messages yet.</td></tr>
		{/each}
	</tbody>
</table>

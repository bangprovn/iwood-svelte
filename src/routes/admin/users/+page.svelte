<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormDialog, FormField, FormRow } from '$lib/components/admin/form';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const fmtDate = (t: Date | string) => new Date(t as string).toLocaleString();

	type Row = (typeof data.rows)[number];

	let creating = $state(false);
	let editingUser = $state<Row | null>(null);
	let resetTarget = $state<Row | null>(null);

	type FormMsg = {
		scope?: string;
		id?: string;
		message?: string;
		success?: boolean;
	} | null;
	const createMsg = $derived<FormMsg>(form?.scope === 'create' ? (form as FormMsg) : null);
	const resetMsg = $derived<FormMsg>(form?.scope === 'reset' ? (form as FormMsg) : null);

	$effect(() => {
		if (createMsg?.success) creating = false;
	});
	$effect(() => {
		if (resetMsg?.success && resetTarget && resetMsg.id === resetTarget.id) {
			resetTarget = null;
		}
	});
</script>

<header class="adm-header">
	<div>
		<h1>Users</h1>
		<p>{data.rows.length} account{data.rows.length === 1 ? '' : 's'}</p>
	</div>
	<button class="adm-btn primary" type="button" onclick={() => (creating = true)}>
		+ New user
	</button>
</header>

<p class="adm-help" style="margin-bottom:18px">
	Anyone can sign up via the public <code>/register</code> page. Use this screen to provision an
	account directly, change roles, reset a password, or remove an account. (You can also pre-promote
	by adding the email to <code>ADMIN_EMAILS</code>.)
</p>

{#if form?.message && !form?.scope}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Email</th>
			<th>Name</th>
			<th>Role</th>
			<th>Verified</th>
			<th>Joined</th>
			<th class="actions-col">Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td>{r.email}</td>
				<td>{r.name}</td>
				<td><span class="pill {r.role}">{r.role}</span></td>
				<td>{r.emailVerified ? '✓' : '—'}</td>
				<td>{fmtDate(r.createdAt)}</td>
				<td class="actions-col">
					<button
						class="adm-btn sm ghost"
						type="button"
						onclick={() => (editingUser = r)}
					>
						Edit name
					</button>
					<form method="post" action="?/setRole" use:enhance class="inline-form">
						<input type="hidden" name="id" value={r.id} />
						<input
							type="hidden"
							name="role"
							value={r.role === 'admin' ? 'user' : 'admin'}
						/>
						<button class="adm-btn sm ghost" type="submit">
							{r.role === 'admin' ? 'Demote' : 'Promote'}
						</button>
					</form>
					<button
						class="adm-btn sm ghost"
						type="button"
						onclick={() => (resetTarget = r)}
					>
						Reset password
					</button>
					<form
						method="post"
						action="?/delete"
						use:enhance={({ cancel }) => {
							if (!confirm(`Delete user ${r.email}? This cannot be undone.`)) cancel();
							return ({ update }) => update();
						}}
						class="inline-form"
					>
						<input type="hidden" name="id" value={r.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{:else}
			<tr>
				<td colspan="6" style="text-align:center; color:var(--fg-3); padding:24px">
					No users yet.
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- Create user modal -->
<FormDialog
	open={creating}
	title="New user"
	subtitle="Provision an account directly. They can sign in immediately."
	action="?/create"
	submitLabel="Create user"
	error={createMsg?.message}
	onClose={() => (creating = false)}
>
	<FormRow>
		<FormField label="Email" required>
			<input
				class="adm-input"
				type="email"
				name="email"
				required
				autocomplete="off"
			/>
		</FormField>
		<FormField label="Full name" required>
			<input
				class="adm-input"
				type="text"
				name="name"
				required
				autocomplete="off"
			/>
		</FormField>
	</FormRow>
	<FormRow>
		<FormField label="Password" required help="Minimum 8 characters.">
			<input
				class="adm-input"
				type="text"
				name="password"
				required
				minlength={8}
				autocomplete="off"
			/>
		</FormField>
		<FormField label="Role">
			<select class="adm-select" name="role">
				<option value="user">User</option>
				<option value="admin">Admin</option>
			</select>
		</FormField>
	</FormRow>
</FormDialog>

<!-- Edit name modal -->
<FormDialog
	open={editingUser !== null}
	title="Rename user"
	subtitle={editingUser?.email}
	action="?/updateName"
	submitLabel="Save"
	size="sm"
	onClose={() => (editingUser = null)}
	onSubmit={() =>
		async ({ update, result }) => {
			await update();
			if (result.type === 'success') editingUser = null;
		}}
>
	{#if editingUser}
		<input type="hidden" name="id" value={editingUser.id} />
		<FormField label="Full name" required>
			<input
				class="adm-input"
				type="text"
				name="name"
				value={editingUser.name}
				required
				autocomplete="off"
			/>
		</FormField>
	{/if}
</FormDialog>

<!-- Reset password modal -->
<FormDialog
	open={resetTarget !== null}
	title="Reset password"
	subtitle={resetTarget?.email}
	action="?/resetPassword"
	submitLabel="Set password"
	size="sm"
	error={resetMsg?.id === resetTarget?.id ? resetMsg?.message : undefined}
	onClose={() => (resetTarget = null)}
>
	{#if resetTarget}
		<input type="hidden" name="id" value={resetTarget.id} />
		<FormField
			label="New password"
			required
			help="Minimum 8 characters. Share securely with the user."
		>
			<input
				class="adm-input"
				type="text"
				name="newPassword"
				required
				minlength={8}
				autocomplete="off"
			/>
		</FormField>
	{/if}
</FormDialog>

<style>
	.adm-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}
	.inline-form {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		margin-right: 6px;
	}
	.actions-col {
		white-space: nowrap;
	}
</style>

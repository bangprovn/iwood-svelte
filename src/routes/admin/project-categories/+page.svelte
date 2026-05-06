<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormDialog, FormField, FormRow } from '$lib/components/admin/form';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Row = (typeof data.rows)[number];

	let creating = $state(false);
	let editing = $state<Row | null>(null);

	const createErrors = $derived(
		form?.scope === 'create' ? form?.errors ?? {} : {}
	);
	const updateErrors = $derived(
		form?.scope === 'update' && editing && form?.editId === editing.id
			? form?.errors ?? {}
			: {}
	);
</script>

<header class="adm-header">
	<div>
		<h1>Project categories</h1>
		<p>Filters used on /projects.</p>
	</div>
	<button class="adm-btn primary" type="button" onclick={() => (creating = true)}>
		+ New category
	</button>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>Sort</th><th>ID</th><th>Vietnamese</th><th>English</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as r (r.id)}
			<tr>
				<td>{r.sortOrder}</td>
				<td><code style="font-size:12px">{r.id}</code></td>
				<td>{r.nameVi}</td>
				<td>{r.nameEn}</td>
				<td class="row-actions">
					<button class="adm-btn sm ghost" type="button" onclick={() => (editing = r)}>
						Edit
					</button>
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
			<tr>
				<td colspan="5" style="text-align:center; color:var(--fg-3); padding:20px">
					No project categories yet.
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<!-- Create modal -->
<FormDialog
	open={creating}
	title="New project category"
	subtitle="Used as a filter on the public /projects page."
	action="?/create"
	submitLabel="Create"
	onClose={() => (creating = false)}
>
	<FormRow>
		<FormField label="Vietnamese" required error={createErrors.nameVi}>
			<input class="adm-input" name="nameVi" required />
		</FormField>
		<FormField label="English" required error={createErrors.nameEn}>
			<input class="adm-input" name="nameEn" required />
		</FormField>
	</FormRow>
	<FormRow>
		<FormField label="ID (slug)" help="Optional. Auto-derived from English name if blank.">
			<input class="adm-input" name="id" placeholder="auto" />
		</FormField>
		<FormField label="Sort order" help="Lower appears first.">
			<input class="adm-input" type="number" name="sortOrder" value="0" />
		</FormField>
	</FormRow>
</FormDialog>

<!-- Edit modal -->
<FormDialog
	open={editing !== null}
	title="Edit project category"
	subtitle={editing?.nameVi}
	action="?/update"
	submitLabel="Save changes"
	onClose={() => (editing = null)}
	onSubmit={() =>
		async ({ update, result }) => {
			await update();
			if (result.type === 'success') editing = null;
		}}
>
	{#if editing}
		<input type="hidden" name="id" value={editing.id} />
		<FormRow>
			<FormField label="Vietnamese" required error={updateErrors.nameVi}>
				<input class="adm-input" name="nameVi" value={editing.nameVi} required />
			</FormField>
			<FormField label="English" required error={updateErrors.nameEn}>
				<input class="adm-input" name="nameEn" value={editing.nameEn} required />
			</FormField>
		</FormRow>
		<FormField label="Sort order">
			<input
				class="adm-input"
				type="number"
				name="sortOrder"
				value={editing.sortOrder}
			/>
		</FormField>
	{/if}
</FormDialog>

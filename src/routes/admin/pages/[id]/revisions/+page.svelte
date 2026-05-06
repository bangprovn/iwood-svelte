<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const p = $derived(data.page);
	const revisions = $derived(data.revisions);
</script>

<header class="adm-header">
	<div>
		<h1>Revisions — {p.titleVi}</h1>
		<p>Every publish creates a snapshot. Revert restores the live editor to that snapshot and re-publishes it.</p>
	</div>
	<div class="header-actions">
		<a href={`/admin/pages/${p.id}/blocks`} class="adm-btn ghost">← Back to blocks</a>
	</div>
</header>

{#if form?.success}
	<p class="adm-success">Reverted to revision #{form.revertedTo} and re-published.</p>
{/if}
{#if form?.error}
	<p class="adm-error">{form.error}</p>
{/if}

{#if revisions.length === 0}
	<div class="empty">No revisions yet. Hit Publish from the editor to create the first one.</div>
{:else}
	<table class="adm-table">
		<thead>
			<tr>
				<th>Published</th>
				<th>By</th>
				<th>Note</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each revisions as rev, i (rev.id)}
				<tr class:current={i === 0}>
					<td>
						{new Date(rev.publishedAt).toLocaleString()}
						{#if i === 0}<span class="badge current-badge">current</span>{/if}
					</td>
					<td>{rev.publishedBy ?? '—'}</td>
					<td>{rev.note ?? '—'}</td>
					<td class="row-actions">
						{#if i !== 0}
							<form
								method="post"
								action="?/revert"
								use:enhance={() => async ({ update }) => {
									if (confirm('Revert the live editor to this revision and re-publish? Current unpublished changes will be lost.')) await update();
								}}
								style="display:inline"
							>
								<input type="hidden" name="revisionId" value={rev.id} />
								<button type="submit" class="adm-btn sm danger">Revert</button>
							</form>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.header-actions { display: flex; gap: 0.75rem; }
	.empty { padding: 4rem 2rem; text-align: center; color: var(--fg-3); border: 1px dashed var(--border); border-radius: var(--radius-sm); }
	.current { background: var(--bone); }
	.badge { display: inline-block; padding: 1px 8px; background: var(--bone); border: 1px solid var(--border); border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-left: 8px; }
	.current-badge { background: var(--success); color: white; border-color: var(--success); }
	.row-actions { text-align: right; }
	.adm-success { padding: 0.75rem 1rem; background: #d4edda; border: 1px solid var(--success); border-radius: var(--radius-sm); color: var(--success); margin-bottom: 1rem; }
	.adm-error { padding: 0.75rem 1rem; background: #f8d7da; border: 1px solid var(--danger, #c00); border-radius: var(--radius-sm); color: var(--danger, #c00); margin-bottom: 1rem; }
</style>

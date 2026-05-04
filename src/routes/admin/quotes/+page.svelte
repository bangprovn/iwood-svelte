<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let expanded = $state<string | null>(null);

	const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
	const fmtDate = (t: Date | string) => new Date(t as string).toLocaleString();
</script>

<header class="adm-header">
	<div>
		<h1>Quotes</h1>
		<p>{data.rows.length} request{data.rows.length === 1 ? '' : 's'}</p>
	</div>
</header>

{#if form?.message}<p class="adm-error">{form.message}</p>{/if}

<table class="adm-table">
	<thead>
		<tr>
			<th>When</th><th>Name / Phone</th><th>Project</th><th>Area</th><th>Items</th><th>Status</th><th></th>
		</tr>
	</thead>
	<tbody>
		{#each data.rows as q (q.id)}
			<tr>
				<td>{fmtDate(q.createdAt)}</td>
				<td>
					<strong>{q.name}</strong><br />
					<span style="color:var(--fg-3); font-size:12px">{q.phone}{q.email ? ' · ' + q.email : ''}</span>
				</td>
				<td>
					{q.projectType}
					{#if q.city}<br /><span style="color:var(--fg-3); font-size:12px">{q.city}</span>{/if}
				</td>
				<td>{q.area} m²</td>
				<td>
					{#if q.items.length}
						<button class="adm-btn sm ghost" onclick={() => (expanded = expanded === q.id ? null : q.id)}>
							{q.items.length} item{q.items.length === 1 ? '' : 's'}
						</button>
					{:else}
						<span style="color:var(--fg-4)">—</span>
					{/if}
				</td>
				<td>
					<form method="post" action="?/setStatus" use:enhance style="display:inline">
						<input type="hidden" name="id" value={q.id} />
						<select name="status" class="adm-select" style="padding:4px 8px; font-size:12px" onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}>
							{#each data.statuses as s}
								<option value={s} selected={q.status === s}>{s}</option>
							{/each}
						</select>
					</form>
				</td>
				<td>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => async ({ update }) => {
							if (confirm(`Delete quote from ${q.name}?`)) await update();
						}}
						style="display:inline"
					>
						<input type="hidden" name="id" value={q.id} />
						<button class="adm-btn sm danger" type="submit">Delete</button>
					</form>
				</td>
			</tr>
			{#if expanded === q.id}
				<tr>
					<td colspan="7" style="background:var(--bone)">
						<div style="padding: 6px 8px">
							<strong>Notes:</strong> {q.notes || '—'}<br />
							<strong>Start window:</strong> {q.startWindow || '—'}
							<table class="adm-table" style="margin-top:10px">
								<thead>
									<tr><th>Code</th><th>Name</th><th>Qty</th><th>Unit price (snapshot)</th><th>Subtotal</th></tr>
								</thead>
								<tbody>
									{#each q.items as it (it.id)}
										<tr>
											<td><code>{it.productCode ?? '?'}</code></td>
											<td>{it.productNameVi ?? '(deleted product)'}</td>
											<td>{it.qty}</td>
											<td>{fmt(it.unitPriceSnapshot)}đ</td>
											<td>{fmt(it.qty * it.unitPriceSnapshot)}đ</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</td>
				</tr>
			{/if}
		{:else}
			<tr><td colspan="7" style="text-align:center; color:var(--fg-3); padding:24px">No quotes yet.</td></tr>
		{/each}
	</tbody>
</table>

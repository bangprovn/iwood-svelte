<script lang="ts">
	type Props = {
		name: string;
		value?: string;
		prefix?: string;
		label?: string;
		required?: boolean;
	};
	let { name, value = $bindable(''), prefix = 'misc', label = 'Image', required }: Props = $props();

	let busy = $state(false);
	let err = $state<string | null>(null);

	async function onPick(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		err = null;
		busy = true;
		try {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('prefix', prefix);
			const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
			if (!res.ok) {
				err = (await res.text()) || `Upload failed (${res.status})`;
				return;
			}
			const data = (await res.json()) as { url: string };
			value = data.url;
		} catch (e) {
			err = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
			input.value = '';
		}
	}
</script>

<div class="img-field">
	<label class="img-label">{label}{#if required}<span class="req">*</span>{/if}</label>
	<div class="img-row">
		<div class="img-preview" class:empty={!value}>
			{#if value}
				<img src={value} alt="" loading="lazy" />
			{:else}
				<span>No image</span>
			{/if}
		</div>
		<div class="img-controls">
			<input
				type="text"
				class="adm-input"
				bind:value
				placeholder="/uploads/... or paste URL"
				{required}
				name={name}
			/>
			<div class="img-buttons">
				<label class="adm-btn">
					{busy ? 'Uploading…' : 'Upload'}
					<input type="file" accept="image/*" onchange={onPick} hidden disabled={busy} />
				</label>
				{#if value}
					<button type="button" class="adm-btn ghost" onclick={() => (value = '')}>Clear</button>
				{/if}
			</div>
			{#if err}<p class="img-err">{err}</p>{/if}
		</div>
	</div>
</div>

<style>
	.img-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.img-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--fg-2);
	}
	.req {
		color: var(--accent);
		margin-left: 2px;
	}
	.img-row {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 12px;
		align-items: start;
	}
	.img-preview {
		width: 140px;
		height: 100px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bone);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--fg-4);
		font-size: 12px;
	}
	.img-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.img-controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.img-buttons {
		display: flex;
		gap: 8px;
	}
	.img-err {
		color: var(--danger);
		font-size: 12px;
		margin: 0;
	}
</style>

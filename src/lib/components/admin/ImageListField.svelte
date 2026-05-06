<script lang="ts">
	type Props = {
		name: string;
		value?: string[];
		prefix?: string;
		oninput?: (value: string[]) => void;
	};
	let { name, value = $bindable<string[]>([]), prefix = 'misc', oninput }: Props = $props();

	function setValue(v: string[]) {
		value = v;
		oninput?.(v);
	}

	let busy = $state(false);
	let err = $state<string | null>(null);
	let urlInput = $state('');

	function addUrl(v: string) {
		const trimmed = v.trim();
		if (!trimmed) return;
		setValue([...(value ?? []), trimmed]);
		urlInput = '';
	}

	function remove(idx: number) {
		const arr = [...(value ?? [])];
		arr.splice(idx, 1);
		setValue(arr);
	}

	async function onPick(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;
		err = null;
		busy = true;
		try {
			for (const file of Array.from(files)) {
				const fd = new FormData();
				fd.append('file', file);
				fd.append('prefix', prefix);
				const res = await fetch('/admin/api/upload', { method: 'POST', body: fd });
				if (!res.ok) {
					err = (await res.text()) || `Upload failed (${res.status})`;
					return;
				}
				const data = (await res.json()) as { url: string };
				setValue([...(value ?? []), data.url]);
			}
		} catch (e) {
			err = e instanceof Error ? e.message : String(e);
		} finally {
			busy = false;
			input.value = '';
		}
	}
</script>

<div class="imagelist-field">
	{#if value && value.length > 0}
		<div class="thumbs">
			{#each value as img, idx (idx)}
				<div class="thumb">
					<img src={img} alt="" />
					<button type="button" class="thumb-x" onclick={() => remove(idx)} aria-label="Remove">×</button>
				</div>
			{/each}
		</div>
	{/if}
	<div class="add-row">
		<input
			type="url"
			placeholder="Paste image URL and press Enter…"
			bind:value={urlInput}
			onkeydown={(e: KeyboardEvent) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					addUrl(urlInput);
				}
			}}
		/>
		<label class="adm-btn">
			{busy ? 'Uploading…' : 'Upload'}
			<input type="file" accept="image/*" multiple onchange={onPick} hidden disabled={busy} />
		</label>
	</div>
	{#if err}<p class="err">{err}</p>{/if}
	<input type="hidden" {name} value={JSON.stringify(value ?? [])} />
</div>

<style>
	.imagelist-field { display: flex; flex-direction: column; gap: 0.5rem; }
	.thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
	.thumb { position: relative; }
	.thumb img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border); }
	.thumb-x {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 22px;
		height: 22px;
		border: none;
		background: rgba(0,0,0,0.6);
		color: white;
		border-radius: 50%;
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
	}
	.thumb-x:hover { background: var(--danger, #c00); }
	.add-row { display: flex; gap: 8px; }
	.add-row input[type="url"] { flex: 1; padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: var(--radius-sm); }
	.err { color: var(--danger, #c00); font-size: 12px; margin: 0; }
</style>

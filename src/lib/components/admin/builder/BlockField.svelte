<script lang="ts">
	import type { ContentField, SettingsField } from '$lib/page-blocks/registry';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import ImageListField from '$lib/components/admin/ImageListField.svelte';

	type Props = {
		field: ContentField | SettingsField;
		/**
		 * Form input name. The wrapping <form> in the inspector serializes by name,
		 * and saveBlockSettings / saveBlockContent server actions read these.
		 */
		inputName: string;
		/**
		 * Bag the field reads from / writes to. Mutated in place — callers should
		 * pass a $state-tracked object so changes propagate.
		 */
		bag: Record<string, unknown>;
	};
	let { field, inputName, bag }: Props = $props();

	const id = $derived(`bf-${inputName}-${field.key}`);
	const placeholder = $derived((field as { placeholder?: string }).placeholder ?? '');

	function readString(): string {
		const v = bag[field.key];
		if (v == null) return '';
		return String(v);
	}

	function readBool(): boolean {
		return Boolean(bag[field.key]);
	}

	function setVal(v: unknown) {
		bag[field.key] = v;
	}
</script>

<div class="bf">
	<label for={id} class="bf-label">
		{field.label}
		{#if field.required}<span class="req">*</span>{/if}
	</label>

	{#if field.type === 'text'}
		<input
			{id}
			type="text"
			name={inputName}
			value={readString()}
			{placeholder}
			required={field.required}
			oninput={(e) => setVal((e.currentTarget as HTMLInputElement).value)}
		/>
	{:else if field.type === 'url'}
		<input
			{id}
			type="url"
			name={inputName}
			value={readString()}
			{placeholder}
			required={field.required}
			oninput={(e) => setVal((e.currentTarget as HTMLInputElement).value)}
		/>
	{:else if field.type === 'textarea'}
		<textarea
			{id}
			name={inputName}
			rows="3"
			{placeholder}
			required={field.required}
			oninput={(e) => setVal((e.currentTarget as HTMLTextAreaElement).value)}>{readString()}</textarea
		>
	{:else if field.type === 'richtext'}
		<RichTextEditor
			name={inputName}
			value={readString()}
			minHeight="180px"
			placeholder={placeholder || 'Start writing…'}
			oninput={(html: string) => setVal(html)}
		/>
	{:else if field.type === 'number'}
		{@const numField = field as SettingsField}
		<input
			{id}
			type="number"
			name={inputName}
			value={readString()}
			min={numField.min}
			max={numField.max}
			step={numField.step}
			oninput={(e) => setVal(Number((e.currentTarget as HTMLInputElement).value))}
		/>
	{:else if field.type === 'color'}
		<div class="color-row">
			<input
				type="color"
				value={readString() || '#000000'}
				oninput={(e) => setVal((e.currentTarget as HTMLInputElement).value)}
			/>
			<input
				type="text"
				name={inputName}
				value={readString()}
				placeholder="#000000"
				oninput={(e) => setVal((e.currentTarget as HTMLInputElement).value)}
			/>
		</div>
	{:else if field.type === 'boolean'}
		<label class="toggle">
			<input
				type="checkbox"
				name={inputName}
				value="1"
				checked={readBool()}
				onchange={(e) => setVal((e.currentTarget as HTMLInputElement).checked)}
			/>
			<span class="toggle-track" aria-hidden="true"></span>
			<span class="toggle-text">{readBool() ? 'On' : 'Off'}</span>
		</label>
	{:else if field.type === 'select'}
		{@const selField = field as SettingsField | ContentField}
		<select
			{id}
			name={inputName}
			value={readString()}
			onchange={(e) => setVal((e.currentTarget as HTMLSelectElement).value)}
		>
			{#each (selField.options ?? []) as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	{:else if field.type === 'image'}
		<ImageField
			name={inputName}
			value={readString()}
			oninput={(v: string) => setVal(v)}
			prefix="pages"
			label=""
		/>
	{:else if field.type === 'imagelist'}
		<ImageListField
			name={inputName}
			value={(bag[field.key] as string[]) ?? []}
			oninput={(arr: string[]) => setVal(arr)}
			prefix="pages"
		/>
	{/if}
</div>

<style>
	.bf {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.bf-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--fg-2);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.req { color: var(--accent); margin-left: 2px; }
	input[type='text'],
	input[type='url'],
	input[type='number'],
	textarea,
	select {
		padding: 8px 10px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 13px;
		color: var(--ink);
		background: var(--paper);
		width: 100%;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.14);
	}
	textarea { resize: vertical; min-height: 60px; font-family: var(--font-body); }
	.color-row { display: flex; gap: 8px; align-items: center; }
	.color-row input[type='color'] {
		width: 40px;
		height: 36px;
		padding: 2px;
		border: 1.5px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		background: var(--paper);
	}
	.color-row input[type='text'] { flex: 1; }
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		user-select: none;
	}
	.toggle input { position: absolute; opacity: 0; pointer-events: none; }
	.toggle-track {
		position: relative;
		width: 36px;
		height: 20px;
		background: var(--border);
		border-radius: 10px;
		transition: background var(--dur-base) var(--ease-out);
	}
	.toggle-track::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: var(--paper);
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		transition: transform var(--dur-base) var(--ease-out);
	}
	.toggle input:checked ~ .toggle-track { background: var(--accent); }
	.toggle input:checked ~ .toggle-track::after { transform: translateX(16px); }
	.toggle-text { font-size: 13px; color: var(--fg-2); font-weight: 500; }
</style>

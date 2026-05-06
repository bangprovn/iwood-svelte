<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label?: string;
		required?: boolean;
		help?: string;
		error?: string;
		htmlFor?: string;
		span?: 1 | 2 | 'full';
		children: Snippet;
	};

	let {
		label,
		required = false,
		help,
		error,
		htmlFor,
		span = 1,
		children
	}: Props = $props();
</script>

<div
	class="adm-field"
	class:adm-field-span-2={span === 2}
	class:adm-field-span-full={span === 'full'}
	class:has-error={!!error}
>
	{#if label}
		<label for={htmlFor}>
			{label}
			{#if required}<span class="adm-field-required" aria-hidden="true">*</span>{/if}
		</label>
	{/if}
	{@render children()}
	{#if error}
		<p class="adm-field-error">{error}</p>
	{:else if help}
		<p class="adm-help">{help}</p>
	{/if}
</div>

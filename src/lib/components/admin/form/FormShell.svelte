<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';

	type Enctype =
		| 'multipart/form-data'
		| 'application/x-www-form-urlencoded'
		| 'text/plain';

	type Props = {
		title: string;
		subtitle?: string;
		backHref: string;
		backLabel?: string;
		mode?: 'new' | 'edit';
		submitLabel?: string;
		cancelHref?: string;
		action?: string;
		enctype?: Enctype;
		error?: string;
		flash?: string;
		children: Snippet;
		sidebar?: Snippet;
		secondaryActions?: Snippet;
		footer?: Snippet;
	};

	let {
		title,
		subtitle,
		backHref,
		backLabel = 'Back',
		mode,
		submitLabel,
		cancelHref,
		action,
		enctype,
		error,
		flash,
		children,
		sidebar,
		secondaryActions,
		footer
	}: Props = $props();

	const resolvedSubmit = $derived(
		submitLabel ?? (mode === 'new' ? 'Create' : 'Save changes')
	);
	const resolvedCancel = $derived(cancelHref ?? backHref);
</script>

<form
	method="post"
	{action}
	{enctype}
	class="adm-form-shell"
	class:has-sidebar={!!sidebar}
>
	<div class="adm-form-topbar">
		<div class="adm-form-topbar-lead">
			<a class="adm-form-back" href={backHref}>
				<Icon name="chevL" size={14} stroke={2} />
				<span>{backLabel}</span>
			</a>
			<div class="adm-form-titles">
				<h1>{title}</h1>
				{#if subtitle}<p>{subtitle}</p>{/if}
			</div>
		</div>
		<div class="adm-form-topbar-actions">
			{#if secondaryActions}{@render secondaryActions()}{/if}
			<a class="adm-btn ghost" href={resolvedCancel}>Cancel</a>
			<button type="submit" class="adm-btn primary">{resolvedSubmit}</button>
		</div>
	</div>

	{#if error}
		<p class="adm-error adm-form-flash">{error}</p>
	{/if}
	{#if flash}
		<p class="adm-flash adm-form-flash">{flash}</p>
	{/if}

	<div class="adm-form-grid">
		<div class="adm-form-main">
			{@render children()}
		</div>
		{#if sidebar}
			<aside class="adm-form-side">
				{@render sidebar()}
			</aside>
		{/if}
	</div>

	{#if footer}
		<div class="adm-form-footer">
			{@render footer()}
		</div>
	{/if}
</form>

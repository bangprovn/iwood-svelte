<script lang="ts">
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';
	import type { ActionData, PageData } from './$types';

	let { form }: { data: PageData; form: ActionData } = $props();

	let titleVi = $state((form?.titleVi as string | undefined) ?? '');
	let titleEn = $state((form?.titleEn as string | undefined) ?? '');
	let slugValue = $state((form?.slug as string | undefined) ?? '');
	let typeValue = $state(((form?.type as string | undefined) ?? 'custom'));
	let slugTouched = $state(!!form?.slug);

	function onTitleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		titleVi = input.value;
		if (!slugTouched) {
			slugValue = input.value
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');
		}
	}

	function onSlugInput(e: Event) {
		slugTouched = true;
		slugValue = (e.target as HTMLInputElement).value;
	}
</script>

<FormShell
	mode="new"
	title="New page"
	subtitle="Create a custom page or override an existing route."
	backHref="/admin/pages"
	backLabel="Pages"
	submitLabel="Create page"
	error={form?.error as string | undefined}
>
	<FormSection title="Titles" description="Shown as the page heading and in the listing.">
		<FormRow>
			<FormField label="Vietnamese" required>
				<input
					class="adm-input"
					name="titleVi"
					value={titleVi}
					oninput={onTitleInput}
					required
				/>
			</FormField>
			<FormField label="English" help="Falls back to the Vietnamese title if left blank.">
				<input
					class="adm-input"
					name="titleEn"
					value={titleEn}
					oninput={(e) => (titleEn = (e.target as HTMLInputElement).value)}
				/>
			</FormField>
		</FormRow>
	</FormSection>

	<FormSection title="Routing">
		<FormField label="Page type">
			<select class="adm-select" name="type" bind:value={typeValue}>
				<option value="custom">Custom page (new slug)</option>
				<option value="override">Override existing route</option>
			</select>
		</FormField>

		{#if typeValue === 'override'}
			<FormField
				label="Route to override"
				required
				help="Existing route path (e.g. /about, /contact)."
			>
				<input
					class="adm-input"
					name="routePattern"
					placeholder="/about"
					value={(form?.routePattern as string | undefined) ?? ''}
				/>
			</FormField>
		{/if}
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Slug" dense>
			<FormField label="Slug" required help={`URL: /${slugValue || '<slug>'}`}>
				<input
					class="adm-input"
					name="slug"
					value={slugValue}
					oninput={onSlugInput}
					placeholder="my-page"
					required
				/>
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>

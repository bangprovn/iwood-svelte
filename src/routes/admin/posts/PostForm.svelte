<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		values?: {
			id?: string;
			slug?: string;
			titleVi?: string;
			titleEn?: string;
			category?: string;
			publishedAt?: string;
			imageUrl?: string;
			excerptVi?: string;
			excerptEn?: string | null;
			contentVi?: string | null;
			contentEn?: string | null;
		};
		errors?: Record<string, string>;
	};
	let { mode, title, subtitle, values = {}, errors = {} }: Props = $props();
	let imageUrl = $state(values.imageUrl ?? '');
	let contentVi = $state(values.contentVi ?? '');
	let contentEn = $state(values.contentEn ?? '');
</script>

<FormShell {title} {subtitle} {mode} backHref="/admin/posts" backLabel="Posts">
	<input type="hidden" name="id" value={values.id ?? ''} />

	<FormSection title="Titles" description="The headline shown on /news and post pages.">
		<FormRow>
			<FormField label="Vietnamese" required error={errors.titleVi}>
				<input class="adm-input" name="titleVi" value={values.titleVi ?? ''} required />
			</FormField>
			<FormField label="English" required error={errors.titleEn}>
				<input class="adm-input" name="titleEn" value={values.titleEn ?? ''} required />
			</FormField>
		</FormRow>
	</FormSection>

	<FormSection title="Excerpt" description="A short summary shown in cards and previews.">
		<FormRow>
			<FormField label="Vietnamese" required>
				<textarea class="adm-textarea" name="excerptVi" required>{values.excerptVi ?? ''}</textarea>
			</FormField>
			<FormField label="English">
				<textarea class="adm-textarea" name="excerptEn">{values.excerptEn ?? ''}</textarea>
			</FormField>
		</FormRow>
	</FormSection>

	<FormSection
		title="Content"
		description="Rendered as HTML on /news/[slug]. Sanitised on save."
	>
		<FormField label="Body (Vietnamese)">
			<RichTextEditor
				name="contentVi"
				bind:value={contentVi}
				minHeight="320px"
				placeholder="Viết nội dung bài viết…"
			/>
		</FormField>
		<FormField label="Body (English)">
			<RichTextEditor
				name="contentEn"
				bind:value={contentEn}
				minHeight="320px"
				placeholder="Write the English version (optional)…"
			/>
		</FormField>
	</FormSection>

	<FormSection title="Cover image">
		<ImageField name="imageUrl" bind:value={imageUrl} prefix="posts" required />
		{#if errors.imageUrl}
			<p class="adm-field-error">{errors.imageUrl}</p>
		{/if}
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Publish" dense>
			<FormField label="Published date" required error={errors.publishedAt}>
				<input
					class="adm-input"
					type="date"
					name="publishedAt"
					value={values.publishedAt ?? ''}
					required
				/>
			</FormField>
			<FormField
				label="Slug"
				help={mode === 'edit'
					? 'Used in /news/[slug]. Change with care.'
					: 'Auto-derived from the title if blank.'}
			>
				<input
					class="adm-input"
					name="slug"
					value={values.slug ?? ''}
					placeholder="auto from title"
				/>
			</FormField>
		</FormSection>

		<FormSection title="Category" dense>
			<FormField label="Category" required>
				<input
					class="adm-input"
					name="category"
					value={values.category ?? ''}
					placeholder="e.g. Tin tức, Hướng dẫn"
					required
				/>
			</FormField>
		</FormSection>
	{/snippet}
</FormShell>

<script lang="ts">
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';

	type Props = {
		mode: 'new' | 'edit';
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
	let { mode, values = {}, errors = {} }: Props = $props();
	let imageUrl = $state(values.imageUrl ?? '');
	let contentVi = $state(values.contentVi ?? '');
	let contentEn = $state(values.contentEn ?? '');
</script>

<div class="adm-card">
	<form method="post" class="adm-form">
		<div class="row">
			<div class="adm-field">
				<label>Slug</label>
				<input class="adm-input" name="slug" value={values.slug ?? ''} placeholder="auto from title" />
			</div>
			<div class="adm-field">
				<label>Published date *</label>
				<input class="adm-input" type="date" name="publishedAt" value={values.publishedAt ?? ''} required />
				{#if errors.publishedAt}<p class="adm-help" style="color:var(--danger)">{errors.publishedAt}</p>{/if}
			</div>
		</div>
		<input type="hidden" name="id" value={values.id ?? ''} />

		<div class="row">
			<div class="adm-field">
				<label>Title (Vietnamese) *</label>
				<input class="adm-input" name="titleVi" value={values.titleVi ?? ''} required />
				{#if errors.titleVi}<p class="adm-help" style="color:var(--danger)">{errors.titleVi}</p>{/if}
			</div>
			<div class="adm-field">
				<label>Title (English) *</label>
				<input class="adm-input" name="titleEn" value={values.titleEn ?? ''} required />
				{#if errors.titleEn}<p class="adm-help" style="color:var(--danger)">{errors.titleEn}</p>{/if}
			</div>
		</div>

		<div class="adm-field">
			<label>Category *</label>
			<input class="adm-input" name="category" value={values.category ?? ''} placeholder="e.g. Tin tức, Hướng dẫn" required />
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Excerpt (Vietnamese) *</label>
				<textarea class="adm-textarea" name="excerptVi" required>{values.excerptVi ?? ''}</textarea>
			</div>
			<div class="adm-field">
				<label>Excerpt (English)</label>
				<textarea class="adm-textarea" name="excerptEn">{values.excerptEn ?? ''}</textarea>
			</div>
		</div>

		<div class="adm-field">
			<label>Body (Vietnamese)</label>
			<RichTextEditor name="contentVi" bind:value={contentVi} minHeight="320px" placeholder="Viết nội dung bài viết…" />
			<p class="adm-help">Rendered as HTML on /news/[slug]. Sanitised on save.</p>
		</div>
		<div class="adm-field">
			<label>Body (English)</label>
			<RichTextEditor name="contentEn" bind:value={contentEn} minHeight="320px" placeholder="Write the English version (optional)…" />
		</div>

		<ImageField name="imageUrl" bind:value={imageUrl} prefix="posts" required label="Cover image *" />
		{#if errors.imageUrl}<p class="adm-help" style="color:var(--danger)">{errors.imageUrl}</p>{/if}

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary">{mode === 'new' ? 'Publish' : 'Save changes'}</button>
			<a href="/admin/posts" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>

<script lang="ts">
	import PostForm from '../PostForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const initial = $derived({
		id: data.row.id,
		slug: data.row.slug,
		titleVi: data.row.titleVi,
		titleEn: data.row.titleEn,
		category: data.row.category,
		publishedAt: data.row.publishedAt,
		imageUrl: data.row.imageUrl,
		excerptVi: data.row.excerptVi,
		excerptEn: data.row.excerptEn,
		contentVi: data.row.contentVi,
		contentEn: data.row.contentEn
	});
</script>

<header class="adm-header">
	<div>
		<h1>Edit post</h1>
		<p>{data.row.titleVi}</p>
	</div>
</header>

<PostForm mode="edit" values={form?.values ?? initial} errors={form?.errors ?? {}} />

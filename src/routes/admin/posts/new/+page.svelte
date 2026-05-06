<script lang="ts">
	import PostForm from '../PostForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	const today = new Date().toISOString().slice(0, 10);
</script>

<PostForm
	mode="new"
	title="New post"
	subtitle="Editorial content shown on /news."
	values={form?.values ?? { publishedAt: today }}
	errors={form?.errors ?? {}}
/>

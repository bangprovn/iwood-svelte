<script lang="ts">
	import PostForm from '../PostForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	const today = new Date().toISOString().slice(0, 10);
</script>

<header class="adm-header">
	<div>
		<h1>New post</h1>
		<p>Editorial content shown on /news.</p>
	</div>
</header>

<PostForm
	mode="new"
	values={form?.values ?? { publishedAt: today }}
	errors={form?.errors ?? {}}
/>

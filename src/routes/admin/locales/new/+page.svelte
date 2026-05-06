<script lang="ts">
	import LocaleForm from '../LocaleForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<LocaleForm
	mode="new"
	title="New locale"
	subtitle="Adds a language to the public site."
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>

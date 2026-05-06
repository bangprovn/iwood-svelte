<script lang="ts">
	import ShowroomForm from '../ShowroomForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<ShowroomForm
	mode="new"
	title="New showroom"
	subtitle="A physical location."
	values={form?.values ?? {}}
	errors={form?.errors ?? {}}
/>

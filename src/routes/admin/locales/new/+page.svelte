<script lang="ts">
	import LocaleForm from '../LocaleForm.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<header class="adm-header">
	<div>
		<h1>New locale</h1>
		<p>
			Adds a language to the public site. URLs use <code>/{`{code}`}/</code> for non-default locales.
		</p>
	</div>
</header>

<LocaleForm mode="new" values={form?.values ?? {}} errors={form?.errors ?? {}} />

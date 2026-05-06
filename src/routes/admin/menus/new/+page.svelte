<script lang="ts">
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const values = $derived(
		(form?.values ?? {}) as { name?: string; slug?: string; location?: string }
	);
	const errors = $derived((form?.errors ?? {}) as Record<string, string>);
</script>

<FormShell
	title="New menu"
	subtitle="Create a menu container, then add and arrange items on the next page."
	mode="new"
	backHref="/admin/menus"
	backLabel="Menus"
	error={form?.message}
>
	<FormSection title="Identity" description="Names and where this menu shows on the public site.">
		<FormRow>
			<FormField label="Name" required error={errors.name}>
				<input class="adm-input" name="name" value={values.name ?? ''} required />
			</FormField>
			<FormField label="Slug" help="Auto-derived if blank.">
				<input class="adm-input" name="slug" value={values.slug ?? ''} />
			</FormField>
		</FormRow>
		<FormField label="Location" help="A menu can be assigned to a single slot. Only one menu per location.">
			<select class="adm-select" name="location">
				<option value="">— None —</option>
				{#each data.locations as loc (loc)}
					<option value={loc} selected={values.location === loc}>{loc}</option>
				{/each}
			</select>
		</FormField>
	</FormSection>
</FormShell>

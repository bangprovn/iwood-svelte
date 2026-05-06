<script lang="ts">
	import { FormShell, FormSection, FormField, FormRow } from '$lib/components/admin/form';

	type Props = {
		mode: 'new' | 'edit';
		title: string;
		subtitle?: string;
		values?: {
			code?: string;
			label?: string;
			dir?: 'ltr' | 'rtl';
			isActive?: boolean;
			isDefault?: boolean;
			sortOrder?: number;
		};
		errors?: Record<string, string>;
	};
	let { mode, title, subtitle, values = {}, errors = {} }: Props = $props();
</script>

<FormShell {title} {subtitle} {mode} backHref="/admin/locales" backLabel="Locales">
	<FormSection
		title="Locale identity"
		description="Code is used as the URL prefix for non-default locales (e.g. /en/, /vi/)."
	>
		<FormRow>
			<FormField label="Code" required help="BCP-47 form: en, vi, fr, zh-Hans" error={errors.code}>
				<input
					class="adm-input"
					name="code"
					value={values.code ?? ''}
					readonly={mode === 'edit'}
					placeholder="en, vi, fr, zh-Hans"
					required
				/>
			</FormField>
			<FormField
				label="Display label"
				required
				help='Shown to admins (e.g. "English", "Tiếng Việt").'
				error={errors.label}
			>
				<input class="adm-input" name="label" value={values.label ?? ''} required />
			</FormField>
		</FormRow>
	</FormSection>

	{#snippet sidebar()}
		<FormSection title="Behaviour" dense>
			<FormField label="Text direction">
				<select class="adm-select" name="dir">
					<option value="ltr" selected={(values.dir ?? 'ltr') === 'ltr'}>LTR</option>
					<option value="rtl" selected={values.dir === 'rtl'}>RTL</option>
				</select>
			</FormField>
			<FormField label="Sort order">
				<input
					class="adm-input"
					type="number"
					name="sortOrder"
					value={values.sortOrder ?? 0}
				/>
			</FormField>
		</FormSection>

		<FormSection title="Visibility" dense>
			<label class="adm-check">
				<input type="checkbox" name="isActive" checked={values.isActive ?? true} />
				<span>Active on the public site</span>
			</label>
			<label class="adm-check">
				<input type="checkbox" name="isDefault" checked={values.isDefault ?? false} />
				<span>Default locale</span>
			</label>
			<p class="adm-help">Default locale URLs have no prefix and are used as a fallback.</p>
		</FormSection>
	{/snippet}
</FormShell>

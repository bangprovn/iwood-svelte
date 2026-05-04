<script lang="ts">
	type Props = {
		mode: 'new' | 'edit';
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
	let { mode, values = {}, errors = {} }: Props = $props();
</script>

<div class="adm-card">
	<form method="post" class="adm-form">
		<div class="row">
			<div class="adm-field">
				<label>Code *</label>
				<input
					class="adm-input"
					name="code"
					value={values.code ?? ''}
					readonly={mode === 'edit'}
					placeholder="en, vi, fr, zh-Hans"
					required
				/>
				<p class="adm-help">BCP-47 form. Used as the URL prefix for non-default locales.</p>
				{#if errors.code}<p class="adm-help" style="color:var(--danger)">{errors.code}</p>{/if}
			</div>
			<div class="adm-field">
				<label>Label *</label>
				<input class="adm-input" name="label" value={values.label ?? ''} required />
				<p class="adm-help">Display name shown to admins (e.g. "English", "Tiếng Việt").</p>
				{#if errors.label}<p class="adm-help" style="color:var(--danger)">{errors.label}</p>{/if}
			</div>
		</div>

		<div class="row">
			<div class="adm-field">
				<label>Text direction</label>
				<select class="adm-input" name="dir">
					<option value="ltr" selected={(values.dir ?? 'ltr') === 'ltr'}>LTR</option>
					<option value="rtl" selected={values.dir === 'rtl'}>RTL</option>
				</select>
			</div>
			<div class="adm-field">
				<label>Sort order</label>
				<input class="adm-input" type="number" name="sortOrder" value={values.sortOrder ?? 0} />
			</div>
		</div>

		<div class="row">
			<div class="adm-field">
				<label class="adm-check">
					<input type="checkbox" name="isActive" checked={values.isActive ?? true} />
					Active (visible on the public site)
				</label>
			</div>
			<div class="adm-field">
				<label class="adm-check">
					<input type="checkbox" name="isDefault" checked={values.isDefault ?? false} />
					Default locale
				</label>
				<p class="adm-help">Default locale URLs have no prefix and are used as a fallback.</p>
			</div>
		</div>

		<div style="display:flex; gap:10px; margin-top:8px">
			<button type="submit" class="adm-btn primary"
				>{mode === 'new' ? 'Create' : 'Save changes'}</button
			>
			<a href="/admin/locales" class="adm-btn ghost">Cancel</a>
		</div>
	</form>
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Icon from '$lib/components/Icon.svelte';

	type Props = {
		open: boolean;
		title: string;
		subtitle?: string;
		submitLabel?: string;
		cancelLabel?: string;
		action?: string;
		method?: 'post' | 'get';
		size?: 'sm' | 'md' | 'lg';
		busy?: boolean;
		error?: string;
		onClose: () => void;
		onSubmit?: SubmitFunction;
		children: Snippet;
		footer?: Snippet;
		secondaryActions?: Snippet;
	};

	let {
		open,
		title,
		subtitle,
		submitLabel = 'Save',
		cancelLabel = 'Cancel',
		action,
		method = 'post',
		size = 'md',
		busy = false,
		error,
		onClose,
		onSubmit,
		children,
		footer,
		secondaryActions
	}: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleBackdrop(e: MouseEvent) {
		if (e.target === dialogEl) onClose();
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		onClose();
	}
</script>

<dialog
	bind:this={dialogEl}
	class="adm-dialog adm-dialog-{size}"
	onclick={handleBackdrop}
	oncancel={handleCancel}
>
	<form
		{method}
		{action}
		class="adm-dialog-form"
		use:enhance={onSubmit}
	>
		<header class="adm-dialog-head">
			<div class="adm-dialog-titles">
				<h2>{title}</h2>
				{#if subtitle}<p>{subtitle}</p>{/if}
			</div>
			<button
				type="button"
				class="adm-dialog-close"
				aria-label="Close"
				onclick={onClose}
			>
				<Icon name="close" size={18} stroke={2} />
			</button>
		</header>

		{#if error}
			<p class="adm-error adm-dialog-error">{error}</p>
		{/if}

		<div class="adm-dialog-body">
			{@render children()}
		</div>

		<footer class="adm-dialog-foot">
			{#if footer}
				{@render footer()}
			{:else}
				<div class="adm-dialog-foot-side">
					{#if secondaryActions}{@render secondaryActions()}{/if}
				</div>
				<div class="adm-dialog-foot-actions">
					<button
						type="button"
						class="adm-btn ghost"
						onclick={onClose}
						disabled={busy}
					>
						{cancelLabel}
					</button>
					<button type="submit" class="adm-btn primary" disabled={busy}>
						{busy ? 'Working…' : submitLabel}
					</button>
				</div>
			{/if}
		</footer>
	</form>
</dialog>

<style>
	.adm-dialog {
		padding: 0;
		border: none;
		background: transparent;
		width: min(92vw, 560px);
		max-width: none;
		max-height: calc(100vh - 48px);
		margin: auto;

		/* Closed state — applied when dialog is removed from the top layer */
		opacity: 0;
		transform: translateY(12px) scale(0.97);
		transition:
			opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
			transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
			overlay 220ms allow-discrete,
			display 220ms allow-discrete;
	}
	.adm-dialog-sm {
		width: min(92vw, 420px);
	}
	.adm-dialog-lg {
		width: min(94vw, 760px);
	}

	.adm-dialog[open] {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	/* Animate the entry — `[open]` styles applied after this initial frame */
	@starting-style {
		.adm-dialog[open] {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
	}

	.adm-dialog::backdrop {
		background: rgba(15, 15, 16, 0);
		backdrop-filter: blur(0px);
		transition:
			background-color 200ms ease,
			backdrop-filter 200ms ease,
			-webkit-backdrop-filter 200ms ease,
			overlay 200ms allow-discrete,
			display 200ms allow-discrete;
	}
	.adm-dialog[open]::backdrop {
		background: rgba(15, 15, 16, 0.45);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
	}
	@starting-style {
		.adm-dialog[open]::backdrop {
			background: rgba(15, 15, 16, 0);
			backdrop-filter: blur(0px);
			-webkit-backdrop-filter: blur(0px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.adm-dialog,
		.adm-dialog::backdrop {
			transition-duration: 0ms;
		}
	}

	.adm-dialog-form {
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-2);
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 48px);
		overflow: hidden;
	}
	.adm-dialog-body {
		flex: 1 1 auto;
		min-height: 0;
	}

	.adm-dialog-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 18px 20px 12px;
		border-bottom: 1px solid var(--border);
		background: linear-gradient(180deg, var(--bone) 0%, var(--paper) 100%);
		position: relative;
	}
	.adm-dialog-head::before {
		content: '';
		position: absolute;
		top: 0;
		left: 20px;
		width: 32px;
		height: 3px;
		background: var(--accent);
	}
	.adm-dialog-titles {
		min-width: 0;
		padding-top: 6px;
	}
	.adm-dialog-titles h2 {
		font-family: var(--font-display);
		font-weight: var(--fw-bold);
		font-size: 18px;
		text-transform: uppercase;
		letter-spacing: var(--tracking-normal);
		margin: 0;
		color: var(--fg-1);
		line-height: 1.1;
	}
	.adm-dialog-titles p {
		margin: 4px 0 0;
		color: var(--fg-3);
		font-size: var(--fs-xs);
	}
	.adm-dialog-close {
		flex: none;
		display: inline-grid;
		place-items: center;
		width: 30px;
		height: 30px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--fg-3);
		cursor: pointer;
		transition:
			background var(--dur-base) var(--ease-out),
			color var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out);
	}
	.adm-dialog-close:hover {
		background: var(--bone-2);
		color: var(--fg-1);
		border-color: var(--border);
	}

	.adm-dialog-error {
		margin: 14px 20px 0;
	}

	.adm-dialog-body {
		padding: 18px 20px 20px;
		overflow-y: auto;
		display: grid;
		gap: 16px;
		min-height: 0;
	}

	.adm-dialog-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 20px;
		border-top: 1px solid var(--border);
		background: var(--bone);
	}
	.adm-dialog-foot-side {
		display: flex;
		gap: 8px;
		align-items: center;
		min-width: 0;
	}
	.adm-dialog-foot-side:empty {
		display: none;
	}
	.adm-dialog-foot-actions {
		display: flex;
		gap: 8px;
		margin-left: auto;
	}
</style>

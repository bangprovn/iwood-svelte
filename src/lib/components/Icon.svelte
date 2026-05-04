<script lang="ts">
	type Props = {
		name: string;
		size?: number;
		stroke?: number;
		class?: string;
		style?: string;
	};
	let { name, size = 24, stroke = 1.75, class: className = '', style = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={'iwood-icon ' + className}
	{style}
>
	{#if name === 'menu'}
		<line x1="4" y1="6" x2="20" y2="6" />
		<line x1="4" y1="12" x2="20" y2="12" />
		<line x1="4" y1="18" x2="14" y2="18" />
	{:else if name === 'close'}
		<line x1="6" y1="6" x2="18" y2="18" />
		<line x1="18" y1="6" x2="6" y2="18" />
	{:else if name === 'chev'}
		<polyline points="6 9 12 15 18 9" />
	{:else if name === 'chevR'}
		<polyline points="9 6 15 12 9 18" />
	{:else if name === 'chevL'}
		<polyline points="15 18 9 12 15 6" />
	{:else if name === 'arrow'}
		<line x1="5" y1="12" x2="19" y2="12" />
		<polyline points="13 6 19 12 13 18" />
	{:else if name === 'arrowUR'}
		<line x1="7" y1="17" x2="17" y2="7" />
		<polyline points="9 7 17 7 17 15" />
	{:else if name === 'phone'}
		<path
			d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
		/>
	{:else if name === 'mail'}
		<rect x="2" y="4" width="20" height="16" rx="2" />
		<polyline points="2 6 12 13 22 6" />
	{:else if name === 'map'}
		<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
		<circle cx="12" cy="10" r="3" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="7" />
		<line x1="20" y1="20" x2="16.65" y2="16.65" />
	{:else if name === 'cart'}
		<circle cx="9" cy="20" r="1.5" />
		<circle cx="18" cy="20" r="1.5" />
		<path d="M2 3h3l2.4 12.5a2 2 0 0 0 2 1.5h8.7a2 2 0 0 0 2-1.5L22 7H6" />
	{:else if name === 'bag'}
		<path d="M6 7V5a4 4 0 0 1 8 0v2" />
		<rect x="3" y="7" width="14" height="14" rx="1" />
	{:else if name === 'plus'}
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	{:else if name === 'minus'}
		<line x1="5" y1="12" x2="19" y2="12" />
	{:else if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'star'}
		<polygon
			points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
		/>
	{:else if name === 'shield'}
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
	{:else if name === 'award'}
		<circle cx="12" cy="8" r="6" />
		<polyline points="9 13 7 22 12 19 17 22 15 13" />
	{:else if name === 'flame'}
		<path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-1 4 1 5c1 1 2 0 2-2 0-3-3-5-3-7 0-1 1-2 3-2z" />
	{:else if name === 'droplet'}
		<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
	{:else if name === 'leaf'}
		<path d="M11 20A7 7 0 0 1 4 13c0-7 8-11 16-11 0 7-2 16-9 18zm0 0v-7" />
	{:else if name === 'wrench'}
		<path d="M14.7 6.3a4 4 0 0 0 5.7 5.7L21 11l-9 9-3-3 9-9 0.7-0.7z" />
	{:else if name === 'truck'}
		<rect x="1" y="6" width="14" height="11" />
		<polygon points="15 9 19 9 22 12 22 17 15 17" />
		<circle cx="6" cy="19" r="2" />
		<circle cx="18" cy="19" r="2" />
	{:else if name === 'ruler'}
		<path d="M3 21l18-18M7 5l2 2M11 5l3 3M14 8l3 3M5 11l3 3M8 14l3 3" />
	{:else if name === 'layers'}
		<polygon points="12 2 2 7 12 12 22 7 12 2" />
		<polyline points="2 17 12 22 22 17" />
		<polyline points="2 12 12 17 22 12" />
	{:else if name === 'grid'}
		<rect x="3" y="3" width="7" height="7" />
		<rect x="14" y="3" width="7" height="7" />
		<rect x="14" y="14" width="7" height="7" />
		<rect x="3" y="14" width="7" height="7" />
	{:else if name === 'list'}
		<line x1="8" y1="6" x2="21" y2="6" />
		<line x1="8" y1="12" x2="21" y2="12" />
		<line x1="8" y1="18" x2="21" y2="18" />
		<line x1="3" y1="6" x2="3.01" y2="6" />
		<line x1="3" y1="12" x2="3.01" y2="12" />
		<line x1="3" y1="18" x2="3.01" y2="18" />
	{:else if name === 'eye'}
		<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
		<circle cx="12" cy="12" r="3" />
	{:else if name === 'heart'}
		<path
			d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
		/>
	{:else if name === 'play'}
		<polygon points="6 4 20 12 6 20 6 4" />
	{:else if name === 'facebook'}
		<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
	{:else if name === 'youtube'}
		<path
			d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
		/>
	{:else if name === 'instagram'}
		<rect x="2" y="2" width="20" height="20" rx="5" />
		<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
		<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
	{:else if name === 'chat'}
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	{:else if name === 'sliders'}
		<line x1="4" y1="21" x2="4" y2="14" />
		<line x1="4" y1="10" x2="4" y2="3" />
		<line x1="12" y1="21" x2="12" y2="12" />
		<line x1="12" y1="8" x2="12" y2="3" />
		<line x1="20" y1="21" x2="20" y2="16" />
		<line x1="20" y1="12" x2="20" y2="3" />
		<line x1="1" y1="14" x2="7" y2="14" />
		<line x1="9" y1="8" x2="15" y2="8" />
		<line x1="17" y1="16" x2="23" y2="16" />
	{:else if name === 'user'}
		<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
		<circle cx="12" cy="7" r="4" />
	{:else if name === 'calendar'}
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
	{:else if name === 'tag'}
		<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
		<line x1="7" y1="7" x2="7.01" y2="7" />
	{:else if name === 'box'}
		<path
			d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
		/>
		<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
		<line x1="12" y1="22.08" x2="12" y2="12" />
	{:else if name === 'home'}
		<path d="M3 12L12 3l9 9" />
		<path d="M5 10v10h14V10" />
	{:else if name === 'quote'}
		<path d="M3 21V11l9-8 9 8v10h-6v-7H9v7z" />
	{:else if name === 'info'}
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="16" x2="12" y2="12" />
		<line x1="12" y1="8" x2="12.01" y2="8" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="10" />
		<polyline points="12 6 12 12 16 14" />
	{:else if name === 'globe'}
		<circle cx="12" cy="12" r="10" />
		<line x1="2" y1="12" x2="22" y2="12" />
		<path
			d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
		/>
	{:else if name === 'sparkle'}
		<path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6l4 4M5 19l4-4m6-6l4-4" />
	{/if}
</svg>

import type {
	BlockType,
	HeroSettings,
	TextSettings,
	ImageSettings,
	GallerySettings,
	CtaSettings,
	ProductGridSettings,
	CategoryListSettings,
	TestimonialSettings,
	EmbedSettings
} from './types';

export interface BlockDefinition {
	type: BlockType;
	label: string;
	description: string;
	icon: string;
	defaultSettings: Record<string, unknown>;
	defaultContent: Record<string, unknown>;
	contentFields: ContentField[];
	settingsFields: SettingsField[];
}

export interface ContentField {
	key: string;
	label: string;
	type: 'text' | 'textarea' | 'richtext' | 'image' | 'imagelist' | 'select' | 'url';
	options?: { value: string; label: string }[];
	required?: boolean;
	placeholder?: string;
}

export interface SettingsField {
	key: string;
	label: string;
	type: 'text' | 'textarea' | 'image' | 'color' | 'number' | 'select' | 'boolean' | 'url';
	options?: { value: string; label: string }[];
	required?: boolean;
	placeholder?: string;
	min?: number;
	max?: number;
	step?: number;
}

const blocks: Record<BlockType, BlockDefinition> = {
	hero: {
		type: 'hero',
		label: 'Hero',
		description: 'Full-width banner with background image and text',
		icon: 'layout',
		defaultSettings: {
			backgroundImage: '',
			overlayColor: '#000000',
			overlayOpacity: 0.4,
			textAlign: 'center',
			ctaLabel: '',
			ctaHref: '',
			minHeight: '500px',
			fullscreen: false
		} satisfies HeroSettings,
		defaultContent: {
			eyebrow: '',
			heading: '',
			subheading: ''
		},
		contentFields: [
			{ key: 'eyebrow', label: 'Eyebrow text', type: 'text', placeholder: 'Optional label above heading' },
			{ key: 'heading', label: 'Heading', type: 'text', required: true, placeholder: 'Main heading' },
			{ key: 'subheading', label: 'Subheading', type: 'textarea', placeholder: 'Supporting text' }
		],
		settingsFields: [
			{ key: 'backgroundImage', label: 'Background image', type: 'image' },
			{ key: 'overlayColor', label: 'Overlay color', type: 'color' },
			{ key: 'overlayOpacity', label: 'Overlay opacity', type: 'number', min: 0, max: 1, step: 0.1 },
			{ key: 'textAlign', label: 'Text alignment', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
			{ key: 'minHeight', label: 'Min height', type: 'text', placeholder: '500px' },
			{ key: 'fullscreen', label: 'Fullscreen', type: 'boolean' },
			{ key: 'ctaLabel', label: 'Button label', type: 'text', placeholder: 'View Products' },
			{ key: 'ctaHref', label: 'Button link', type: 'url', placeholder: '/products' }
		]
	},
	text: {
		type: 'text',
		label: 'Text',
		description: 'Rich text content block with optional background',
		icon: 'type',
		defaultSettings: {
			backgroundColor: '',
			maxWidth: '720px',
			paddingSize: 'md',
			textAlign: 'left',
			borderRadius: false
		} satisfies TextSettings,
		defaultContent: {
			body: ''
		},
		contentFields: [
			{ key: 'body', label: 'Content', type: 'richtext', required: true }
		],
		settingsFields: [
			{ key: 'backgroundColor', label: 'Background color', type: 'color' },
			{ key: 'maxWidth', label: 'Max width', type: 'text', placeholder: '720px' },
			{ key: 'paddingSize', label: 'Padding', type: 'select', options: [{ value: 'none', label: 'None' }, { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
			{ key: 'textAlign', label: 'Text alignment', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
			{ key: 'borderRadius', label: 'Border radius', type: 'boolean' }
		]
	},
	image: {
		type: 'image',
		label: 'Image',
		description: 'Single image with optional caption and link',
		icon: 'image',
		defaultSettings: {
			imageUrl: '',
			alt: '',
			caption: '',
			width: 'lg',
			align: 'center',
			lazy: true,
			borderRadius: false
		} satisfies ImageSettings,
		defaultContent: {
			caption: ''
		},
		contentFields: [
			{ key: 'caption', label: 'Caption', type: 'text', placeholder: 'Optional image caption' }
		],
		settingsFields: [
			{ key: 'imageUrl', label: 'Image', type: 'image', required: true },
			{ key: 'alt', label: 'Alt text', type: 'text', required: true, placeholder: 'Describe the image' },
			{ key: 'width', label: 'Width', type: 'select', options: [{ value: 'sm', label: 'Small (400px)' }, { value: 'md', label: 'Medium (600px)' }, { value: 'lg', label: 'Large (900px)' }, { value: 'full', label: 'Full width' }] },
			{ key: 'align', label: 'Alignment', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] },
			{ key: 'lazy', label: 'Lazy load', type: 'boolean' },
			{ key: 'borderRadius', label: 'Border radius', type: 'boolean' }
		]
	},
	gallery: {
		type: 'gallery',
		label: 'Gallery',
		description: 'Grid of images with lightbox support',
		icon: 'grid',
		defaultSettings: {
			columns: 3,
			gap: 16,
			lightboxEnabled: true,
			borderRadius: false
		} satisfies GallerySettings,
		defaultContent: {
			images: []
		},
		contentFields: [
			{ key: 'images', label: 'Images', type: 'imagelist', required: true }
		],
		settingsFields: [
			{ key: 'columns', label: 'Columns', type: 'number', min: 2, max: 6 },
			{ key: 'gap', label: 'Gap (px)', type: 'number', min: 0, max: 48 },
			{ key: 'lightboxEnabled', label: 'Enable lightbox', type: 'boolean' },
			{ key: 'borderRadius', label: 'Border radius', type: 'boolean' }
		]
	},
	cta: {
		type: 'cta',
		label: 'Call to Action',
		description: 'Centered CTA section with heading and button',
		icon: 'mouse-pointer-click',
		defaultSettings: {
			backgroundColor: '#e30613',
			backgroundImage: '',
			textColor: '#ffffff',
			buttonStyle: 'solid',
			buttonColor: '#0f0f10',
			paddingSize: 'lg'
		} satisfies CtaSettings,
		defaultContent: {
			heading: '',
			subheading: '',
			buttonLabel: '',
			buttonHref: ''
		},
		contentFields: [
			{ key: 'heading', label: 'Heading', type: 'text', required: true },
			{ key: 'subheading', label: 'Subheading', type: 'textarea' },
			{ key: 'buttonLabel', label: 'Button label', type: 'text', required: true },
			{ key: 'buttonHref', label: 'Button link', type: 'url', required: true }
		],
		settingsFields: [
			{ key: 'backgroundColor', label: 'Background color', type: 'color' },
			{ key: 'backgroundImage', label: 'Background image', type: 'image' },
			{ key: 'textColor', label: 'Text color', type: 'color' },
			{ key: 'buttonStyle', label: 'Button style', type: 'select', options: [{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }] },
			{ key: 'buttonColor', label: 'Button color', type: 'color' },
			{ key: 'paddingSize', label: 'Padding', type: 'select', options: [{ value: 'none', label: 'None' }, { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] }
		]
	},
	product_grid: {
		type: 'product_grid',
		label: 'Product Grid',
		description: 'Displays products from a category in a grid',
		icon: 'box',
		defaultSettings: {
			categoryId: '',
			maxItems: 8,
			columns: 4,
			showPrices: true,
			showAddToQuote: true,
			gapSize: 24
		} satisfies ProductGridSettings,
		defaultContent: {
			title: ''
		},
		contentFields: [
			{ key: 'title', label: 'Section title', type: 'text' }
		],
		settingsFields: [
			{ key: 'categoryId', label: 'Category', type: 'select', options: [] },
			{ key: 'maxItems', label: 'Max items', type: 'number', min: 1, max: 24 },
			{ key: 'columns', label: 'Columns', type: 'number', min: 2, max: 4 },
			{ key: 'showPrices', label: 'Show prices', type: 'boolean' },
			{ key: 'showAddToQuote', label: 'Show Add to Quote', type: 'boolean' },
			{ key: 'gapSize', label: 'Gap (px)', type: 'number', min: 0, max: 48 }
		]
	},
	category_list: {
		type: 'category_list',
		label: 'Category List',
		description: 'Displays categories in grid or list layout',
		icon: 'layers',
		defaultSettings: {
			maxItems: 8,
			style: 'grid',
			showImages: true,
			showDescription: false,
			gapSize: 24
		} satisfies CategoryListSettings,
		defaultContent: {
			title: ''
		},
		contentFields: [
			{ key: 'title', label: 'Section title', type: 'text' }
		],
		settingsFields: [
			{ key: 'maxItems', label: 'Max items', type: 'number', min: 1, max: 24 },
			{ key: 'style', label: 'Style', type: 'select', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
			{ key: 'showImages', label: 'Show images', type: 'boolean' },
			{ key: 'showDescription', label: 'Show description', type: 'boolean' },
			{ key: 'gapSize', label: 'Gap (px)', type: 'number', min: 0, max: 48 }
		]
	},
	testimonial: {
		type: 'testimonial',
		label: 'Testimonial',
		description: 'Customer quote with author info',
		icon: 'quote',
		defaultSettings: {
			backgroundColor: '#f5f5f5',
			textColor: '#0f0f10',
			style: 'card',
			borderColor: '#e30613'
		} satisfies TestimonialSettings,
		defaultContent: {
			quote: '',
			authorName: '',
			authorTitle: '',
			authorImage: ''
		},
		contentFields: [
			{ key: 'quote', label: 'Quote', type: 'textarea', required: true },
			{ key: 'authorName', label: 'Author name', type: 'text', required: true },
			{ key: 'authorTitle', label: 'Author title', type: 'text', placeholder: 'CEO, Company Name' },
			{ key: 'authorImage', label: 'Author photo', type: 'image' }
		],
		settingsFields: [
			{ key: 'backgroundColor', label: 'Background color', type: 'color' },
			{ key: 'textColor', label: 'Text color', type: 'color' },
			{ key: 'style', label: 'Style', type: 'select', options: [{ value: 'card', label: 'Card' }, { value: 'mini', label: 'Mini' }] },
			{ key: 'borderColor', label: 'Accent color', type: 'color' }
		]
	},
	embed: {
		type: 'embed',
		label: 'Embed',
		description: 'YouTube, Vimeo, Google Maps or custom HTML',
		icon: 'code',
		defaultSettings: {
			embedType: 'youtube',
			embedCode: '',
			iframeUrl: '',
			aspectRatio: '16:9'
		} satisfies EmbedSettings,
		defaultContent: {
			caption: ''
		},
		contentFields: [
			{ key: 'caption', label: 'Caption', type: 'text' }
		],
		settingsFields: [
			{ key: 'embedType', label: 'Embed type', type: 'select', options: [{ value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }, { value: 'google_maps', label: 'Google Maps' }, { value: 'custom', label: 'Custom HTML' }] },
			{ key: 'iframeUrl', label: 'URL', type: 'url', placeholder: 'https://www.youtube.com/embed/...' },
			{ key: 'embedCode', label: 'Embed code', type: 'textarea', placeholder: '<iframe>...</iframe>' },
			{ key: 'aspectRatio', label: 'Aspect ratio', type: 'select', options: [{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }, { value: '9:16', label: '9:16 (Vertical)' }] }
		]
	}
};

export function getBlockDefinition(type: BlockType): BlockDefinition {
	return blocks[type];
}

export function getAllBlockDefinitions(): BlockDefinition[] {
	return Object.values(blocks);
}

export function getBlockLabel(type: BlockType): string {
	return blocks[type]?.label ?? type;
}
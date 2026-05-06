export type BlockType =
	| 'hero'
	| 'text'
	| 'image'
	| 'gallery'
	| 'cta'
	| 'product_grid'
	| 'category_list'
	| 'testimonial'
	| 'embed';

export interface HeroContent {
	eyebrow: string;
	heading: string;
	subheading: string;
}

export interface TextContent {
	body: string;
}

export interface ImageContent {
	caption: string;
}

export interface GalleryContent {
	images: string[];
}

export interface CtaContent {
	heading: string;
	subheading: string;
	buttonLabel: string;
	buttonHref: string;
}

export interface ProductGridContent {
	title: string;
}

export interface CategoryListContent {
	title: string;
}

export interface TestimonialContent {
	quote: string;
	authorName: string;
	authorTitle: string;
	authorImage: string;
}

export interface EmbedContent {
	caption: string;
}

export type BlockContent =
	| HeroContent
	| TextContent
	| ImageContent
	| GalleryContent
	| CtaContent
	| ProductGridContent
	| CategoryListContent
	| TestimonialContent
	| EmbedContent;

export interface HeroSettings {
	backgroundImage: string;
	overlayColor: string;
	overlayOpacity: number;
	textAlign: 'left' | 'center' | 'right';
	ctaLabel: string;
	ctaHref: string;
	minHeight: string;
	fullscreen: boolean;
}

export interface TextSettings {
	backgroundColor: string;
	maxWidth: string;
	paddingSize: 'none' | 'sm' | 'md' | 'lg';
	textAlign: 'left' | 'center' | 'right';
	borderRadius: boolean;
}

export interface ImageSettings {
	imageUrl: string;
	alt: string;
	caption: string;
	width: 'sm' | 'md' | 'lg' | 'full';
	align: 'left' | 'center' | 'right';
	lazy: boolean;
	borderRadius: boolean;
}

export interface GallerySettings {
	columns: number;
	gap: number;
	lightboxEnabled: boolean;
	borderRadius: boolean;
}

export interface CtaSettings {
	backgroundColor: string;
	backgroundImage: string;
	textColor: string;
	buttonStyle: 'solid' | 'outline';
	buttonColor: string;
	paddingSize: 'none' | 'sm' | 'md' | 'lg';
}

export interface ProductGridSettings {
	categoryId: string;
	maxItems: number;
	columns: number;
	showPrices: boolean;
	showAddToQuote: boolean;
	gapSize: number;
}

export interface CategoryListSettings {
	maxItems: number;
	style: 'grid' | 'list';
	showImages: boolean;
	showDescription: boolean;
	gapSize: number;
}

export interface TestimonialSettings {
	backgroundColor: string;
	textColor: string;
	style: 'card' | 'mini';
	borderColor: string;
}

export interface EmbedSettings {
	embedType: 'youtube' | 'vimeo' | 'google_maps' | 'custom';
	embedCode: string;
	iframeUrl: string;
	aspectRatio: '16:9' | '4:3' | '1:1' | '9:16';
}

export type BlockSettings =
	| HeroSettings
	| TextSettings
	| ImageSettings
	| GallerySettings
	| CtaSettings
	| ProductGridSettings
	| CategoryListSettings
	| TestimonialSettings
	| EmbedSettings;
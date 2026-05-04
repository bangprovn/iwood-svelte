// Shared DTO shapes — used by both server repos and client components.
// Naming kept short (vi/en/cat/img/loc) to match the legacy fixture shape
// the UI was built against.

export type CategoryDTO = {
	id: string;
	vi: string;
	en: string;
	blurb: string;
	priceFrom: number;
	img: string;
	count: number;
};

export type ProductDTO = {
	id: string;
	code: string;
	vi: string;
	en: string;
	cat: string;
	price: number;
	img: string;
	tag?: string;
	/** Sanitised HTML description (Vietnamese, primary). */
	desc: string;
	/** Sanitised HTML description (English, optional). */
	descEn?: string;
	/** Plain-text projection of `desc` for cards / meta tags. */
	descText: string;
	specs: string[];
};

export type ProjectCategoryDTO = {
	id: string;
	vi: string;
	en: string;
	count: number;
};

export type ProjectDTO = {
	id: string;
	vi: string;
	en: string;
	cat: string;
	year: number;
	area: string;
	loc: string;
	img: string;
	/** Sanitised HTML summary (Vietnamese, primary). */
	summary: string;
	/** Sanitised HTML summary (English, optional). */
	summaryEn?: string;
	/** Plain-text projection of `summary`. */
	summaryText: string;
	products: string[];
};

export type PostDTO = {
	id: string;
	slug: string;
	vi: string;
	en: string;
	cat: string;
	date: string;
	img: string;
	excerpt: string;
	/** Sanitised HTML body (Vietnamese, primary). */
	content?: string;
	/** Sanitised HTML body (English, optional). */
	contentEn?: string;
};

export type ShowroomDTO = {
	id: string;
	city: string;
	addr: string;
	phone: string;
	hours: string;
	img: string;
	mapUrl: string | null;
};

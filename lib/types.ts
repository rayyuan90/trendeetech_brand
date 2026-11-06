export interface Brand {
  name: string;
  slug: string;
  description: string;
  website: string;
  founded: string;
  headquarters: string;
  core_capabilities: string[];
}

export interface ProductSeries {
  slug: string;
  name: string;
  description: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Scenario {
  id: number;
  slug: string;
  name: string;
  description: string;
}

export interface ProductSpecs {
  resolution: string | null;
  connectivity: string;
  environment: string;
  ai_features: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  seriesId: string;
  description: string;
  overview: string;
  features: string[];
  keyFeatures: string[];
  bestFor: string[];
  scenarios: Scenario[];
  specs: ProductSpecs;
  status: 'active' | 'beta' | string;
  faqs: ProductFaq[];
  seo: { title: string; description: string };
}

export interface KnowledgeBase {
  brand: Brand;
  series: ProductSeries[];
  scenarios: Scenario[];
  products: Product[];
}

export interface RawProduct {
  id: number;
  slug: string;
  name: string;
  series_slug: string;
  series_name: string;
  short_description: string;
  overview: string;
  key_features: string[];
  best_for: string[];
  specs: ProductSpecs;
  faq_ids: number[];
  status: string;
  seo?: { title?: string; description?: string };
}

export interface RawFaq {
  id: number;
  product_slug: string;
  question: string;
  answer: string;
}

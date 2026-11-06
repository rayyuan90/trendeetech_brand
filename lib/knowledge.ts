import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Brand, KnowledgeBase, Product, ProductSeries, RawFaq, RawProduct, Scenario } from './types';

const dataDirectory = path.join(process.cwd(), 'data');

async function readData<T>(filename: string): Promise<T> {
  const contents = await readFile(path.join(dataDirectory, filename), 'utf8');
  return JSON.parse(contents) as T;
}

export async function getKnowledge(): Promise<KnowledgeBase> {
  const [brand, series, rawProducts, rawFaqs, scenarios] = await Promise.all([
    readData<Brand>('brand.json'),
    readData<ProductSeries[]>('product_series.json'),
    readData<RawProduct[]>('products.json'),
    readData<RawFaq[]>('faqs.json'),
    readData<Scenario[]>('scenarios.json')
  ]);

  const faqById = new Map(rawFaqs.map(faq => [faq.id, faq]));
  const scenarioByName = new Map(scenarios.map(scenario => [scenario.name.toLowerCase(), scenario]));
  const products: Product[] = rawProducts
    .filter(product => product.status === 'active' || product.status === 'beta')
    .map(product => {
      const relatedScenarios = product.best_for
        .map(name => {
          const normalizedName = name.toLowerCase();
          return scenarioByName.get(normalizedName)
            ?? scenarios.find(scenario => scenario.name.toLowerCase().includes(normalizedName) || normalizedName.includes(scenario.name.toLowerCase()));
        })
        .filter((scenario): scenario is Scenario => Boolean(scenario));

      return {
        id: String(product.id),
        slug: product.slug,
        name: product.name,
        seriesId: product.series_slug,
        description: product.short_description,
        overview: product.overview,
        features: product.key_features,
        keyFeatures: product.key_features,
        bestFor: product.best_for,
        scenarios: relatedScenarios,
        specs: product.specs,
        status: product.status,
        faqs: product.faq_ids.map(id => faqById.get(id)).filter((faq): faq is RawFaq => Boolean(faq)).map(({ question, answer }) => ({ question, answer })),
        seo: {
          title: product.seo?.title ?? `${product.name} | ${brand.name}`,
          description: product.seo?.description ?? product.short_description
        }
      };
    });

  return { brand, series, scenarios, products };
}

export function getPublicUrl(brand: Brand): string {
  return brand.website.replace(/\/$/, '');
}

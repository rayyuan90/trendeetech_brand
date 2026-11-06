import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Product, ProductSeries, RawFaq, RawProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const dataPath = (filename: string) => path.join(process.cwd(), 'data', filename);

async function readData<T>(filename: string): Promise<T> {
  return JSON.parse(await readFile(dataPath(filename), 'utf8')) as T;
}

async function writeData<T>(filename: string, value: T) {
  await writeFile(dataPath(filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function POST(request: Request) {
  const product = await request.json() as Product;
  const [products, faqs, series] = await Promise.all([
    readData<RawProduct[]>('products.json'), readData<RawFaq[]>('faqs.json'), readData<ProductSeries[]>('product_series.json')
  ]);
  if (!product.name?.trim() || !product.slug?.trim() || !series.some(item => item.slug === product.seriesId)) {
    return NextResponse.json({ error: 'A product name, slug, and valid product series are required.' }, { status: 400 });
  }
  if (products.some(item => item.slug === product.slug)) {
    return NextResponse.json({ error: 'A product with that slug already exists.' }, { status: 409 });
  }

  const faqItems = Array.isArray(product.faqs) ? product.faqs : [];
  const nextFaqId = Math.max(0, ...faqs.map(faq => faq.id)) + 1;
  const newFaqs: RawFaq[] = faqItems.map((faq, index) => ({ id: nextFaqId + index, product_slug: product.slug, question: faq.question, answer: faq.answer }));
  const rawProduct: RawProduct = {
    id: Math.max(0, ...products.map(item => item.id)) + 1,
    slug: product.slug,
    name: product.name,
    series_slug: product.seriesId,
    series_name: series.find(item => item.slug === product.seriesId)!.name,
    short_description: product.description,
    overview: product.overview,
    key_features: product.features ?? product.keyFeatures ?? [],
    best_for: product.bestFor ?? [],
    specs: product.specs ?? { resolution: null, connectivity: 'Not specified', environment: 'Not specified', ai_features: [] },
    faq_ids: newFaqs.map(faq => faq.id),
    status: 'active',
    seo: product.seo
  };
  await Promise.all([writeData('products.json', [...products, rawProduct]), writeData('faqs.json', [...faqs, ...newFaqs])]);
  return NextResponse.json(rawProduct, { status: 201 });
}

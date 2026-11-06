import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Product, ProductSeries, RawFaq, RawProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteProps {
  params: Promise<{ id: string }>;
}

const dataPath = (filename: string) => path.join(process.cwd(), 'data', filename);

async function readData<T>(filename: string): Promise<T> {
  return JSON.parse(await readFile(dataPath(filename), 'utf8')) as T;
}

async function writeData<T>(filename: string, value: T) {
  await writeFile(dataPath(filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function PUT(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const product = await request.json() as Product;
  const [products, faqs, series] = await Promise.all([
    readData<RawProduct[]>('products.json'), readData<RawFaq[]>('faqs.json'), readData<ProductSeries[]>('product_series.json')
  ]);
  const index = products.findIndex(item => String(item.id) === id);
  if (index < 0) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  if (!product.name?.trim() || !product.slug?.trim() || !series.some(item => item.slug === product.seriesId)) {
    return NextResponse.json({ error: 'A product name, slug, and valid product series are required.' }, { status: 400 });
  }
  if (products.some((item, itemIndex) => itemIndex !== index && item.slug === product.slug)) {
    return NextResponse.json({ error: 'A product with that slug already exists.' }, { status: 409 });
  }

  const previous = products[index];
  const retainedFaqs = faqs.filter(faq => faq.product_slug !== previous.slug);
  const nextFaqId = Math.max(0, ...faqs.map(faq => faq.id)) + 1;
  const updatedFaqs: RawFaq[] = (product.faqs ?? []).map((faq, faqIndex) => ({ id: nextFaqId + faqIndex, product_slug: product.slug, question: faq.question, answer: faq.answer }));
  const rawProduct: RawProduct = {
    ...previous,
    id: previous.id,
    slug: product.slug,
    name: product.name,
    series_slug: product.seriesId,
    series_name: series.find(item => item.slug === product.seriesId)!.name,
    short_description: product.description,
    overview: product.overview,
    key_features: product.features ?? product.keyFeatures ?? [],
    best_for: product.bestFor ?? [],
    specs: product.specs ?? previous.specs,
    faq_ids: updatedFaqs.map(faq => faq.id),
    status: previous.status,
    seo: product.seo
  };
  const nextProducts = [...products];
  nextProducts[index] = rawProduct;
  await Promise.all([writeData('products.json', nextProducts), writeData('faqs.json', [...retainedFaqs, ...updatedFaqs])]);
  return NextResponse.json(rawProduct);
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const [products, faqs] = await Promise.all([readData<RawProduct[]>('products.json'), readData<RawFaq[]>('faqs.json')]);
  const product = products.find(item => String(item.id) === id);
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  await Promise.all([
    writeData('products.json', products.filter(item => String(item.id) !== id)),
    writeData('faqs.json', faqs.filter(faq => faq.product_slug !== product.slug))
  ]);
  return NextResponse.json({ deleted: id });
}

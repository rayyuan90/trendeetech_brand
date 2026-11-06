import type { MetadataRoute } from 'next';
import { getKnowledge, getPublicUrl } from '@/lib/knowledge';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const knowledge = await getKnowledge();
  const base = getPublicUrl(knowledge.brand);
  return [
    { url: base, lastModified: new Date() },
    ...knowledge.products.map(product => ({ url: `${base}/products/${product.slug}`, lastModified: new Date() }))
  ];
}

import type { MetadataRoute } from 'next';
import { getKnowledge, getPublicUrl } from '@/lib/knowledge';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { brand } = await getKnowledge();
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${getPublicUrl(brand)}/sitemap.xml` };
}

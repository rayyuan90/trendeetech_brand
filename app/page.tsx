import type { Metadata } from 'next';
import { getKnowledge, getPublicUrl } from '@/lib/knowledge';
import KnowledgeTools from '@/components/KnowledgeTools';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getKnowledge();
  const publicUrl = getPublicUrl(brand);
  return {
    title: { absolute: `${brand.name} Product Knowledge Center` },
    description: `${brand.description} Explore product series, features, use cases, and answers to common questions.`,
    alternates: { canonical: publicUrl },
    openGraph: {
      type: 'website',
      siteName: brand.name,
      title: `${brand.name} Product Knowledge Center`,
      description: brand.description,
      url: publicUrl,
      images: [`${publicUrl}/assets/brand-mark.svg`]
    }
  };
}

export default async function HomePage() {
  const knowledge = await getKnowledge();
  const faqCount = knowledge.products.reduce((count, product) => count + product.faqs.length, 0);

  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">{knowledge.brand.name} product knowledge</span>
          <h1>Find the right product<br /><em>for the way you work.</em></h1>
          <p className="hero-copy">{knowledge.brand.description} Explore product series, compare key features, and get straightforward answers grounded in the product knowledge base.</p>
          <div className="hero-stats">
            <span className="stat"><strong>{knowledge.products.length}</strong> product guides</span>
            <span className="stat"><strong>{knowledge.series.length}</strong> product series</span>
            <span className="stat"><strong>{faqCount}</strong> answered questions</span>
          </div>
        </div>
      </section>
      <KnowledgeTools knowledge={knowledge} />
    </main>
  );
}

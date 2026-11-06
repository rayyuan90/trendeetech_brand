import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKnowledge, getPublicUrl } from '@/lib/knowledge';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  const knowledge = await getKnowledge();
  const product = knowledge.products.find(item => item.slug === slug);
  return { knowledge, product };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { knowledge, product } = await getProduct(slug);
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } };
  const canonical = `${getPublicUrl(knowledge.brand)}/products/${product.slug}`;
  return {
    title: { absolute: product.seo.title },
    description: product.seo.description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: knowledge.brand.name,
      title: product.seo.title,
      description: product.seo.description,
      url: canonical,
      images: [`${getPublicUrl(knowledge.brand)}/assets/brand-mark.svg`]
    },
    twitter: { card: 'summary', title: product.seo.title, description: product.seo.description }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { knowledge, product } = await getProduct(slug);
  if (!product) notFound();
  const series = knowledge.series.find(item => item.slug === product.seriesId);
  const canonical = `${getPublicUrl(knowledge.brand)}/products/${product.slug}`;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: knowledge.brand.name },
    category: series?.name,
    url: canonical,
    additionalProperty: Object.entries(product.specs).map(([name, value]) => ({
      '@type': 'PropertyValue', name: name.replaceAll('_', ' '), value: Array.isArray(value) ? value.join(', ') : value ?? 'Not specified'
    }))
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: product.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };

  return (
    <main id="main-content">
      <section className="detail-hero">
        <div className="hero-inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Knowledge center</Link><span>›</span><Link href="/#catalog">Products</Link><span>›</span><span>{product.name}</span>
          </nav>
          <div className="detail-title">
            <div className="detail-icon" aria-hidden="true">◈</div>
            <div><span className="series-badge">{series?.name ?? 'Product'}</span><h1>{product.name}</h1></div>
          </div>
          <p className="detail-copy">{product.description}</p>
        </div>
      </section>
      <div className="detail-layout">
        <article className="detail-main">
          <section id="overview"><h2>Overview</h2><p>{product.overview}</p></section>
          <section id="features"><h2>Features</h2><ul>{product.features.map(feature => <li key={feature}>{feature}</li>)}</ul></section>
          <section id="best-for"><h2>Best for</h2><ul>{product.bestFor.map(scenario => <li key={scenario}>{scenario}</li>)}</ul></section>
          <section id="scenarios"><h2>Scenarios</h2>
            {product.scenarios.length ? <div className="scenario-grid">{product.scenarios.map(scenario => <article className="scenario-card" key={scenario.id}><h3>{scenario.name}</h3><p>{scenario.description}</p></article>)}</div> : <p>See the Best for section for this product’s recommended use cases.</p>}
          </section>
          <section id="specifications"><h2>Specifications</h2><dl className="spec-list">
            <div><dt>Resolution</dt><dd>{product.specs.resolution ?? 'Not specified'}</dd></div>
            <div><dt>Connectivity</dt><dd>{product.specs.connectivity}</dd></div>
            <div><dt>Environment</dt><dd>{product.specs.environment}</dd></div>
            <div><dt>AI features</dt><dd>{product.specs.ai_features.join(', ') || 'Not specified'}</dd></div>
          </dl></section>
          <section id="faq"><h2>Frequently asked questions</h2>
            {product.faqs.map(faq => <details className="faq-item" key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </section>
          <Link className="text-link" href="/#catalog">← Back to all products</Link>
        </article>
        <aside className="detail-sidebar"><h3>On this page</h3><nav aria-label="Product page sections">
          <a href="#overview">Overview</a><a href="#features">Features</a><a href="#best-for">Best for</a><a href="#scenarios">Scenarios</a><a href="#specifications">Specifications</a><a href="#faq">Frequently asked questions</a>
        </nav></aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, faqSchema]).replace(/</g, '\\u003c') }} />
    </main>
  );
}

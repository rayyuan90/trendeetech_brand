'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import type { KnowledgeBase, Product } from '@/lib/types';

interface KnowledgeToolsProps {
  knowledge: KnowledgeBase;
}

type ProductForm = {
  id?: string;
  slug?: string;
  name: string;
  seriesId: string;
  description: string;
  overview: string;
  features: string[];
  keyFeatures: string[];
  bestFor: string[];
  faqs: { question: string; answer: string }[];
  seo: { title: string; description: string };
};

const blankProduct = (seriesId: string): ProductForm => ({
  name: '', seriesId, description: '', overview: '', features: [], keyFeatures: [], bestFor: [], faqs: [], seo: { title: '', description: '' }
});

const termsOf = (question: string) => question.toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
  .filter(word => word.length > 2 && !['what', 'which', 'will', 'with', 'does', 'this', 'that', 'from', 'have', 'your', 'for', 'the', 'and', 'are', 'how', 'can', 'best', 'about', 'product', 'work'].includes(word));

export default function KnowledgeTools({ knowledge }: KnowledgeToolsProps) {
  const [query, setQuery] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; sources: Product[] } | null>(null);
  const [editor, setEditor] = useState<ProductForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return knowledge.products.filter(product => {
      const searchable = [product.name, product.description, ...product.features, ...product.bestFor, ...product.scenarios.map(scenario => `${scenario.name} ${scenario.description}`), JSON.stringify(product.specs), knowledge.series.find(series => series.slug === product.seriesId)?.name].join(' ').toLowerCase();
      return (seriesFilter === 'all' || product.seriesId === seriesFilter) && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [knowledge, query, seriesFilter]);

  function askKnowledgeBase(input = question) {
    const terms = termsOf(input);
    const matches = knowledge.products.map(product => {
      const searchable = [product.name, product.description, product.overview, ...product.features, ...product.bestFor, ...product.scenarios.map(scenario => `${scenario.name} ${scenario.description}`), JSON.stringify(product.specs), ...product.faqs.flatMap(faq => [faq.question, faq.answer])].join(' ').toLowerCase();
      return { product, score: terms.reduce((score, term) => score + Number(searchable.includes(term)), 0) };
    }).filter(result => result.score > 0).sort((left, right) => right.score - left.score).slice(0, 3);

    if (!terms.length || !matches.length) {
      setAnswer({ text: 'I could not find a clear answer in the current product knowledge. Try including a product name, feature, or use case.', sources: [] });
      return;
    }

    const primary = matches[0].product;
    const faqMatch = primary.faqs.find(faq => terms.some(term => `${faq.question} ${faq.answer}`.toLowerCase().includes(term)));
    const scenarioMatch = primary.scenarios.find(scenario => terms.some(term => `${scenario.name} ${scenario.description}`.toLowerCase().includes(term)));
    const featureMatch = primary.features.find(feature => terms.some(term => feature.toLowerCase().includes(term)));
    const text = faqMatch?.answer
      ?? (scenarioMatch ? `${scenarioMatch.name}: ${scenarioMatch.description} ${primary.overview}` : null)
      ?? (featureMatch ? `${featureMatch}. ${primary.overview}` : null)
      ?? `${primary.overview} Key features include ${primary.keyFeatures.join('; ')}.`;
    setAnswer({ text, sources: matches.map(result => result.product) });
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name} from the product knowledge base?`)) return;
    const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.error ?? 'Could not delete product.');
      return;
    }
    window.location.reload();
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    const lines = (field: string) => String(formData.get(field) ?? '').split('\n').map(line => line.trim()).filter(Boolean);
    const name = String(formData.get('name') ?? '').trim();
    const faqs = lines('faqs').map(line => {
      const [faqQuestion, ...faqAnswer] = line.split('|');
      return { question: faqQuestion.trim(), answer: faqAnswer.join('|').trim() };
    }).filter(faq => faq.question && faq.answer);
    const slug = editor.slug ?? name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = {
      ...editor,
      slug,
      name,
      seriesId: String(formData.get('seriesId')),
      description: String(formData.get('description') ?? '').trim(),
      overview: String(formData.get('overview') ?? '').trim(),
      features: lines('features'),
      keyFeatures: lines('keyFeatures'),
      bestFor: lines('bestFor'),
      faqs,
      seo: {
        title: String(formData.get('seoTitle') ?? '').trim() || `${name} | ${knowledge.brand.name}`,
        description: String(formData.get('seoDescription') ?? '').trim() || String(formData.get('description') ?? '').trim()
      }
    };
    const response = await fetch(editor.id ? `/api/products/${encodeURIComponent(editor.id)}` : '/api/products', {
      method: editor.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(result.error ?? 'Could not save product.');
      return;
    }
    window.location.reload();
  }

  function exportKnowledge() {
    const file = new Blob([JSON.stringify(knowledge, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'astervision-knowledge.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <section className="section" id="catalog">
        <div className="section-inner">
          <div className="section-heading">
            <div><span className="eyebrow">Explore the catalog</span><h2>Product guides</h2><p>Browse by series or search product names, features, specifications, and use cases.</p></div>
            <div className="filters">
              <input className="search-field" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products…" aria-label="Search products" />
              <select className="select-field" value={seriesFilter} onChange={event => setSeriesFilter(event.target.value)} aria-label="Filter by product series">
                <option value="all">All series</option>{knowledge.series.map(series => <option key={series.slug} value={series.slug}>{series.name}</option>)}
              </select>
            </div>
          </div>
          <p className="results-note">Showing {visibleProducts.length} of {knowledge.products.length} products</p>
          <div className="product-grid">
            {visibleProducts.map((product, index) => {
              const series = knowledge.series.find(item => item.slug === product.seriesId);
              return <article className="product-card" key={product.id}>
                <div className="card-top"><span className="series-badge">{series?.name ?? 'Product'}</span><span className="card-icon" aria-hidden="true">{['◈', '✳', '⌁', '◉', '✦'][index % 5]}</span></div>
                <h3>{product.name}</h3><p>{product.description}</p>
                <div className="feature-list">{product.keyFeatures.slice(0, 3).map(feature => <span className="feature-chip" key={feature}>{feature}</span>)}</div>
                <Link className="card-link" href={`/products/${product.slug}`}><span>View product guide</span><span aria-hidden="true">↗</span></Link>
              </article>;
            })}
            {!visibleProducts.length && <div className="empty-state">No products match those filters. Try another search or series.</div>}
          </div>
        </div>
      </section>

      <section className="section content-band" id="series">
        <div className="section-inner"><div className="section-heading"><div><span className="eyebrow">Browse by collection</span><h2>Product series</h2><p>Explore the collections and the products grouped in each one.</p></div></div>
          <div className="series-grid">{knowledge.series.map(series => <article className="series-card" key={series.slug}><h3>{series.name}</h3><p>{series.description}</p><button className="text-link filter-link" type="button" onClick={() => { setSeriesFilter(series.slug); document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore {series.name} →</button></article>)}</div>
        </div>
      </section>

      <section className="section ask-section" id="ask">
        <div className="section-inner"><div className="section-heading"><div><span className="eyebrow">Knowledge assistant</span><h2>Ask AI about products</h2><p>Rule-based answers use product descriptions, features, scenarios, specifications, and FAQs from this knowledge base.</p></div></div>
          <div className="ask-box"><p className="ask-intro">Try asking which products suit a warehouse, which devices have thermal imaging, or what a product’s AI features support.</p>
            <form className="ask-form" onSubmit={event => { event.preventDefault(); askKnowledgeBase(); }}><input className="search-field" type="search" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask a product question…" aria-label="Ask a product question" required /><button type="submit">Ask the knowledge base ↗</button></form>
            <div className="suggestions"><button className="suggestion" type="button" onClick={() => { setQuestion('Which products are suited for warehouse monitoring?'); askKnowledgeBase('Which products are suited for warehouse monitoring?'); }}>Warehouse monitoring</button><button className="suggestion" type="button" onClick={() => { setQuestion('Which products have thermal imaging?'); askKnowledgeBase('Which products have thermal imaging?'); }}>Thermal imaging</button><button className="suggestion" type="button" onClick={() => { setQuestion('Which products support multi-site deployment?'); askKnowledgeBase('Which products support multi-site deployment?'); }}>Multi-site deployment</button></div>
            {answer && <div className="answer-box" aria-live="polite"><h3>Knowledge base answer</h3><p>{answer.text}</p>{answer.sources.length > 0 && <div className="answer-sources"><strong>Sources:</strong>{answer.sources.map(product => <Link key={product.id} href={`/products/${product.slug}`}>{product.name} guide</Link>)}</div>}<p className="form-note">This rule-based assistant uses the current product knowledge and may not answer questions outside the product guides.</p></div>}
          </div>
        </div>
      </section>

      <section className="section manage-section" id="manage">
        <div className="section-inner"><div className="section-heading"><div><span className="eyebrow">Content management</span><h2>Manage product knowledge</h2><p>Add and edit products; updates are written to the product and FAQ JSON files.</p></div></div>
          <div className="manage-panel">
            <div className="manage-top"><div><h3>Product records</h3><p>{knowledge.products.length} products · {knowledge.series.length} series</p></div><div className="manage-actions"><button className="secondary-button" type="button" onClick={exportKnowledge}>Export JSON</button><button className="primary-button" type="button" onClick={() => setEditor(blankProduct(knowledge.series[0]?.slug ?? ''))}>＋ Add product</button></div></div>
            <div className="table-wrap"><table className="product-table"><thead><tr><th>Product</th><th>Series</th><th>Key features</th><th>Actions</th></tr></thead><tbody>{knowledge.products.map(product => <tr key={product.id}><td><strong>{product.name}</strong><br /><span className="form-note">/{product.slug}</span></td><td>{knowledge.series.find(series => series.slug === product.seriesId)?.name}</td><td>{product.keyFeatures.join(' · ')}</td><td><div className="row-actions"><button type="button" onClick={() => setEditor({ id: product.id, slug: product.slug, name: product.name, seriesId: product.seriesId, description: product.description, overview: product.overview, features: product.features, keyFeatures: product.keyFeatures, bestFor: product.bestFor, faqs: product.faqs, seo: product.seo })}>Edit</button><button type="button" onClick={() => deleteProduct(product)}>Delete</button></div></td></tr>)}</tbody></table></div>
            {notice && <p className="notice" role="status">{notice}</p>}
            <p className="form-note">The local content editor has no authentication. Add access control before exposing it on a public deployment.</p>
          </div>
        </div>
      </section>

      {editor && <div className="form-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setEditor(null); }}>
        <section className="form-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title"><h2 id="editor-title">{editor.id ? 'Edit product' : 'Add product'}</h2>
          <form className="product-form" onSubmit={submitProduct}>
            <div className="form-group"><label htmlFor="form-name">Product name</label><input className="field" id="form-name" name="name" defaultValue={editor.name} required /></div>
            <div className="form-group"><label htmlFor="form-series">Product series</label><select className="field" id="form-series" name="seriesId" defaultValue={editor.seriesId} required>{knowledge.series.map(series => <option key={series.slug} value={series.slug}>{series.name}</option>)}</select></div>
            <div className="form-group full"><label htmlFor="form-description">Description</label><textarea id="form-description" name="description" defaultValue={editor.description} required /></div>
            <div className="form-group full"><label htmlFor="form-overview">Overview</label><textarea id="form-overview" name="overview" defaultValue={editor.overview} required /></div>
            <div className="form-group"><label htmlFor="form-features">Features (one per line)</label><textarea id="form-features" name="features" defaultValue={editor.features.join('\n')} /></div>
            <div className="form-group"><label htmlFor="form-key-features">Key features (one per line)</label><textarea id="form-key-features" name="keyFeatures" defaultValue={editor.keyFeatures.join('\n')} /></div>
            <div className="form-group"><label htmlFor="form-best-for">Best for (one per line)</label><textarea id="form-best-for" name="bestFor" defaultValue={editor.bestFor.join('\n')} /></div>
            <div className="form-group"><label htmlFor="form-faqs">FAQs: question | answer (one per line)</label><textarea id="form-faqs" name="faqs" defaultValue={editor.faqs.map(faq => `${faq.question} | ${faq.answer}`).join('\n')} /></div>
            <div className="form-group full"><label htmlFor="form-seo-title">SEO title</label><input className="field" id="form-seo-title" name="seoTitle" defaultValue={editor.seo.title} /></div>
            <div className="form-group full"><label htmlFor="form-seo-description">Meta description</label><textarea id="form-seo-description" name="seoDescription" defaultValue={editor.seo.description} /></div>
            <div className="form-group full"><div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setEditor(null)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button></div></div>
          </form>
        </section>
      </div>}
    </>
  );
}

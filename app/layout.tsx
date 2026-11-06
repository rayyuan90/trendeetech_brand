import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getKnowledge, getPublicUrl } from '@/lib/knowledge';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getKnowledge();
  const publicUrl = getPublicUrl(brand);
  return {
    metadataBase: new URL(publicUrl),
    title: { default: `${brand.name} Product Knowledge Center`, template: `%s | ${brand.name}` },
    description: brand.description,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: brand.name,
      title: `${brand.name} Product Knowledge Center`,
      description: brand.description,
      url: publicUrl,
      images: ['/assets/brand-mark.svg']
    },
    twitter: { card: 'summary', title: `${brand.name} Product Knowledge Center`, description: brand.description },
    robots: { index: true, follow: true }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { brand } = await getKnowledge();
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: getPublicUrl(brand),
    logo: `${getPublicUrl(brand)}/assets/brand-mark.svg`,
    description: brand.description,
    foundingDate: brand.founded,
    address: { '@type': 'PostalAddress', addressLocality: brand.headquarters },
    knowsAbout: brand.core_capabilities
  };

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label={`${brand.name} knowledge center home`}>
            <Image src="/assets/brand-mark.svg" alt="" width={38} height={38} priority />
            <span>{brand.name}<span className="brand-subtitle">KNOWLEDGE CENTER</span></span>
          </Link>
          <nav className="top-nav" aria-label="Main navigation">
            <Link href="/#catalog">Explore products</Link>
            <Link href="/#ask">Ask AI</Link>
            <Link href="/#manage">Manage content</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="footer-inner">
            <Link className="brand footer-brand" href="/">
              <Image src="/assets/brand-mark.svg" alt="" width={32} height={32} />
              <span>{brand.name}<span className="brand-subtitle">KNOWLEDGE CENTER</span></span>
            </Link>
            <p>{brand.description}</p>
            <span>Product information is provided for general guidance. Check official product information for current specifications.</span>
          </div>
        </footer>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  );
}

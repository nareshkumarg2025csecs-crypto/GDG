import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'event';
  noindex?: boolean;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Google Developer Groups on Campus | REC';
const DEFAULT_DESCRIPTION =
  'Official website for Google Developer Groups on Campus at Rajalakshmi Engineering College (REC). Discover upcoming workshops, hackathons, speaker sessions, and tech resources.';
const DEFAULT_IMAGE = 'https://www.gdgrec.dev/favicon.png';
const SITE_NAME = 'Google Developer Groups On Campus - REC';
const BASE_URL = 'https://www.gdgrec.dev';

const DEFAULT_KEYWORDS = [
  'gdgrec',
  'gdg rec',
  'gdg on campus rec',
  'GDG Rajalakshmi Engineering College',
  'Google Developer Groups on Campus REC',
  'GDG Chennai',
  'rec developer club',
  'student developers'
];

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  schema,
}) => {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title
      ? title.toLowerCase().includes('gdg') || title.toLowerCase().includes('google developer')
        ? title
        : `${title} | GDG on Campus REC`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to update or create <meta> tags
    const setMetaTag = (attribute: 'name' | 'property', key: string, value: string | undefined) => {
      if (!value) return;
      let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Helper to update or create <link rel="..."> tags
    const setLinkTag = (rel: string, href: string | undefined) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta Description
    setMetaTag('name', 'description', description);

    // 3. Keywords (with robust defaults)
    const keywordStr = keywords
      ? (Array.isArray(keywords) ? keywords.join(', ') : keywords)
      : DEFAULT_KEYWORDS.join(', ');
    setMetaTag('name', 'keywords', keywordStr);

    // 4. Canonical URL (Cleans transient query parameters, enforces canonical hostname)
    const cleanPath = typeof window !== 'undefined'
      ? (window.location.pathname.replace(/\/+$/, '') || '/')
      : '/';
    const canonicalUrl = canonical || `${BASE_URL}${cleanPath === '/' ? '/' : cleanPath}`;
    setLinkTag('canonical', canonicalUrl);

    // 5. Open Graph Meta Tags (Facebook, WhatsApp, LinkedIn, Discord)
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', image);

    // 6. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', '@GoogleDevGroups');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 7. Robots Meta Tag
    setMetaTag(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 8. Dynamic JSON-LD Structured Data for AI & Search Engines
    const schemaScriptId = 'dynamic-seo-schema';
    let scriptEl = document.getElementById(schemaScriptId) as HTMLScriptElement | null;

    if (schema) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = schemaScriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up dynamic schema when unmounting page
      const currentSchema = document.getElementById(schemaScriptId);
      if (currentSchema) {
        currentSchema.remove();
      }
    };
  }, [title, description, keywords, canonical, image, type, noindex, schema]);

  return null;
};

export default SEO;

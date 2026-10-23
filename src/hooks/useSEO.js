import { useEffect } from 'react';

/**
 * useSEO - Sets document title, meta tags, Open Graph, Twitter Card,
 * canonical URL, and optional JSON-LD structured data.
 * No emojis in SEO content. Human-friendly, non-AI-sounding copy.
 */
const useSEO = ({
    title,
    description,
    keywords,
    canonical,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    noIndex = false,
    structuredData = null,
}) => {
    useEffect(() => {
        const siteBase = 'https://www.velouraz.in';
        const fullTitle = title
            ? `${title} | Velouraz`
            : 'Velouraz - Globally Curated Jewellery for the Modern Woman';

        // Title
        document.title = fullTitle;

        const setMeta = (name, content, attr = 'name') => {
            if (!content) return;
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        const setLink = (rel, href) => {
            if (!href) return;
            let el = document.querySelector(`link[rel="${rel}"]`);
            if (!el) {
                el = document.createElement('link');
                el.setAttribute('rel', rel);
                document.head.appendChild(el);
            }
            el.setAttribute('href', href);
        };

        // Core meta
        setMeta('description', description);
        setMeta('keywords', keywords);
        setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
        setMeta('author', 'Velouraz');

        // Canonical
        const canonicalUrl = canonical ? `${siteBase}${canonical}` : siteBase;
        setLink('canonical', canonicalUrl);

        // Open Graph
        setMeta('og:type', ogType, 'property');
        setMeta('og:title', fullTitle, 'property');
        setMeta('og:description', description, 'property');
        setMeta('og:url', canonicalUrl, 'property');
        setMeta('og:site_name', 'Velouraz', 'property');
        setMeta('og:locale', 'en_IN', 'property');
        const ogImg = ogImage || `${siteBase}/img/logo.png`;
        setMeta('og:image', ogImg, 'property');
        setMeta('og:image:width', '1200', 'property');
        setMeta('og:image:height', '630', 'property');
        setMeta('og:image:alt', fullTitle, 'property');

        // Twitter
        setMeta('twitter:card', twitterCard);
        setMeta('twitter:title', fullTitle);
        setMeta('twitter:description', description);
        setMeta('twitter:image', ogImg);
        setMeta('twitter:site', '@velouraz');

        // Structured Data (JSON-LD)
        const existingScript = document.getElementById('structured-data-seo');
        if (existingScript) existingScript.remove();

        if (structuredData) {
            const script = document.createElement('script');
            script.id = 'structured-data-seo';
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);
        }

        return () => {
            const script = document.getElementById('structured-data-seo');
            if (script) script.remove();
        };
    }, [title, description, keywords, canonical, ogImage, ogType, twitterCard, noIndex, structuredData]);
};

export default useSEO;

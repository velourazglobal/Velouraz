/**
 * Dynamic Sitemap Generator — Vercel Serverless Function
 * Route: /sitemap.xml
 *
 * How it works:
 *  - Fires on every Google bot crawl request
 *  - Fetches all PUBLISHED products from Firestore via REST API (no Admin SDK needed)
 *  - Fetches all blog posts from Firestore via REST API
 *  - Returns a fresh, fully SEO-compliant sitemap.xml in real-time
 *  - Vercel caches the response for 1 hour (s-maxage=3600), so it's fast and cost-efficient
 *
 * Required env vars: VITE_FIREBASE_PROJECT_ID, VITE_SITE_URL
 */

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.velouraz.in';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

if (!FIREBASE_PROJECT_ID) {
    console.error('[Velouraz Sitemap] VITE_FIREBASE_PROJECT_ID is not set in environment variables.');
}

const FIRESTORE_BASE = FIREBASE_PROJECT_ID
    ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`
    : null;


// Static pages with their SEO priority and update frequency
const STATIC_PAGES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/shop', changefreq: 'daily', priority: '0.9' },
    { path: '/shop?category=Earrings', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?category=Bangles', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?category=Rings', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?category=Necklace', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?category=Bracelet', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?category=Bridal+Wear', changefreq: 'weekly', priority: '0.8' },
    { path: '/shop?country=India', changefreq: 'weekly', priority: '0.7' },
    { path: '/shop?country=Paris', changefreq: 'weekly', priority: '0.7' },
    { path: '/shop?country=Thailand', changefreq: 'weekly', priority: '0.7' },
    { path: '/shop?country=Japan', changefreq: 'weekly', priority: '0.7' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'weekly', priority: '0.7' },
    { path: '/gallery', changefreq: 'weekly', priority: '0.6' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.4' },
    { path: '/return-policy', changefreq: 'yearly', priority: '0.4' },
    { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.4' },
];

/**
 * Fetches a Firestore collection via REST API
 * Returns array of document objects with id + flattened fields
 */
async function fetchFirestoreCollection(collectionName) {
    if (!FIRESTORE_BASE) {
        console.warn(`[Velouraz Sitemap] Skipping ${collectionName} fetch — VITE_FIREBASE_PROJECT_ID is not set.`);
        return [];
    }
    try {
        const url = `${FIRESTORE_BASE}/${collectionName}?pageSize=300`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000), // 8s timeout
        });

        if (!response.ok) {
            console.warn(`Firestore fetch failed for ${collectionName}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const documents = data.documents || [];

        return documents.map((doc) => {
            const id = doc.name.split('/').pop();
            const fields = doc.fields || {};

            // Flatten Firestore typed values
            const flatten = (fieldObj) => {
                if (!fieldObj) return null;
                if ('stringValue' in fieldObj) return fieldObj.stringValue;
                if ('integerValue' in fieldObj) return Number(fieldObj.integerValue);
                if ('doubleValue' in fieldObj) return Number(fieldObj.doubleValue);
                if ('booleanValue' in fieldObj) return fieldObj.booleanValue;
                if ('timestampValue' in fieldObj) return fieldObj.timestampValue;
                if ('nullValue' in fieldObj) return null;
                if ('arrayValue' in fieldObj) return (fieldObj.arrayValue.values || []).map(flatten);
                if ('mapValue' in fieldObj) {
                    const result = {};
                    for (const [k, v] of Object.entries(fieldObj.mapValue.fields || {})) {
                        result[k] = flatten(v);
                    }
                    return result;
                }
                return null;
            };

            const flatFields = {};
            for (const [key, val] of Object.entries(fields)) {
                flatFields[key] = flatten(val);
            }

            return { id, ...flatFields };
        });
    } catch (err) {
        console.warn(`Error fetching ${collectionName}:`, err.message);
        return [];
    }
}

/**
 * Converts a Firestore timestamp to ISO date string (YYYY-MM-DD)
 */
function toISODate(timestamp) {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    try {
        return new Date(timestamp).toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Escapes XML special characters in strings
 */
function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Builds a single <url> XML element
 */
function buildUrlEntry({ loc, lastmod, changefreq, priority, imageUrl, imageTitle }) {
    const today = new Date().toISOString().split('T')[0];
    let xml = `  <url>\n`;
    xml += `    <loc>${escapeXML(loc)}</loc>\n`;
    xml += `    <lastmod>${lastmod || today}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;

    // Add image sitemap tags for product pages (helps Google Image Search)
    if (imageUrl) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXML(imageUrl)}</image:loc>\n`;
        if (imageTitle) {
            xml += `      <image:title>${escapeXML(imageTitle)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
    return xml;
}

export default async function handler(req, res) {
    // Fetch products and blogs in parallel for performance
    const [products, blogs] = await Promise.all([
        fetchFirestoreCollection('products'),
        fetchFirestoreCollection('blogs'),
    ]);

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

    // ─── Static Pages ──────────────────────────────────────────────
    xml += `  <!-- ═══ STATIC PAGES ═══ -->\n`;
    for (const page of STATIC_PAGES) {
        xml += buildUrlEntry({
            loc: `${SITE_URL}${page.path}`,
            lastmod: today,
            changefreq: page.changefreq,
            priority: page.priority,
        });
    }

    // ─── Dynamic Product Pages ─────────────────────────────────────
    const publishedProducts = products.filter((p) => {
        const status = (p.status || '').toLowerCase();
        // Include if status is Published, Active, or not set (visible by default)
        return !status || status === 'published' || status === 'active' || status === 'public';
    });

    if (publishedProducts.length > 0) {
        xml += `\n  <!-- ═══ PRODUCT PAGES (${publishedProducts.length} products) ═══ -->\n`;

        for (const product of publishedProducts) {
            const productUrl = `${SITE_URL}/product/${product.id}`;
            const lastmod = toISODate(product.updatedAt || product.createdAt);

            // Get best image URL for image sitemap
            let imageUrl = product.primaryImage || product.image || null;
            if (!imageUrl && Array.isArray(product.images) && product.images.length > 0) {
                imageUrl = product.images[0];
            }

            // Build descriptive title for image alt
            const imageTitle = product.name
                ? `${product.name} - ${product.category || 'Jewellery'} by Velouraz`
                : 'Velouraz Jewellery';

            // Priority based on stock and category
            const inStock = Number(product.stock || 0) > 0;
            const productPriority = inStock ? '0.85' : '0.6';

            xml += buildUrlEntry({
                loc: productUrl,
                lastmod,
                changefreq: 'weekly',
                priority: productPriority,
                imageUrl: imageUrl || undefined,
                imageTitle,
            });
        }
    }

    // ─── Dynamic Blog Pages ────────────────────────────────────────
    const publishedBlogs = blogs.filter((b) => {
        const status = (b.status || '').toLowerCase();
        return !status || status === 'published' || status === 'active';
    });

    if (publishedBlogs.length > 0) {
        xml += `\n  <!-- ═══ BLOG POSTS (${publishedBlogs.length} posts) ═══ -->\n`;

        for (const blog of publishedBlogs) {
            const blogUrl = `${SITE_URL}/blog/${blog.id}`;
            const lastmod = toISODate(blog.updatedAt || blog.createdAt);

            xml += buildUrlEntry({
                loc: blogUrl,
                lastmod,
                changefreq: 'monthly',
                priority: '0.65',
                imageUrl: blog.image || blog.coverImage || undefined,
                imageTitle: blog.title || 'Velouraz Journal Article',
            });
        }
    }

    xml += `\n</urlset>`;

    // Cache for 1 hour on Vercel CDN (stale-while-revalidate: serve stale, update in background)
    // This means Google gets a fast response, and it refreshes every hour automatically
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Sitemap-Products', String(publishedProducts.length));
    res.setHeader('X-Sitemap-Blogs', String(publishedBlogs.length));
    res.setHeader('X-Sitemap-Generated', new Date().toUTCString());

    return res.status(200).send(xml);
}

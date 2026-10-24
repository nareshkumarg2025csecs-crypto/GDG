import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const tests = [
  {
    name: '1. Robots.txt configuration and crawler safety',
    fn: () => {
      const robotsPath = path.join(ROOT_DIR, 'public', 'robots.txt');
      assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
      const content = fs.readFileSync(robotsPath, 'utf8');
      assert.match(content, /User-agent:\s*\*/i);
      assert.match(content, /Disallow:\s*\/admin/i);
      assert.match(content, /Disallow:\s*\/dashboard/i);
      assert.match(content, /Disallow:\s*\/profile/i);
      assert.match(content, /Disallow:\s*\/api/i);
      assert.match(content, /Sitemap:\s*https:\/\/www\.gdgrec\.dev\/sitemap\.xml/);
    }
  },
  {
    name: '2. Sitemap.xml validity and canonical route coverage',
    fn: () => {
      const sitemapPath = path.join(ROOT_DIR, 'public', 'sitemap.xml');
      assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      assert.match(content, /<\?xml\s+version="1\.0"/);
      assert.match(content, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
      const locRegex = /<loc>(.*?)<\/loc>/g;
      const urls = [];
      let match;
      while ((match = locRegex.exec(content)) !== null) {
        urls.push(match[1]);
      }
      assert.ok(urls.length >= 6);
      for (const url of urls) {
        assert.ok(url.startsWith('https://www.gdgrec.dev'));
      }
      assert.ok(urls.includes('https://www.gdgrec.dev/'));
      assert.ok(urls.includes('https://www.gdgrec.dev/events'));
      assert.ok(urls.includes('https://www.gdgrec.dev/team'));
      assert.ok(urls.includes('https://www.gdgrec.dev/about-us'));
      assert.ok(urls.includes('https://www.gdgrec.dev/resources'));
      assert.ok(urls.includes('https://www.gdgrec.dev/tools'));
    }
  },
  {
    name: '3. Single Visible Primary H1 Heading per Public Route',
    fn: () => {
      // HeroSection
      const heroPath = path.join(ROOT_DIR, 'src', 'components', 'HeroSection.tsx');
      const heroContent = fs.readFileSync(heroPath, 'utf8');
      assert.ok(!heroContent.includes('sr-only">Google Developer Groups</h1>'), 'HeroSection must not have duplicate hidden sr-only H1');
      const heroH1Matches = heroContent.match(/<h1[\s>]/g) || [];
      assert.equal(heroH1Matches.length, 1, `HeroSection must have 1 h1, found ${heroH1Matches.length}`);
      assert.match(heroContent, /aria-label="Google Developer Groups On Campus — REC"/);

      // EventsHero
      const eventsHeroPath = path.join(ROOT_DIR, 'src', 'components', 'events', 'EventsHero.tsx');
      const eventsHeroContent = fs.readFileSync(eventsHeroPath, 'utf8');
      const eventsH1Matches = eventsHeroContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(eventsH1Matches.length, 1, `EventsHero must have 1 h1, found ${eventsH1Matches.length}`);

      // ToolsHero
      const toolsHeroPath = path.join(ROOT_DIR, 'src', 'components', 'tools', 'ToolsHero.tsx');
      const toolsHeroContent = fs.readFileSync(toolsHeroPath, 'utf8');
      const toolsH1Matches = toolsHeroContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(toolsH1Matches.length, 1, `ToolsHero must have 1 h1, found ${toolsH1Matches.length}`);

      // ResourcesHero
      const resourcesHeroPath = path.join(ROOT_DIR, 'src', 'components', 'resources', 'ResourcesHero.tsx');
      const resourcesHeroContent = fs.readFileSync(resourcesHeroPath, 'utf8');
      const resourcesH1Matches = resourcesHeroContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(resourcesH1Matches.length, 1, `ResourcesHero must have 1 h1, found ${resourcesH1Matches.length}`);

      // AboutUsPage
      const aboutPath = path.join(ROOT_DIR, 'src', 'pages', 'AboutUsPage.tsx');
      const aboutContent = fs.readFileSync(aboutPath, 'utf8');
      const aboutH1Matches = aboutContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(aboutH1Matches.length, 1, `AboutUsPage must have 1 h1, found ${aboutH1Matches.length}`);

      // TeamPage
      const teamPath = path.join(ROOT_DIR, 'src', 'pages', 'TeamPage.tsx');
      const teamContent = fs.readFileSync(teamPath, 'utf8');
      const teamH1Matches = teamContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(teamH1Matches.length, 1, `TeamPage must have 1 h1, found ${teamH1Matches.length}`);

      // NotFound
      const notFoundPath = path.join(ROOT_DIR, 'src', 'pages', 'NotFound.tsx');
      const notFoundContent = fs.readFileSync(notFoundPath, 'utf8');
      const notFoundH1Matches = notFoundContent.match(/<(?:motion\.)?h1[\s>]/g) || [];
      assert.equal(notFoundH1Matches.length, 1, `NotFound must have 1 h1, found ${notFoundH1Matches.length}`);
    }
  },
  {
    name: '4. SEO component and canonical URL sanitization',
    fn: () => {
      const seoPath = path.join(ROOT_DIR, 'src', 'components', 'common', 'SEO.tsx');
      assert.ok(fs.existsSync(seoPath), 'SEO.tsx must exist');
      const content = fs.readFileSync(seoPath, 'utf8');
      assert.match(content, /https:\/\/www\.gdgrec\.dev/);
      assert.match(content, /window\.location\.pathname/);
      assert.match(content, /schema/);
      assert.match(content, /og:title/);
      assert.match(content, /og:description/);
      assert.match(content, /og:url/);
      assert.match(content, /twitter:card/);
    }
  },
  {
    name: '5. Bot bypass and search engine crawlability in Preloader',
    fn: () => {
      const preloaderPath = path.join(ROOT_DIR, 'src', 'components', 'Preloader.tsx');
      assert.ok(fs.existsSync(preloaderPath), 'Preloader.tsx must exist');
      const content = fs.readFileSync(preloaderPath, 'utf8');
      assert.match(content, /googlebot|crawler|spider|lighthouse/i);
      assert.match(content, /isBot/);
      assert.match(content, /prefers-reduced-motion/);
    }
  },
  {
    name: '6. Vercel deployment configuration and cache headers',
    fn: () => {
      const vercelPath = path.join(ROOT_DIR, 'vercel.json');
      assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      assert.equal(vercelConfig.outputDirectory, 'dist');
      const globalHeaderGroup = vercelConfig.headers.find(h => h.source === '/(.*)');
      assert.ok(globalHeaderGroup);
      const cspHeader = globalHeaderGroup.headers.find(h => h.key === 'Content-Security-Policy');
      assert.ok(cspHeader);
      assert.match(cspHeader.value, /https:\/\/api\.gdgrec\.dev/);
      const htmlHeaderGroup = vercelConfig.headers.find(h => h.source.includes('index\\.html'));
      assert.ok(htmlHeaderGroup);
      const seoHeaderGroup = vercelConfig.headers.find(h => h.source.includes('robots') && h.source.includes('sitemap'));
      assert.ok(seoHeaderGroup);
    }
  },
  {
    name: '7. Google Search Official Site Name & WebSite Schema Validation',
    fn: () => {
      const indexPath = path.join(ROOT_DIR, 'index.html');
      assert.ok(fs.existsSync(indexPath), 'index.html must exist');
      const htmlContent = fs.readFileSync(indexPath, 'utf8');

      // 1. Verify Meta tags
      assert.match(htmlContent, /<meta\s+property="og:site_name"\s+content="GDG on Campus REC"\s*\/>/);
      assert.match(htmlContent, /<meta\s+name="application-name"\s+content="GDG on Campus REC"\s*\/>/);

      // 2. Extract and parse JSON-LD
      const jsonLdMatch = htmlContent.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLdMatch, 'index.html must contain JSON-LD script block');
      
      const parsed = JSON.parse(jsonLdMatch[1]);
      assert.equal(parsed['@context'], 'https://schema.org');
      assert.ok(Array.isArray(parsed['@graph']), '@graph must be an array');

      const websiteNode = parsed['@graph'].find(node => node['@type'] === 'WebSite');
      assert.ok(websiteNode, 'WebSite schema node must be present');
      assert.equal(websiteNode.name, 'GDG on Campus REC', 'WebSite name must match brand');
      assert.equal(websiteNode.url, 'https://www.gdgrec.dev/', 'WebSite url must be canonical root');
      assert.ok(Array.isArray(websiteNode.alternateName), 'alternateName must be an array');
      assert.ok(websiteNode.alternateName.includes('GDG REC'));
      assert.ok(websiteNode.keywords, 'keywords must be present');

      const orgNode = parsed['@graph'].find(node => node['@type'] === 'Organization');
      assert.ok(orgNode, 'Organization schema node must be present');
      assert.equal(orgNode.name, 'Google Developer Groups On Campus - REC');
    }
  }
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  try {
    t.fn();
    console.log(`[PASS] ${t.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${t.name}:`, err.message);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

// Apply the same external-link policy to every Markdown announcement at build time.
export default function externalLinks({ site } = {}) {
  return tree => {
    const visit = node => {
      const href = node.properties?.href;
      if (node.type === 'element' && node.tagName === 'a' && typeof href === 'string' && /^(https?:)?\/\//i.test(href)) {
        const url = new URL(href, site || 'https://noticeboard.invalid');
        if (!site || url.origin !== new URL(site).origin) {
          node.properties.target = '_blank';
          const existing = node.properties.rel || [];
          const rel = Array.isArray(existing) ? existing : existing.split(/\s+/);
          node.properties.rel = [...new Set([...rel, 'noopener', 'noreferrer'])];
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

import { useEffect } from 'react'
import { BRAND_CONFIG } from '@/config/brand'

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sincroniza title/description/canonical por ruta. */
export function usePageMeta(opts: { title: string; description?: string; noIndex?: boolean }) {
  const { title, description, noIndex } = opts
  useEffect(() => {
    const full = title.includes(BRAND_CONFIG.name) ? title : `${title} | ${BRAND_CONFIG.name}`
    document.title = full
    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description)
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', full)
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow',
    )

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = `${BRAND_CONFIG.seo.domain}${window.location.pathname}`
  }, [title, description, noIndex])
}

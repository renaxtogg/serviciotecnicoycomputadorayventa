/* Entorno DOM para las pruebas de render (jsdom). Debe importarse ANTES que React. */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const g = globalThis as unknown as Record<string, unknown>
g.window = dom.window
g.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true, writable: true })
g.HTMLElement = dom.window.HTMLElement
g.Node = dom.window.Node
g.Element = dom.window.Element
g.Event = dom.window.Event
g.KeyboardEvent = dom.window.KeyboardEvent
g.MouseEvent = dom.window.MouseEvent
g.getComputedStyle = dom.window.getComputedStyle
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number
g.cancelAnimationFrame = (id: number) => clearTimeout(id)
g.IS_REACT_ACT_ENVIRONMENT = true

// APIs que jsdom no implementa y que usa la app
dom.window.scrollTo = () => {}
dom.window.print = () => {}
dom.window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

export { dom }

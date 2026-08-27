// Состояние desktop-панели каталога (ShowHamburger, инстанс hidden-tablet).
// Страницы используют его для сдвига первого блока при открытой панели:
//   const { isCatalogOpen } = useCatalogPanel()
//   :class="['hero-slider', { 'hero-slider_catalog-open': isCatalogOpen }]"
// CSS: margin-inline-start: var(--catalog-width) + transition
export const useCatalogPanel = () => {
  const { isOpen } = useDialog("hamburgerCatalogDesktop")
  return { isCatalogOpen: isOpen }
}

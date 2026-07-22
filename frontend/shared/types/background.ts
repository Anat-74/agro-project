export interface BackgroundItem {
  id: string
  title: string
  imageAvif: string
  imageWebp: string
  thumbnail?: string | null
  isDefault?: boolean
}

export interface BackgroundData {
  enableBackground: boolean
  options: BackgroundItem[]
}

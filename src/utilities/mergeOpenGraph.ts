import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Top Rated Private Tours to Taj Mahal  | Trip Advisor 2025 Award Winner | Rated 4.9 Stars on Trustpilot | Since 2007',
  images: [
    {
      url: '/og-image.jpg',
    },
  ],
  siteName: 'Taj Nirvana',
  title: 'Taj Nirvana',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}

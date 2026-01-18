import { Grid } from '@/components/Grid'
import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { ProductGridItem } from '@/components/ProductGridItem'
import { Search } from '@/components/Search'
import { sorting } from '@/lib/constants'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Suspense } from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInUSD: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
      ? {
        where: {
          and: [
            {
              _status: {
                equals: 'published',
              },
            },
            ...(searchValue
              ? [
                {
                  or: [
                    {
                      title: {
                        like: searchValue,
                      },
                    },
                    {
                      description: {
                        like: searchValue,
                      },
                    },
                  ],
                },
              ]
              : []),
            ...(category
              ? [
                {
                  categories: {
                    contains: category,
                  },
                },
              ]
              : []),
          ],
        },
      }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <Suspense fallback={null}>
      <div className="container flex flex-col gap-8 my-16 pb-4 ">
        <Search className="mb-8" />

        <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
            <Categories />
            <FilterList list={sorting} title="Sort by" />
          </div>
          <div className="min-h-screen w-full">
            <div>
              {searchValue ? (
                <p className="mb-4">
                  {products.docs?.length === 0
                    ? 'There are no products that match '
                    : `Showing ${products.docs.length} ${resultsText} for `}
                  <span className="font-bold">&quot;{searchValue}&quot;</span>
                </p>
              ) : null}

              {!searchValue && products.docs?.length === 0 && (
                <p className="mb-4">No products found. Please try different filters.</p>
              )}

              {products?.docs.length > 0 ? (
                <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.docs.map((product) => {
                    return <ProductGridItem key={product.id} product={product} />
                  })}
                </Grid>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

import React from 'react'


// export async function generateMetadata({ params }: Args): Promise<Metadata> {
//     const { slug } = await params
//     const product = await queryProductBySlug({ slug })

//     if (!product) return notFound()

//     const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

//     const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
//     const canIndex = product._status === 'published'

//     const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

//     return {
//         description: product.meta?.description || '',
//         openGraph: seoImage?.url
//             ? {
//                 images: [
//                     {
//                         alt: seoImage?.alt,
//                         height: seoImage.height!,
//                         url: seoImage?.url,
//                         width: seoImage.width!,
//                     },
//                 ],
//             }
//             : null,
//         robots: {
//             follow: canIndex,
//             googleBot: {
//                 follow: canIndex,
//                 index: canIndex,
//             },
//             index: canIndex,
//         },
//         title: product.meta?.title || product.title,
//     }
// }

const page = () => {

    // const product = {
    //     title: "test",
    //     description: "test",
    //     price: 33,
    //     metaImageurl: "url"
    // }

    // const productJsonLd = {
    //     name: product.title,
    //     '@context': 'https://schema.org',
    //     '@type': 'Product',
    //     description: product.description,
    //     image: product.metaImageurl,
    //     offers: {
    //         '@type': 'AggregateOffer',
    //         availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    //         price: product.price,
    //         priceCurrency: 'usd',
    //     },
    // }

    return (
        <>
            {/* <React.Fragment>
                <script
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(productJsonLd),
                    }}
                    type="application/ld+json"
                />
            </React.Fragment> */}
        </>
    )
}

export default page
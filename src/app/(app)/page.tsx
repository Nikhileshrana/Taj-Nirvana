import { HeroSearch } from '@/components/HeroSearch'
import { Button } from '@/components/ui/button'
import { generateMetadata } from './[slug]/page'

export { generateMetadata }

const Page = () => {
  return (
    <>
      <HeroSearch />
      <div className="container mx-auto py-12 md:py-20 px-4">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-12 md:px-12 md:py-24 shadow-xl">

          {/* Grid Layout: Stacked on Mobile, Side-by-Side on Desktop */}
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center relative z-10">

            {/* Left Column: Visuals (Phone + Floating Icons) */}
            <div className="relative mx-auto w-full max-w-[400px] lg:max-w-[500px] flex justify-center items-center h-[300px] md:h-[400px] lg:h-[500px]">

              {/* Floating Background Icons - positioned absolutely */}
              {/* Icon 1: Top Left */}
              <div className="absolute top-0 left-4 md:left-0 w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-700 delay-100 p-3">
                <img src="https://static.tacdn.com/assets/s/97b4c2c8.svg" alt="Trophy Icon" className="w-full h-full object-contain" />
              </div>

              {/* Icon 2: Bottom Left */}
              <div className="absolute bottom-12 left-0 md:-left-4 w-20 h-20 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-700 delay-300 p-4">
                <img src="https://static.tacdn.com/assets/s/a5674fbe.svg" alt="Wallet Icon" className="w-full h-full object-contain" />
              </div>

              {/* Icon 3: Top Right */}
              <div className="absolute top-4 right-4 md:right-0 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-700 delay-200 p-4">
                <img src="https://static.tacdn.com/assets/s/347f0b55.svg" alt="Money Icon" className="w-full h-full object-contain" />
              </div>

              {/* Icon 4: Bottom Right */}
              <div className="absolute bottom-8 right-0 md:-right-8 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-700 delay-500 p-3">
                <img src="https://static.tacdn.com/assets/s/21a5f64a.svg" alt="Tag Icon" className="w-full h-full object-contain" />
              </div>

              {/* Phone Image - Centered */}
              <div className="relative z-20 w-[160px] md:w-[220px] lg:w-[260px] rotate-[-6deg] transition-transform hover:rotate-0 duration-500">
                <img
                  src="https://static.tacdn.com/assets/s/ed3c79d2.webp"
                  alt="App Interface"
                  className="w-full h-auto drop-shadow-2xl rounded-[2rem]"
                />
              </div>
            </div>

            {/* Right Column: Text Content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 md:space-y-8">

              <div className="flex items-center gap-3">
                {/* Logo invert for dark background */}
                <img src="https://static.tacdn.com/assets/s/b8883623.svg" alt="Logo" className="h-8 w-auto brightness-0 invert" />
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-primary-foreground leading-[1.1]">
                Introducing <br className="hidden lg:block" />
                Tripadvisor <br className="hidden lg:block" />
                Rewards
              </h2>

              <p className="text-lg md:text-2xl text-primary-foreground/90 max-w-lg font-medium">
                It pays to plan, book, and share. <br className="hidden md:block" />
                Join now for $30 off Things to Do.
              </p>

              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg font-bold rounded-full transition-transform hover:scale-105"
              >
                Learn more
              </Button>
            </div>
          </div>

          {/* Decorative elements to add depth */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none mix-blend-screen" />

        </section>
      </div>
    </>
  )
}

export default Page


import Hero from '@/components/Hero';
import Gallery from '@/components/Gallery';
import { getPhotos } from '@/lib/photos';

export default function Page() {
  const photos = getPhotos();

  return (
    <>
      <div className="mx-auto max-w-page px-6 md:px-10">
        <Hero />
      </div>
      <main>
        <Gallery photos={photos} />
      </main>
    </>
  );
}

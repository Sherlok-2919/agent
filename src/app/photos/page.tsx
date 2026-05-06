import Navbar from "@/components/ui/Navbar";
import PhotoGrid from "@/components/photos/PhotoGrid";
import PhotoArenaHero from "@/components/photos/PhotoArenaHero";

export default function PhotosPage() {
  return (
    <>
      <Navbar />
      <PhotoArenaHero />
      <section className="text-center px-5 py-10">
        <h2 className="text-neon-teal text-[clamp(1.5rem,3vw,2.2rem)] mb-3 font-heading">
          BROWSE THE COLLECTION
        </h2>
        <p className="text-gray-500 text-base">
          Filter by album &amp; explore every shot.
        </p>
      </section>
      <PhotoGrid />
    </>
  );
}

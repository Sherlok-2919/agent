import Navbar from "@/components/ui/Navbar";
import PhotoGrid from "@/components/photos/PhotoGrid";

export default function PhotosPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <section className="text-center px-5 pb-10">
          <h1 className="text-neon-teal text-[clamp(2rem,5vw,3.5rem)] mb-3">PHOTO ARENA</h1>
          <p className="text-gray-500 text-base">A gallery of memories — captured by the squad.</p>
        </section>
        <PhotoGrid />
      </main>
    </>
  );
}

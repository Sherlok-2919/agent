import Navbar from "@/components/ui/Navbar";
import VideoGrid from "@/components/videos/VideoGrid";

export default function VideosPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen">
        <section className="text-center px-5 pb-10">
          <h1 className="text-neon-red text-[clamp(2rem,5vw,3.5rem)] mb-3">VIDEO VAULT</h1>
          <p className="text-gray-500 text-base">Your squad&apos;s best moments — streamed from the cloud.</p>
        </section>
        <VideoGrid />
      </main>
    </>
  );
}

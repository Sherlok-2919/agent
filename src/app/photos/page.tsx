import Navbar from "@/components/ui/Navbar";
import PhotoGrid from "@/components/photos/PhotoGrid";
import PhotoArenaHero from "@/components/photos/PhotoArenaHero";

export const metadata = {
  title: "Photo Arena | TEAM AGENT",
  description: "Browse the squad's photo collection — auto-synced from Google Drive. Responsive masonry gallery with lightbox viewing.",
};

export default function PhotosPage() {
  return (
    <>
      <Navbar />
      <PhotoArenaHero />
      <PhotoGrid />
    </>
  );
}

import "./globals.css";

export const metadata = {
  title: "TEAM AGENT | 3D Gamer's Portfolio",
  description: "An immersive 3D gaming portfolio — video vault, photo arena, and squad zone. Built by Team Agent.",
  keywords: ["gaming", "portfolio", "3D", "team agent", "video", "photos", "esports"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <div className="grid-bg" />
        <div className="page-content">
          {children}
        </div>
      </body>
    </html>
  );
}

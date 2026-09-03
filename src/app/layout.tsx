import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://liberxmobile.vercel.app"),
  title: "LiberXMobile — Free Office Suite for Schools",
  description: "A customized LibreOffice fork for Class 9 and 10 students, optimized for Android Smart Boards. Writer, Calc, and Impress — completely free and open-source.",
  keywords: ["LiberXMobile", "LibreOffice", "Schools", "CBSE", "ICSE", "Smart Board", "Office Suite", "Education"],
  authors: [{ name: "LiberXMobile Contributors" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-custom.png",
    apple: "/logo-custom.png",
    shortcut: "/logo-custom.png",
  },
  appleWebApp: {
    capable: true,
    title: "LiberXMobile",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "LiberXMobile",
    description: "Free Office Suite optimized for Schools",
    type: "website",
    images: ["/logo-custom.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#18A303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { AppProviders } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeamSync - Your team, working as one",
  description: "Manage projects, tasks, files and collaboration in one place.",
};

const themeScript = `
  (function () {
    try {
      const savedTheme = localStorage.getItem("teamsync-theme");

      if (savedTheme === "light" || savedTheme === "dark") {
        document.documentElement.setAttribute(
          "data-theme",
          savedTheme
        );
      }
    } catch (error) {
      console.error("Failed to load saved theme", error);
    }
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

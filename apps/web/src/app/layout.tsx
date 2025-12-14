import type { Metadata } from 'next';
import '@repo/ui/globals.css';
import { ThemeProvider } from '@repo/ui/components/theme-provider';

export const metadata: Metadata = {
  title: 'Remindrop - Bookmark Management with AI',
  description: 'Organize and review your bookmarks with AI-powered summaries and daily email digests',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

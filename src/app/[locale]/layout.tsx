import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Cormorant_Garamond, Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import { SmoothProvider } from '@/components/animations/SmoothProvider';
import { CartProvider } from '@/components/shop/CartContext';
import { SiteSettingsProvider } from '@/components/shop/SiteSettingsContext';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { getSiteSettings } from '@/lib/settings';
import '../globals.css';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-serif' });
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-arabic' });

export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [messages, settings] = await Promise.all([getMessages(), getSiteSettings()]);
  const isRtl = locale === 'ar';

  const cssVars = {
    '--bg-ivory': settings.bgColor,
    '--text-obsidian': settings.textColor,
    '--accent-gold': settings.accentColor,
    '--primary-emerald': settings.primaryColor,
  } as React.CSSProperties;

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={cssVars}
      className={`${serif.variable} ${sans.variable} ${cairo.variable}`}
    >
      <body
        style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
        className={isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'}
      >
        <NextIntlClientProvider messages={messages}>
          <SiteSettingsProvider settings={settings}>
            <SmoothProvider>
              <CartProvider>
                <Navbar />
                <CartDrawer />
                <main className="min-h-screen">{children}</main>
                <Footer />
                <WhatsAppButton />
              </CartProvider>
            </SmoothProvider>
          </SiteSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
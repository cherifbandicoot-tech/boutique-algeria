import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Cormorant_Garamond, Plus_Jakarta_Sans, Cairo } from 'next/font/google';
import { SmoothProvider } from '@/components/animations/SmoothProvider';
import { CartProvider } from '@/components/shop/CartContext';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import '../globals.css';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-serif' });
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-arabic' });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={`${serif.variable} ${sans.variable} ${cairo.variable}`}>
      <body className={isRtl ? 'font-[var(--font-arabic)]' : 'font-[var(--font-sans)]'}>
        <NextIntlClientProvider messages={messages}>
          <SmoothProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main className="min-h-screen">{children}</main>
              <Footer />
              <WhatsAppButton />
            </CartProvider>
          </SmoothProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
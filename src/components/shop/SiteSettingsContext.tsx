'use client';

import { createContext, useContext } from 'react';
import type { SiteSettingsData } from '@/lib/settings';
import { DEFAULT_SITE_SETTINGS } from '@/lib/settings';

const SiteSettingsContext = createContext<SiteSettingsData>(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettingsData;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
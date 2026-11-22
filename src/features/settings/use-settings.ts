'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { DEFAULT_SETTINGS } from '@/config/site-settings';
export const SETTINGS_KEY = ['site-settings'] as const;
export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => api.site.settings(),
    staleTime: 60_000,
  });
  return { ...DEFAULT_SETTINGS, ...data?.values };
}

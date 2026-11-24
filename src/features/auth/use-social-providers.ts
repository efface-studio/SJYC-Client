import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import type { OAuthProvider } from '@/domain/types';

const empty: OAuthProvider[] = [];

export function useSocialProviders() {
  return (
    useQuery({ queryKey: ['social-providers'], queryFn: api.auth.socialProviders, staleTime: 60_000 }).data ??
    empty
  );
}

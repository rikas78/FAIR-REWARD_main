import { ayeTConfig, assertAyeTConfig } from './config';
import type { AyeTResponse } from './types';

export interface AyeTRequestOptions {
  externalIdentifier: string;
  userAgent?: string;
  ip?: string;
  language?: string;
  numOffers?: number;
  offerSorting?: 'payout' | 'conversion_rate' | 'epc' | 'ecpm';
  minimumPayout?: number;
  includeMobileOffers?: boolean;
}

export async function getAyeTOffers(
  options: AyeTRequestOptions
): Promise<AyeTResponse> {
  assertAyeTConfig();

  const url = new URL(
    `${ayeTConfig.baseUrl}/offers/offerwall_api/${ayeTConfig.adSlotId}`
  );

  url.searchParams.set('external_identifier', options.externalIdentifier);

  if (options.userAgent) url.searchParams.set('user_agent', options.userAgent);
  if (options.ip) url.searchParams.set('ip', options.ip);
  if (options.language) url.searchParams.set('language', options.language);
  if (options.numOffers !== undefined) {
    url.searchParams.set('num_offers', String(options.numOffers));
  }
  if (options.offerSorting) {
    url.searchParams.set('offer_sorting', options.offerSorting);
  }
  if (options.minimumPayout !== undefined) {
    url.searchParams.set('minimum_payout', String(options.minimumPayout));
  }
  if (options.includeMobileOffers !== undefined) {
    url.searchParams.set(
      'include_mobile_offers',
      String(options.includeMobileOffers)
    );
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent':
        options.userAgent ??
        'FairReward/2.0 (+https://github.com/rikas78/FAIR-REWARD_main)',
    },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`AyeT API ${response.status}: ${body}`);
  }

  return JSON.parse(body) as AyeTResponse;
}

export interface AyeTOffer {
  id?: string;
  title?: string;
  description?: string;
  payout?: number;
  currency_amount?: number;
  conversion_time?: number;
  url?: string;
  [key: string]: unknown;
}

export interface AyeTResponse {
  offers?: AyeTOffer[];
  [key: string]: unknown;
}

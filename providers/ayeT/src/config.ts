export const ayeTConfig = {
  apiKey: process.env.AYET_API_KEY ?? '',
  publisherId: process.env.AYET_PUBLISHER_ID ?? '',
  adSlotId: process.env.AYET_ADSLOT_ID ?? '29639',
  baseUrl: 'https://www.ayetstudios.com',
};

export function assertAyeTConfig() {
  if (!ayeTConfig.adSlotId) {
    throw new Error('Missing AYET_ADSLOT_ID');
  }
}

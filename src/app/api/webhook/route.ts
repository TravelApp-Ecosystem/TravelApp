// =============================================================================
// Fallback Webhook Alias: delegates GET/POST to /api/webhooks/whatsapp
// =============================================================================

export { GET, POST } from '@/app/api/webhooks/whatsapp/route';
export const maxDuration = 60;

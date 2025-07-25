import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'discord-verification-bot-admin-dashboard-45xm2cgm',
  authRequired: false // Using Discord OAuth2 instead
})
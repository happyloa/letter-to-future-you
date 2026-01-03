// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    // Ensure Cloudflare bindings (e.g. D1) are available during runtime
    preset: 'cloudflare-pages'
  }
})

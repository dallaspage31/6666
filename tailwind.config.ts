import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: {
    include: [
      './app/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './browse/**/*.{ts,tsx}',
    ],
  },
})
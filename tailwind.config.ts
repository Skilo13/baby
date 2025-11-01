import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        babyPink: '#FFB6C1',
        babyBlue: '#B0E0E6',
        softYellow: '#FFFACD',
        lavender: '#E6E6FA',
      },
    },
  },
  plugins: [],
}
export default config

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'status-notify': '#f59e0b',
        'status-pending': '#3b82f6',
        'status-retired': '#10b981',
        'status-urgent': '#ef4444',
      },
      minHeight: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'orange': {
          '50': '#FEF5E7',
          '100': '#FDEBD0',
          '200': '#F9E79F',
          '300': '#F5B041',
          '400': '#F39C12',
          '500': '#E67E22',
          '600': '#D68910',
          '700': '#BA4A00',
          '800': '#922B14',
          '900': '#6C3410',
        },
        'app': {
          'main': '#E67E22',
          'text': '#383a3f',
          'dark': '#1f2124',
          'gray': '#677',
          'bg': '#f3f6f9',
          'light': '#acb4bd',
          'lighter': '#f9f9f9',
          'border': '#e0e3e6',
        },
      },
      fontFamily: {
        'sans': ['Lexend', 'system-ui', 'sans-serif'],
        'mono': ['Monaco', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'BASE': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};

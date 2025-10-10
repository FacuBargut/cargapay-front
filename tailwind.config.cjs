/** @type {import('tailwindcss').Config} */
module.exports = {
  devTools: false,
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}', // <-- ¡ASEGURATE DE QUE ESTA LÍNEA EXISTA!
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
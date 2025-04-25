module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}", 
    ],
    theme: {
      extend: {
        colors: {
          'neon-blue': '#22d3ee',
          'neon-magenta': '#f472b6',
          'neon-green': '#4ade80',
        },
        fontFamily: {
          display: ['Orbitron', 'sans-serif'],
          body: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
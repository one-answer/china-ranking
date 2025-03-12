/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // VSCode暗色主题风格
        vscode: {
          bg: "#1e1e1e",
          darker: "#1a1a1a",
          lighter: "#252526",
          sidebar: "#252526",
          line: "#333333",
          text: "#d4d4d4",
          comment: "#6A9955",
          function: "#DCDCAA",
          keyword: "#569CD6",
          string: "#CE9178",
          number: "#b5cea8",
          type: "#4EC9B0",
          class: "#4EC9B0",
          variable: "#9CDCFE",
          orange: "#CE9178",
        },
      },
      boxShadow: {
        code: "0 2px 8px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "cursor-blink": "cursor 1s step-start infinite",
      },
      keyframes: {
        cursor: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};

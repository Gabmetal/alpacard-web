module.exports = {
    content: [
        // app content
        `src/**/*.{js,ts,jsx,tsx}`,
        // include packages if not present
        "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};

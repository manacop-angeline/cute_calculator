# matcha calc / coffee calc

A cozy, aesthetic calculator. Light mode is **matcha**, dark mode is **coffee**.

## Run it

Requires Node.js 16+ (no `npm install` needed, there are no dependencies).

```bash
npm start
# then open http://localhost:3000
```

Or skip the server entirely and open `public/index.html` in your browser.

## Features

- Day/night switch: matcha theme and coffee theme (remembers your choice, and
  follows your system preference on first visit)
- Chained operations (`2 + 3 × 4` evaluates step by step like a standard calculator)
- Repeat equals (`5 + 2 = =` gives `9`)
- Smart percent (`200 + 10 %` gives `220`)
- Floating-point cleanup (`0.1 + 0.2` gives `0.3`)
- Divide-by-zero shows `Error`, and the next key press recovers
- Keyboard support: `0-9`, `+ - * /`, `.`, `Enter` or `=`, `Backspace`, `Esc` or `C`, `%`

## Structure

```
matcha-calc/
├── server.js          # zero-dependency Node static server (+ /api/health)
├── package.json
├── public/
│   ├── index.html
│   ├── style.css      # both themes live in CSS variables
│   └── script.js      # calculator logic + theme toggle
└── test/
    └── calc.test.js   # logic tests (npm test)
```

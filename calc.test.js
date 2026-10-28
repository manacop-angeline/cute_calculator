// Runs the real public/script.js inside a minimal fake DOM and drives it
// with button presses, so we test the actual shipped logic.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const code = fs.readFileSync(path.join(__dirname, "..", "public", "script.js"), "utf8");

function makeEnv() {
  const makeEl = () => ({
    textContent: "",
    dataset: {},
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => "matcha",
    addEventListener() {},
  });
  const display = makeEl();
  const win = { matchMedia: () => ({ matches: false }) };
  const sandbox = {
    window: win,
    document: {
      documentElement: makeEl(),
      title: "",
      getElementById: (id) => (id === "display" ? display : makeEl()),
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener() {},
      activeElement: null,
    },
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return { calc: win.__calc, display };
}

// press("7","+","3","=") style helper
function run(keys) {
  const { calc, display } = makeEnv();
  for (const k of keys) {
    if (/^[0-9]$/.test(k)) calc.handle("digit", k);
    else if ("+−×÷".includes(k)) calc.handle("operator", k);
    else if (k === ".") calc.handle("dot");
    else if (k === "=") calc.handle("equals");
    else if (k === "%") calc.handle("percent");
    else if (k === "B") calc.handle("backspace");
    else if (k === "C") calc.handle("clear");
  }
  return display.textContent;
}

const cases = [
  [["7", "+", "3", "="], "10"],
  [["9", "−", "4", "="], "5"],
  [["6", "×", "7", "="], "42"],
  [["8", "÷", "2", "="], "4"],
  [["1", "÷", "3", "="], "0.333333333333"],
  [["0", ".", "1", "+", "0", ".", "2", "="], "0.3"],
  [["2", "+", "3", "×", "4", "="], "20"],          // chained, left to right
  [["5", "+", "2", "=", "="], "9"],                 // repeat equals
  [["5", "+", "×", "3", "="], "15"],               // operator swap
  [["2", "0", "0", "+", "1", "0", "%", "="], "220"],
  [["5", "0", "%"], "0.5"],
  [["5", "÷", "0", "="], "Error"],
  [["5", "÷", "0", "=", "7"], "7"],                // recovers after error
  [["1", "2", "3", "B"], "12"],
  [["1", "B"], "0"],
  [["1", ".", "5", ".", "5"], "1.55"],             // second dot ignored
  [["."], "0."],
  [["0", "0", "7"], "7"],                          // no leading zeros
  [["9", "−", "1", "2", "="], "−3"],               // negatives display with −
  [["1", "2", "C"], "0"],
  [["3", "+", "="], "6"],                          // 3 + = -> 6
  [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "1", "2", "3", "4", "5"], "123456789012"], // 12-digit cap
];

let failed = 0;
for (const [keys, expected] of cases) {
  const got = run(keys);
  try {
    assert.strictEqual(got, expected);
    console.log("PASS", keys.join(" "), "→", got);
  } catch {
    failed++;
    console.log("FAIL", keys.join(" "), "→", got, "(expected", expected + ")");
  }
}

console.log(failed ? `\n${failed} failed` : `\nAll ${cases.length} tests passed`);
process.exit(failed ? 1 : 0);

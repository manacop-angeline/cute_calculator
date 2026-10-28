/* matcha calc / coffee calc — calculator logic + theme toggle */
(() => {
  "use strict";

  const MAX_DIGITS = 12;

  /* ---------- Pure math helpers (exported for tests) ---------- */

  // Strip floating-point noise: 0.1 + 0.2 -> 0.3
  const clean = (n) => Number(parseFloat(n.toPrecision(12)));

  function compute(a, b, op) {
    switch (op) {
      case "+": return clean(a + b);
      case "−": return clean(a - b);
      case "×": return clean(a * b);
      case "÷": return b === 0 ? null : clean(a / b);
      default:  return b;
    }
  }

  function format(n) {
    if (n === null || !Number.isFinite(n)) return "Error";
    if (n === 0) return "0";
    const abs = Math.abs(n);
    if (abs >= 1e12 || abs < 1e-9) {
      return String(parseFloat(n.toExponential(6)));
    }
    return String(clean(n));
  }

  /* ---------- State ---------- */
  const state = {
    current: "0",      // what's being typed / shown
    previous: null,    // left operand
    operator: null,    // pending operator
    overwrite: false,  // next digit starts a fresh number
    lastOp: null,      // for repeated "="
    lastOperand: null,
    error: false,
  };

  const displayEl = document.getElementById("display");

  /* ---------- Rendering ---------- */
  function render() {
    const text = state.current.replace("-", "−");
    displayEl.textContent = text;
    displayEl.classList.toggle("small", text.length > 9 && text.length <= 12);
    displayEl.classList.toggle("xsmall", text.length > 12);

    document.querySelectorAll(".key.op").forEach((btn) => {
      btn.classList.toggle(
        "active-op",
        state.operator === btn.dataset.value && state.overwrite
      );
    });
  }

  /* ---------- Actions ---------- */
  function resetAll() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.overwrite = false;
    state.lastOp = null;
    state.lastOperand = null;
    state.error = false;
  }

  function setResult(value) {
    if (value === null) {
      resetAll();
      state.current = "Error";
      state.error = true;
    } else {
      state.current = format(value);
    }
  }

  function inputDigit(d) {
    if (state.error) resetAll();
    if (state.overwrite) {
      state.current = d;
      state.overwrite = false;
      // starting a new number after "=" forgets the repeat-equals memory
      if (!state.operator) { state.lastOp = null; state.lastOperand = null; }
    } else if (state.current === "0") {
      state.current = d;
    } else if (state.current.replace(/[-.]/g, "").length < MAX_DIGITS) {
      state.current += d;
    }
  }

  function inputDot() {
    if (state.error) resetAll();
    if (state.overwrite) {
      state.current = "0.";
      state.overwrite = false;
      if (!state.operator) { state.lastOp = null; state.lastOperand = null; }
      return;
    }
    if (!state.current.includes(".")) state.current += ".";
  }

  function chooseOperator(op) {
    if (state.error) return;

    // Changing your mind about the operator: just swap it.
    if (state.operator && state.overwrite) {
      state.operator = op;
      return;
    }

    // Chaining: 2 + 3 × ... evaluates 2 + 3 first.
    if (state.operator) {
      const result = compute(state.previous, parseFloat(state.current), state.operator);
      if (result === null) return setResult(null);
      state.previous = result;
      state.current = format(result);
    } else {
      state.previous = parseFloat(state.current);
    }

    state.operator = op;
    state.overwrite = true;
    state.lastOp = null;
    state.lastOperand = null;
  }

  function equals() {
    if (state.error) return;
    const cur = parseFloat(state.current);

    if (state.operator) {
      const result = compute(state.previous, cur, state.operator);
      state.lastOp = state.operator;
      state.lastOperand = cur;
      state.operator = null;
      state.previous = null;
      state.overwrite = true;
      setResult(result);
    } else if (state.lastOp) {
      // Pressing "=" again repeats the last operation (5 + 2 = = -> 9)
      const result = compute(cur, state.lastOperand, state.lastOp);
      state.overwrite = true;
      setResult(result);
    }
  }

  function percent() {
    if (state.error) return;
    const cur = parseFloat(state.current);
    let value;
    if (state.operator && state.previous !== null && (state.operator === "+" || state.operator === "−")) {
      value = clean((state.previous * cur) / 100); // 200 + 10% -> 200 + 20
    } else {
      value = clean(cur / 100);
    }
    state.current = format(value);
    state.overwrite = true;
  }

  function backspace() {
    if (state.error) return resetAll();
    if (state.overwrite) return; // don't chop up a computed result
    state.current = state.current.slice(0, -1);
    if (state.current === "" || state.current === "-") state.current = "0";
  }

  function clear() {
    resetAll();
  }

  /* ---------- Dispatch ---------- */
  function handle(action, value) {
    switch (action) {
      case "digit":     inputDigit(value); break;
      case "dot":       inputDot(); break;
      case "operator":  chooseOperator(value); break;
      case "equals":    equals(); break;
      case "percent":   percent(); break;
      case "backspace": backspace(); break;
      case "clear":     clear(); break;
    }
    render();
  }

  document.querySelectorAll(".key").forEach((btn) => {
    btn.addEventListener("click", () => handle(btn.dataset.action, btn.dataset.value));
  });

  /* ---------- Keyboard support ---------- */
  const keyMap = { "+": "+", "-": "−", "*": "×", "x": "×", "X": "×", "/": "÷" };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let btn = null;

    if (/^[0-9]$/.test(e.key)) {
      btn = document.querySelector(`.key[data-action="digit"][data-value="${e.key}"]`);
    } else if (keyMap[e.key]) {
      btn = document.querySelector(`.key[data-action="operator"][data-value="${keyMap[e.key]}"]`);
    } else if (e.key === "." || e.key === ",") {
      btn = document.querySelector('.key[data-action="dot"]');
    } else if (e.key === "Enter" || e.key === "=") {
      btn = document.querySelector('.key[data-action="equals"]');
    } else if (e.key === "Backspace") {
      btn = document.querySelector('.key[data-action="backspace"]');
    } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
      btn = document.querySelector('.key[data-action="clear"]');
    } else if (e.key === "%") {
      btn = document.querySelector('.key[data-action="percent"]');
    }

    if (!btn) return;
    e.preventDefault();
    if (document.activeElement && document.activeElement.classList.contains("key")) {
      document.activeElement.blur(); // stops Enter from double-firing a focused key
    }
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 100);
    handle(btn.dataset.action, btn.dataset.value);
  });

  /* ---------- Theme toggle (matcha ↔ coffee) ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const titleText = document.getElementById("titleText");
  const decoL = document.getElementById("decoL");
  const decoR = document.getElementById("decoR");
  const themeLabel = document.getElementById("themeLabel");

  function applyTheme(theme) {
    const coffee = theme === "coffee";
    root.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-checked", String(coffee));
    titleText.textContent = coffee ? "coffee calc" : "matcha calc";
    decoL.textContent = decoR.textContent = coffee ? "☕" : "✿";
    themeLabel.textContent = coffee ? "night" : "day";
    document.title = titleText.textContent;
    try { localStorage.setItem("calc-theme", theme); } catch (_) {}
  }

  toggle.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "coffee" ? "matcha" : "coffee");
  });

  let saved = null;
  try { saved = localStorage.getItem("calc-theme"); } catch (_) {}
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "coffee" : "matcha"));

  render();

  // Expose pure helpers for the test script (Node won't hit this: no window).
  window.__calc = { compute, format, handle, state };
})();

(() => {
'use strict';
window.EC = window.EC || {};
const { createSim, stepSim, polarization, sanitizeRules } = window.EC.sim;
function createComparison(seed, rules, count) {
  return { A: createSim(seed, { ...rules, alignOn: true }, count), B: createSim(seed, { ...rules, alignOn: false }, count) };
}
function stepComparison(pair, n) { stepSim(pair.A, n); stepSim(pair.B, n); }
function updateComparison(pair, rules) {
  pair.A.rules = sanitizeRules({ ...rules, alignOn: true });
  pair.B.rules = sanitizeRules({ ...rules, alignOn: false });
}
function comparisonStats(pair) {
  return pair ? { stepA: pair.A.step, stepB: pair.B.step, phiA: polarization(pair.A), phiB: polarization(pair.B) } : null;
}

window.EC.compare = Object.freeze({ createComparison, stepComparison, updateComparison, comparisonStats });
})();

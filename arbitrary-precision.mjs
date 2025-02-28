import Decimal from 'decimal.js';

// Set the precision (e.g., 100 significant digits)
Decimal.set({ precision: 100});

// Helper function to compute the invariant constant 
// k = ∏_{i=0}^{N-1} r[i]^(w[i])
function computeInvariant(r, w) {
  let k = new Decimal(1);
  for (let i = 0; i < r.length; i++) {
    k = k.mul(new Decimal(r[i]).pow(w[i]));
  }
  return k;
}

// f(Delta) = ∏_{i=0}^{N-1} [ (r[i] + (i === 0 ? x : 0) - Delta)^(w[i]) ] - ∏_{i=0}^{N-1} [ r[i]^(w[i]) ]
function f(Delta, r, x, w) {
  const N = r.length;
  let productValue = new Decimal(1);
  for (let i = 0; i < N; i++) {
    // For token 0, add x; for others, use r[i] as is.
    const base = i === 0 ? new Decimal(r[i]).plus(x) : new Decimal(r[i]);
    const term = base.minus(Delta);
    productValue = productValue.mul(term.pow(w[i]));
  }
  const constantProduct = computeInvariant(r, w);
  return productValue.minus(constantProduct);
}

// fDerivative(Delta) computes the derivative of f(Delta) using the generalized product rule:
// fDerivative(Delta) = -F(Delta) * Σ [ w[i] / ( (r[i] + (i === 0 ? x : 0) - Delta) ) ]
function fDerivative(Delta, r, x, w) {
  const N = r.length;
  let productValue = new Decimal(1);
  for (let i = 0; i < N; i++) {
    const base = i === 0 ? new Decimal(r[i]).plus(x) : new Decimal(r[i]);
    const term = base.minus(Delta);
    productValue = productValue.mul(term.pow(w[i]));
  }

  let sumTerms = new Decimal(0);
  for (let i = 0; i < N; i++) {
    const base = i === 0 ? new Decimal(r[i]).plus(x) : new Decimal(r[i]);
    const term = base.minus(Delta);
    sumTerms = sumTerms.plus(new Decimal(w[i]).div(term));
  }

  return productValue.neg().mul(sumTerms);
}

// deltaDifference computes the absolute difference between two Delta values.
function deltaDifference(currentDelta, nextDelta) {
  return nextDelta.minus(currentDelta).abs();
}

// Newton–Raphson method to find Delta such that f(Delta) = 0.
// This version clamps the next Delta to remain within the valid domain.
function newtonMethod(r, x, w, tol = 1e-10, maxIter = 200) {
  // The valid domain for Delta is [0, min_{i}(r[i], x)].
  // Here we assume r is an array from index 0 to N-1.
  const domainMax = new Decimal(Math.min(x, ...r.slice(1)));
  console.log("domainMax:", domainMax.toString());

  let Delta = new Decimal(0); // initial guess
  console.log("initial guess:", Delta.toString());

  for (let iter = 0; iter < maxIter; iter++) {
    const fValue = f(Delta, r, x, w);
    const fDeriv = fDerivative(Delta, r, x, w);

    let nextDelta = Delta.minus(fValue.div(fDeriv));

    // If nextDelta is out of the valid domain, update it to be the average of Delta and domainMax.
    if (nextDelta.lessThan(0) || nextDelta.greaterThan(domainMax)) {
      console.log("Delta is out of range");
      nextDelta = Delta.plus(domainMax).dividedBy(2);
    }

    console.log("nextDelta:", nextDelta.toString());

    const diff = deltaDifference(Delta, nextDelta);

    console.log(`Iter ${iter}: Delta = ${Delta.toFixed(7)}, f(Delta) = ${fValue.toExponential(3)}, |Δ diff| = ${diff.toExponential(3)}`);

    if (fValue.abs().lessThan(new Decimal(tol)) && diff.lessThan(new Decimal(tol))) {
      console.log(`Converged in ${iter} iterations. Final Delta = ${nextDelta.toFixed(7)}`);
      return nextDelta;
    }

    Delta = nextDelta;
  }

  console.log("Newton's method did not converge within the maximum iterations.");
  return null;
}


// ===============================
// Example Usage for Swap1forN-1
// ===============================
//
// In this swap, an input of x tokens for token i1 is added and 
// the algorithm solves for Δ such that tokens i2, i3, …, iN are output.

const r = [20, 300, 400, 50000]; // Reserves for each token
const w = [0.25, 0.25, 0.25, 0.25];    // Weights for each token
const x = 1000000;                   // Additional amount for token i1

const solution = newtonMethod(r, x, w);
console.log(solution !== null ? `Solution for Delta: ${solution}` : "No solution was found.");

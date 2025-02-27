// Helper function to compute the invariant constant 
// k = ∏_{i=0}^{N-1} r[i]^(w[i])
function computeInvariant(r, w) {
  let k = 1;
  for (let i = 0; i < r.length; i++) {
    k *= Math.pow(r[i], w[i]);
  }
  return k;
}

// f(Delta) = ∏_{i=0}^{N-1} [ (r[i] + (i === 0 ? x : 0) - Delta)^(w[i]) ] - ∏_{i=0}^{N-1} [ r[i]^(w[i]) ]
function f(Delta, r, x, w) {
  const N = r.length;
  let productValue = 1;
  for (let i = 0; i < N; i++) {
    // For token 0, add x; for others, use r[i] as is.
    const base = (i === 0 ? r[i] + x : r[i]);
    const term = base - Delta;
    productValue *= Math.pow(term, w[i]);
  }
  const constantProduct = computeInvariant(r, w);
  return productValue - constantProduct;
}

// fDerivative(Delta) computes the derivative of f(Delta) using the generalized product rule:
// fDerivative(Delta) = -F(Delta) * Σ [ w[i] / ( (r[i] + (i === 0 ? x : 0) - Delta) ) ]
function fDerivative(Delta, r, x, w) {
  const N = r.length;
  let productValue = 1;
  for (let i = 0; i < N; i++) {
    const base = (i === 0 ? r[i] + x : r[i]);
    const term = base - Delta;
    productValue *= Math.pow(term, w[i]);
  }
  
  let sumTerms = 0;
  for (let i = 0; i < N; i++) {
    const base = (i === 0 ? r[i] + x : r[i]);
    const term = base - Delta;
    sumTerms += w[i] / term;
  }
  
  return -productValue * sumTerms;
}

// deltaDifference computes the absolute difference between two Delta values.
function deltaDifference(currentDelta, nextDelta) {
  return Math.abs(nextDelta - currentDelta);
}

// Newton–Raphson method to find Delta such that f(Delta) = 0.
// This version clamps the next Delta to remain within the valid domain.
function newtonMethod(r, x, w, tol = 1e-6, maxIter = 10) {
  let Delta = 0; // initial guess
  
  // The valid domain for Delta is [0, min_{i}(r[i] + (i === 0 ? x : 0))).
  const domainMax = Math.min(r[0] + x, ...r.slice(1));
  
  for (let iter = 0; iter < maxIter; iter++) {
    const fValue = f(Delta, r, x, w);
    const fDeriv = fDerivative(Delta, r, x, w);
    
    if (Math.abs(fDeriv) < 1e-20) {
      console.log(`Iter ${iter}: Derivative too small (${fDeriv}). Aborting.`);
      return null;
    }
    
    let nextDelta = Delta - fValue / fDeriv;
    
    // Clamp nextDelta to be within the valid domain [0, domainMax)
    if (nextDelta < 0) {
      nextDelta = 0;
    } else if (nextDelta >= domainMax) {
      nextDelta = domainMax - tol;
    }
    
    const diff = deltaDifference(Delta, nextDelta);
    
    console.log(`Iter ${iter}: Delta = ${Delta.toFixed(7)}, f(Delta) = ${fValue.toExponential(3)}, |Δ diff| = ${diff.toExponential(3)}`);
    
    if (Math.abs(fValue) < tol || diff < tol) {
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

const r = [20, 300, 400, 50000,100]; // Reserves for each token
const w = [0.4, 0.2, 0.1, 0.3,10];    // Weights for each token
const x = 100;                   // Additional amount for token i1

const solution = newtonMethod(r, x, w);
console.log(solution !== null ? `Solution for Delta: ${solution}` : "No solution was found.");

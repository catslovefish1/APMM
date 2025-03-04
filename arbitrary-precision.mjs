import Decimal from 'decimal.js';

// Set the precision (e.g., 100 significant digits)
Decimal.set({ precision: 300 });

/**
 * Helper function to compute the invariant constant
 * k = ∏_{i=0}^{N-1} r[i]^(w[i])
 */
function computeInvariant(r, w) {
  let k = new Decimal(1);
  for (let i = 0; i < r.length; i++) {
    k = k.mul(new Decimal(r[i]).pow(w[i]));
  }
  return k;
}

/**
 * computeMinValue(r, x)
 * Returns an object { minVal, minIndex } where
 *   minVal = min_{0<=i<N} { r[i] + x[i] },
 *   minIndex = the index at which this minimum is attained.
 */
function computeMinValue(r, x) {
  const N = r.length;
  let minVal = new Decimal(r[0]).plus(x[0]);
  let minIndex = 0;
  for (let i = 1; i < N; i++) {
    let current = new Decimal(r[i]).plus(x[i]);
    if (current.lessThan(minVal)) {
      minVal = current;
      minIndex = i;
    }
  }
  return { minVal, minIndex };
}

/**
 * f(Delta) = ∏_{i=0}^{N-1} [ (r[i] + x[i] - Delta)^(w[i]) ]
 *          - ∏_{i=0}^{N-1} [ r[i]^(w[i]) ]
 */
function f(Delta, r, x, w) {
  const N = r.length;
  let productValue = new Decimal(1);
  for (let i = 0; i < N; i++) {
    const base = new Decimal(r[i]).plus(x[i]);
    const term = base.minus(Delta);
    productValue = productValue.mul(term.pow(w[i]));
  }
  const constantProduct = computeInvariant(r, w);
  return productValue.minus(constantProduct);
}

/**
 * f_first_derivative(Delta) computes the first derivative of f(Delta)
 * using the formula:
 *
 * f'(Delta) = - F(Delta) * Σ [ w[i] / (r[i] + x[i] - Delta) ]
 */
function f_first_derivative(Delta, r, x, w) {
  const N = r.length;
  let productValue = new Decimal(1);
  for (let i = 0; i < N; i++) {
    const base = new Decimal(r[i]).plus(x[i]);
    const term = base.minus(Delta);
    productValue = productValue.mul(term.pow(w[i]));
  }
  let sumTerms = new Decimal(0);
  for (let i = 0; i < N; i++) {
    const base = new Decimal(r[i]).plus(x[i]);
    const term = base.minus(Delta);
    sumTerms = sumTerms.plus(new Decimal(w[i]).div(term));
  }
  return productValue.neg().mul(sumTerms);
}

/**
 * f_second_derivative(Delta) computes the second derivative of f(Delta)
 * using the formula:
 *
 * f''(Delta) = F(Delta) * { Σ[i=0 to N-1] [ w[i]*(w[i]-1) / (r[i]+x[i]-Delta)^2 ]
 *              + 2 Σ[0<=i<j<=N-1] [ w[i]*w[j] / ((r[i]+x[i]-Delta)(r[j]+x[j]-Delta)) ] }
 */
function f_second_derivative(Delta, r, x, w) {
  const N = r.length;
  let productValue = new Decimal(1);
  let bases = [];
  for (let i = 0; i < N; i++) {
    const baseVal = new Decimal(r[i]).plus(x[i]);
    const term = baseVal.minus(Delta);
    bases.push(term);
    productValue = productValue.mul(term.pow(w[i]));
  }
  let sum1 = new Decimal(0);
  for (let i = 0; i < N; i++) {
    const denom = bases[i].pow(2);
    const term = new Decimal(w[i]).mul(new Decimal(w[i]).minus(1)).div(denom);
    sum1 = sum1.plus(term);
  }
  let sum2 = new Decimal(0);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const term = new Decimal(w[i]).mul(w[j]).div(bases[i].mul(bases[j]));
      sum2 = sum2.plus(term);
    }
  }
  sum2 = sum2.mul(2);
  const totalSum = sum1.plus(sum2);
  return productValue.mul(totalSum);
}

/**
 * deltaDifference computes the absolute difference between two Decimal values.
 */
function deltaDifference(currentDelta, nextDelta) {
  return nextDelta.minus(currentDelta).abs();
}

/**
 * computeAnalyticalAlpha(x, r, w)
 * Computes the analytical alpha using the formula:
 *   alpha = ∏_{i=0}^{N-1} ((r[i]+x[i])/r[i])^{-w[i]/w[minIndex]}
 * where minIndex is the index where (r[i]+x[i]) is minimized.
 */
function computeAnalyticalAlpha(x, r, w) {
  const N = r.length;
  let { minVal, minIndex } = computeMinValue(r, x);
  let refWeight = new Decimal(w[minIndex]);
  let prod = new Decimal(1);
  for (let i = 0; i < N; i++) {
    let ratio = new Decimal(r[i]).plus(x[i]).div(r[i]);
    let exponent = new Decimal(w[i]).div(refWeight).neg(); // -w[i]/w[minIndex]
    prod = prod.mul(ratio.pow(exponent));
  }
  return prod;
}

/**
 * computeAnalyticalAlpha2(x, r, w)
 * Computes an alternative analytical bound for alpha using the formula:
 *
 *    alpha <= ( Σ_{i=0}^{N-1} w[i]*(1/b_i - ln(d_i) ) ) / ( Σ_{i=0}^{N-1} (w[i]/b_i) )
 *
 * where b_i = (r[i]+x[i]) / m, with m = min_{0<=i<N}(r[i]+x[i]),
 * and d_i = (r[i]+x[i]) / r[i].
 * 
 * This function also logs the arrays of b_i and d_i.
 */
function computeAnalyticalAlpha2(x, r, w) {
  const N = r.length;
  let { minVal: m } = computeMinValue(r, x);
  let B = new Decimal(1);
  let W = new Decimal(1);
  let bArray = [];
  let dArray = [];

  for (let i = 0; i < N; i++) {
    let b_i = new Decimal(r[i]).plus(x[i]).div(m);
    let d_i = new Decimal(r[i]).plus(x[i]).div(r[i]);
    bArray.push(b_i);
    dArray.push(d_i);
    // W is computed as the product of w[i]^(1/N)
    W = W.mul(new Decimal(w[i]).pow(new Decimal(1).div(N)));
    B = B.mul(b_i.pow(new Decimal(1).div(N)));
  }

  // Multiply W by N as per derivation
  W = new Decimal(N).mul(W);

  let prod = new Decimal(1);
  for (let i = 0; i < N; i++) {
    let d_i = dArray[i];
    let exponent = new Decimal(w[i]).div(W).neg(); // -w[i]/W
    prod = prod.mul(d_i.pow(exponent));
  }

  // Final computation for alpha
  let alpha = new Decimal(1).minus(B.mul(new Decimal(1).minus(prod)));

  // console.log("W", W.toString());
  // console.log("B", B.toString());
  // console.log("prod", prod.toString());
  
  return alpha;
}


/**
 * Chebyshev’s method to find Delta such that f(Delta) = 0.
 * The update formula is:
 *
 *   Delta_{n+1} = Delta_n - f(Delta_n)/f_first_derivative(Delta_n)
 *                  - (1/2)[f(Delta_n)]^2 * f_second_derivative(Delta_n)/[f_first_derivative(Delta_n)]^3.
 *
 * The method has cubic convergence when f is sufficiently smooth.
 * Here, the maximum allowed Delta is m = min_{0<=i<N}(r[i]+x[i]).
 */
function chebyshevMethod(r, x, w, tol = 1e-200, maxIter = 10) {
  const N = r.length;
  // 1) Compute the minimum value m and its index.
  let { minVal: domainMaxVal, minIndex: domainMaxIdx } = computeMinValue(r, x);
  console.log("domainMax:", domainMaxVal.toString(), "at index:", domainMaxIdx);

  // 2) Compute analytical alpha (both versions) and print them.
  const alpha1 = computeAnalyticalAlpha(x, r, w);
  console.log("Analytical alpha 1 =", alpha1.toString());

  const alpha2 = computeAnalyticalAlpha2(x, r, w);
  console.log("Analytical alpha 2 =", alpha2.toString());

  // Set initial guess as: Delta_initial = m * (1 - alpha)
  let Delta = domainMaxVal.mul(new Decimal(1).sub(alpha1));
  console.log("Initial guess for Delta (analytical):", Delta.toString());

  // 3) Chebyshev iteration:
  for (let iter = 0; iter < maxIter; iter++) {
    const fVal = f(Delta, r, x, w);
    const fDeriv = f_first_derivative(Delta, r, x, w);
    const fSec = f_second_derivative(Delta, r, x, w);

    let nextDelta = Delta.minus(fVal.div(fDeriv))
      .minus(fVal.pow(2).mul(fSec).div(fDeriv.pow(3)).div(2));

    if (nextDelta.lessThan(0) || nextDelta.greaterThan(domainMaxVal)) {
      console.log("Delta is out of range; clamping by averaging with domainMaxVal.");
      nextDelta = Delta.plus(domainMaxVal).dividedBy(2);
    }

    const diff = deltaDifference(Delta, nextDelta);
    console.log(
      `Iter ${iter}: Delta = ${Delta.toFixed(7)}, f(Delta) = ${fVal.toExponential(3)}, |Δ diff| = ${diff.toExponential(3)}`
    );

    if (fVal.abs().lessThan(new Decimal(tol)) && diff.lessThan(new Decimal(tol))) {
      // console.log(`Converged in ${iter} iterations. Final Delta = ${nextDelta.toFixed(100)}`);
      return { solution: nextDelta, domainMaxVal, domainMaxIdx };
    }

    Delta = nextDelta;
  }
  console.log("Chebyshev's method did not converge within the maximum iterations.");
  return null;
}


// =================================
// Example Usage of newtonAlphaMethod
// =================================
const r = [2000, 2000, 2000, 534, 1000];         // Example reserves for each token
const x = [400, 40, 5, 7, 47];            // Example additional amounts for each token
const w = [1/10, 3/10, 2/10, 2/10, 2/10];         // Weights (summing to 1)

const result = chebyshevMethod(r, x, w);
if (result !== null) {
  const { solution, domainMaxVal, domainMaxIdx } = result;
  console.log(`\nChebyshev's Method: Final Delta = ${solution.toFixed(100)}`);
} else {
  console.log("No solution was found via Chebyshev's method.");
}

import Decimal from 'decimal.js';

// Set the precision (e.g., 100 significant digits)
Decimal.set({ precision: 1000 });

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
 * computeAnalyticalAlpha(x, r, w)
 * Computes an initial guess for alpha using
 *   alpha = ∏_{i=0}^{N-1} ((r[i]+x[i])/r[i])^{-w[i]/w[minIndex]},
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
 * newtonAlphaMethod(r, x, w, tol, maxIter)
 * Solves for alpha using the update
 *   alpha_{n+1} = alpha_n - (1 - (∏ b_i^(w_i))/(∏ [d_i (alpha_n+b_i-1)]^(w_i))) 
 *                    / (∑ (w_i/(alpha_n+b_i-1)))
 * where
 *   b_i = (r[i]+x[i])/(L)  and  d_i = (r[i]+x[i])/r[i],
 * with L = min_{i} (r[i]+x[i]),
 * and recovers the final Delta via: Delta = (1-alpha)*L.
 */
function newtonAlphaMethod(r, x, w, tol = 1e-400, maxIter = 100) {
  const N = r.length;
  // L is now the benchmark: min_{0<=i<N} { r[i] + x[i] }
  const { minVal, minIndex } = computeMinValue(r, x);
  let L = minVal;

  // Precompute b_i and d_i for each i:
  // b_i = (r[i]+x[i])/L,  d_i = (r[i]+x[i])/r[i]
  let b = [];
  let d = [];
  for (let i = 0; i < N; i++) {
    let b_i = new Decimal(r[i]).plus(x[i]).div(L);
    b.push(b_i);
    let d_i = new Decimal(r[i]).plus(x[i]).div(r[i]);
    d.push(d_i);
  }

  // Precompute the constant product: ∏ b_i^(w[i])
  let productB = new Decimal(1);
  for (let i = 0; i < N; i++) {
    productB = productB.mul(b[i].pow(w[i]));
  }

  // Use analytical alpha as the initial guess.
  let alpha = computeAnalyticalAlpha(x, r, w);
  console.log("Initial guess for alpha:", alpha.toString());

  // Newton iteration in terms of alpha:
  for (let iter = 0; iter < maxIter; iter++) {
    // Compute productDAlpha = ∏ [d_i * (alpha + b_i - 1)]^(w[i])
    let productDAlpha = new Decimal(1);
    let sumDenom = new Decimal(0);
    for (let i = 0; i < N; i++) {
      // Compute term = d_i * (alpha + b_i - 1)
      let term = d[i].mul(alpha.plus(b[i]).minus(1));
      productDAlpha = productDAlpha.mul(term.pow(w[i]));

      // Accumulate the denominator: ∑ w[i] / (alpha + b_i - 1)
      sumDenom = sumDenom.plus(new Decimal(w[i]).div(alpha.plus(b[i]).minus(1)));
    }


    // The numerator of the update:
    let numerator = new Decimal(1).minus(productB.div(productDAlpha));
    let deltaAlpha = numerator.div(sumDenom);

    // Print the difference between successive alpha iterates:
    console.log("Alpha diff at iter", iter, ":", deltaAlpha.toExponential(3).toString());

    let newAlpha = alpha.minus(deltaAlpha);

    if (newAlpha.minus(alpha).abs().lessThan(new Decimal(tol))) {
      alpha = newAlpha;
      break;
    }
    alpha = newAlpha;

  }

  // Recover Delta using: Delta = (1 - alpha) * L
  let Delta = new Decimal(1).minus(alpha).mul(L);
  return Delta;
}

// =================================
// Example Usage of newtonAlphaMethod
// =================================
const r = [2000, 2000, 2000, 534, 1000];         // Example reserves for each token
const x = [400, 40, 5, 7, 47];            // Example additional amounts for each token
const w = [1/10, 3/10, 2/10, 2/10, 2/10];         // Weights (summing to 1)

const newtonDelta= newtonAlphaMethod(r, x, w);
console.log(`\nNewton-Alpha Method: Final Delta = ${newtonDelta.toFixed(100)}`);

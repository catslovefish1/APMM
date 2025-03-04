import Decimal from 'decimal.js';

// Set the precision (e.g., 100 significant digits)
Decimal.set({ precision: 500 });

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
 * Solves for alpha using a second‐order (Halley) update:
 * 
 *   f(α) = 1 - (∏ b_i^(w_i))/(∏ [d_i (α+b_i-1)]^(w_i))
 *   S = ∑ w_i/(α+b_i-1)
 *   T = ∑ w_i/(α+b_i-1)²
 *
 * and the Halley update:
 * 
 *   αₙ₊₁ = αₙ - (2 f S)/(2(1-f)S² + f(S²+T)).
 *
 * Here b_i = (r[i]+x[i])/L, d_i = (r[i]+x[i])/r[i] with
 * L = min_{i} (r[i]+x[i]), and the final Δ is given by Δ = (1-α)L.
 */
function newtonAlphaMethod(r, x, w, tol = 1e-200, maxIter = 100) {
  const N = r.length;
  // L is the benchmark: min_{0<=i<N} { r[i] + x[i] }
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

  // Halley iteration in terms of alpha:
  for (let iter = 0; iter < maxIter; iter++) {
    // Compute productDAlpha = ∏ [d_i * (alpha + b_i - 1)]^(w[i])
    let productDAlpha = new Decimal(1);
    let S = new Decimal(0); // S = sum_{i} w_i/(alpha+b_i-1)
    let T = new Decimal(0); // T = sum_{i} w_i/(alpha+b_i-1)^2
    for (let i = 0; i < N; i++) {
      let term = d[i].mul(alpha.plus(b[i]).minus(1));
      productDAlpha = productDAlpha.mul(term.pow(w[i]));

      let denom = alpha.plus(b[i]).minus(1);
      S = S.plus(new Decimal(w[i]).div(denom));
      T = T.plus(new Decimal(w[i]).div(denom.pow(2)));
    }
    
    // Compute f(alpha) = 1 - productB / productDAlpha.
    let fVal = new Decimal(1).minus(productB.div(productDAlpha));
    
    // Halley update:
    // delta = (2 f S) / (2 (1-f) S^2 + f (S^2+T))
    let numerator = new Decimal(2).mul(fVal).mul(S);
    let denominator = new Decimal(2).mul(new Decimal(1).minus(fVal)).mul(S.pow(2))
                      .plus(fVal.mul(S.pow(2).plus(T)));
    let deltaAlpha = numerator.div(denominator);

    console.log("Alpha diff at iter", iter, ":", deltaAlpha.toExponential(10));

    let newAlpha = alpha.minus(deltaAlpha);
    if (newAlpha.minus(alpha).abs().lessThan(new Decimal(tol))) {
      alpha = newAlpha;
      console.log(`Converged after ${iter} iterations.`);
      break;
    }
    alpha = newAlpha;
    console.log("Alpha at iter", iter, ":", alpha.toString());
  }

  // Recover Delta using: Delta = (1 - alpha) * L
  let Delta = new Decimal(1).minus(alpha).mul(L);
  return Delta;
}

// =================================
// Example Usage of newtonAlphaMethod
// =================================
const r = [20, 2000, 200000, 534, 1000];         // Example reserves for each token
const x = [4, 4, 5, 7, 47];            // Example additional amounts for each token
const w = [1/10, 3/10, 2/10, 2/10, 2/10];         // Weights (summing to 1)

const newtonDelta = newtonAlphaMethod(r, x, w);
console.log(`\nNewton-Alpha Method: Final Delta = ${newtonDelta.toFixed(100)}`);

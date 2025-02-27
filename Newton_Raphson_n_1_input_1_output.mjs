// Function to compute the invariant constant k = ∏_{i=1}^N r_i^(w_i)
function computeInvariant(r, w) {
  let k = 1;
  for (let i = 0; i < r.length; i++) {
    k *= Math.pow(r[i], w[i]);
  }
  return k;
}

// This function computes r1' for SwapN-1for1 using the formula:
//   r1' = ( k / ∏_{i=2}^N (r_i + Δ)^(w_i) )^(1 / w1)
// where k = ∏_{i=1}^N r_i^(w_i)
function swapNMinus1For1(r, w, Delta) {
  // Calculate the invariant constant k
  const k = computeInvariant(r, w);

  // Calculate the product for tokens i2, i3, ..., iN
  let product = 1;
  for (let i = 1; i < r.length; i++) {
    product *= Math.pow(r[i] + Delta, w[i]);
  }

  // Compute r1' using the formula: r1' = (k / product)^(1 / w[0])
  const r1Prime = Math.pow(k / product, 1 / w[0]);
  return r1Prime;
}

// Test code for SwapN-1for1
function testSwapNMinus1For1() {
  // Example reserves and weights for 3 tokens:
  // r[0]: reserve for token i1
  // r[1], r[2]: reserves for tokens i2 and i3 respectively
  const r = [1000, 2000, 3000];  // Example reserves
  const w = [0.5, 0.3, 0.2];      // Example weights
  const Delta = 60;              // Input Δ for tokens i2, i3, ...

  // Compute r1' and the output amount (r1 - r1')
  const r1Prime = swapNMinus1For1(r, w, Delta);
  const outputAmount = r[0] - r1Prime;

  console.log("=== SwapN-1for1 Test ===");
  console.log("Reserves (r):", r);
  console.log("Weights (w):", w);
  console.log("Delta (input for tokens i2, i3, ...):", Delta);
  console.log("Computed r1':", r1Prime);
  console.log("Output (r1 - r1'):", outputAmount);
}

// Run the test
testSwapNMinus1For1();

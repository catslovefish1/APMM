// Function f(Delta) = (r1+x - Delta)*product_{i=2}^{N} (r_i - Delta) - constant,
// where constant = product_{i=1}^{N} r[i].
function f(Delta, r, x) {
  const N = r.length;
  // Compute the product: first term is (r[0] + x - Delta)
  let prod = (r[0] + x - Delta);
  for (let i = 1; i < N; i++) {
    prod *= (r[i] - Delta);
  }
  // Compute constant: product of all r[i] (without the x addition)
  const prodR = r.reduce((acc, val) => acc * val, 1);
  return prod - prodR;
}

// Derivative: f'(Delta) = -[ (r[0]+x-Delta)*∏_{i=1}^{N-1}(r[i]-Delta) ] *
//                            [ 1/(r[0]+x-Delta) + Σ_{i=1}^{N-1} 1/(r[i]-Delta) ]
function fPrime(Delta, r, x) {
  const N = r.length;
  // Compute the product for derivative (using same structure as in f)
  let prod = (r[0] + x - Delta);
  for (let i = 1; i < N; i++) {
    prod *= (r[i] - Delta);
  }
  // Compute the sum: 1/(r[0]+x-Delta) for the first element, and 1/(r[i]-Delta) for the rest.
  let sum = 1 / (r[0] + x - Delta);
  for (let i = 1; i < N; i++) {
    sum += 1 / (r[i] - Delta);
  }
  return -prod * sum;
}

// Newton-Raphson method implementation with domain restriction
// r: array of r_i values, x: additional constant for the first term,
// tol: tolerance, maxIter: maximum iterations
function newtonMethod(r, x, tol = 1e-7, maxIter = 100) {
  // Compute the maximum allowed Delta: min(r[0]+x, r[1], r[2], ..., r[N-1])
  const domainMax = Math.min(x, ...r.slice(1));
  console.log(x, ...r.slice(1))

  let Delta = 0; // initial guess
  if (Delta >= domainMax) {
    throw new Error("Initial guess is out of domain.");
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const fVal = f(Delta, r, x);

    // Log the current iteration, Delta, and f(Delta)
    console.log(`Iteration ${iter}: Delta = ${Delta}, f(Delta) = ${fVal}`);


    if (Math.abs(fVal) < tol) {
      console.log(`Converged in ${iter} iterations.`);
      return Delta;
    }
    const fpVal = fPrime(Delta, r, x);
    if (fpVal === 0) {
      throw new Error("Zero derivative encountered. Stopping iteration.");
    }
    let nextDelta = Delta - fVal / fpVal;

    // Clamp nextDelta to remain in the valid domain: [0, domainMax)
    if (nextDelta < 0) nextDelta = 0;
    if (nextDelta >= domainMax) nextDelta = domainMax - tol; // subtract a small epsilon

    Delta = nextDelta;
  }
  throw new Error("Newton's method did not converge within the maximum number of iterations");
}

// Example usage:
const r = [20, 300, 4, 5, 2000, 1]; // Example r values: r1, r2, r3
const x = 100;        // Example x value
try {
  const solution = newtonMethod(r, x);
  console.log("Solution for Delta:", solution);
} catch (error) {
  console.error(error.message);
}

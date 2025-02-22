import Decimal from 'decimal.js';

// Set the precision (e.g., 40 significant digits)
Decimal.set({ precision: 3000 });

// Function f(Delta) = (r1+x - Delta)*product_{i=2}^{N} (r_i - Delta) - constant,
// where constant = product_{i=1}^{N} r[i].
function f(Delta, r, x) {
  const N = r.length;
  let DeltaDec = new Decimal(Delta);
  let xDec = new Decimal(x);

  // First term: (r[0] + x - Delta)
  let prod = new Decimal(r[0]).plus(xDec).minus(DeltaDec);
  for (let i = 1; i < N; i++) {
    prod = prod.mul(new Decimal(r[i]).minus(DeltaDec));
  }

  // Constant: product of all r[i] (without x addition)
  const prodR = r.reduce((acc, val) => acc.mul(new Decimal(val)), new Decimal(1));
  return prod.minus(prodR);
}

// Derivative: 
// f'(Delta) = -prod * ( 1/(r[0]+x-Delta) + Σ_{i=2}^N 1/(r[i]-Delta) )
// where prod = ∏_{i=1}^{N} (r_i + x*δ_{i1} - Delta)
function fPrime(Delta, r, x) {
  const N = r.length;
  let DeltaDec = new Decimal(Delta);
  let xDec = new Decimal(x);

  // Compute the product ∏_{i=1}^{N} (r_i + x*δ_{i1} - Delta)
  let prod = new Decimal(r[0]).plus(xDec).minus(DeltaDec);
  for (let i = 1; i < N; i++) {
    prod = prod.mul(new Decimal(r[i]).minus(DeltaDec));
  }

  // Compute the sum 1/(r[0]+x-Delta) + Σ_{i=2}^{N} 1/(r[i]-Delta)
  let sum = new Decimal(1).div(new Decimal(r[0]).plus(xDec).minus(DeltaDec));
  for (let i = 1; i < N; i++) {
    sum = sum.plus(new Decimal(1).div(new Decimal(r[i]).minus(DeltaDec)));
  }

  return prod.mul(sum).neg();
}

// Newton-Raphson method with domain restriction using Decimal.js
// r: array of r_i values, x: additional constant for the first term,
// tol: tolerance, maxIter: maximum iterations
function newtonMethod(r, x, tol = new Decimal('1e-2000'), maxIter = 100) {
  // Valid domain: Δ ∈ [0, min(r1+x, r2, r3, ..., rN))
  let domainMax = Decimal.min(new Decimal(r[0]).plus(x), ...r.slice(1).map(val => new Decimal(val)));
  console.log("Domain max:", domainMax.toString());

  let Delta = new Decimal(0); // initial guess
  if (Delta.greaterThanOrEqualTo(domainMax)) {
    throw new Error("Initial guess is out of domain.");
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const fVal = f(Delta, r, x);

        // console.log(`Iteration ${iter}: Delta = ${Delta.toString()}, f(Delta) = ${fVal.toString()}`);


    // Inside the Newton-Raphson loop, after computing fVal:
    let fStr = fVal.toString(); // e.g., "2.85302613520204060342044e-8"
    let exponentPart = "";
    const match = fStr.match(/e(.*)/);
    if (match) {
      exponentPart = "e" + match[1]; // this will be "e-8"
    } else {
      exponentPart = "e0"; // if no exponent part, assume exponent 0
    }
    console.log(`Iteration ${iter}: f(Delta) exponent = ${exponentPart}`);



    if (fVal.abs().lessThan(tol)) {
      console.log(`Converged in ${iter} iterations.`);
      return Delta;
    }

    const fpVal = fPrime(Delta, r, x);
    if (fpVal.equals(0)) {
      throw new Error("Zero derivative encountered. Stopping iteration.");
    }

    let nextDelta = Delta.minus(fVal.div(fpVal));

    // Clamp nextDelta to remain in the valid domain: [0, domainMax)
    if (nextDelta.lessThan(0)) nextDelta = new Decimal(0);
    if (nextDelta.greaterThanOrEqualTo(domainMax)) nextDelta = domainMax.minus(tol);

    Delta = nextDelta;
  }

  throw new Error("Newton's method did not converge within the maximum number of iterations");
}

// Example usage:
const r = [20, 300, 4, 5, 2000, 1];  // Example r values: r1, r2, r3, ...
const x = 100;                      // Example x value

try {
  const solution = newtonMethod(r, x);
  console.log("Solution for Delta:", solution.toString());
} catch (error) {
  console.error(error.message);
}

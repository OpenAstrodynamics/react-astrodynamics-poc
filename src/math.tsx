export const evalpoly = (x: number, p: number[]) => {
  const n = p.length;
  let ex = p[n-1];
  for (let i=n-2; i--; i<=0) {
    ex = x * ex + p[i]
  }
  return ex
}
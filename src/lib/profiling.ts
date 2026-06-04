export function profile<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  console.log(`${name}: ${(performance.now() - start).toFixed(2)}ms`);
  return result;
}

export async function profileAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  console.log(`${name}: ${(performance.now() - start).toFixed(2)}ms`);
  return result;
}

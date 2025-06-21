export function timeout(ms: number, message = "timeout") {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}
export default timeout;

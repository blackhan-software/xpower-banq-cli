export async function sleep(ms: number = 0): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
export default sleep;

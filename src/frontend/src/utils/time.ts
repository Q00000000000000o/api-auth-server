export const dateToTime = (dateStr: string): bigint => {
  if (!dateStr) return 0n;
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
};

export const timeToDate = (time: bigint | undefined): string => {
  if (!time) return "";
  try {
    return new Date(Number(time / 1_000_000n)).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export const formatDate = (time: bigint | undefined): string => {
  if (!time) return "至今";
  try {
    const d = new Date(Number(time / 1_000_000n));
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
  } catch {
    return "";
  }
};

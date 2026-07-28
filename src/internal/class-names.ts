export function classNames(...values: readonly (string | null | undefined | false)[]): string {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0).join(" ");
}

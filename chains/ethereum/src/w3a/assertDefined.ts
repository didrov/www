export function assertDefined<T>(value: T | null | undefined, msg = "value"): T {
    if (value) return value;
    throw new Error(`${msg} is undefined`);
}

export function getMissingRequiredFields(data: Record<string, unknown>, requiredFields: readonly string[]) {
  return requiredFields.filter((field) => {
    const value = data[field];

    if (typeof value === "string") {
      return value.trim().length === 0;
    }

    return value === undefined || value === null || value === "";
  });
}

export function parseJsonBody<T>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>;
}

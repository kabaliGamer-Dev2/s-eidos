// A fixture for the TypeScript suppression rule.

type Loaded = { value: string };

declare const maybe: Loaded | undefined;

// @ts-ignore
export const value = maybe.value;

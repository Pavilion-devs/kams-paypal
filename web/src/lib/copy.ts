// Minimal copy layer carried over from the Spoke design system (Kams uses plain strings elsewhere).
export type Placeholder<Template extends string> =
  Template extends `${string}{${infer Key}}${infer Rest}` ? Key | Placeholder<Rest> : never;
export type FillValues<Template extends string> = Record<Placeholder<Template>, string>;

const placeholderPattern = /\{([A-Za-z][A-Za-z0-9]*)\}/g;

export const fill = <Template extends string>(template: Template, values: FillValues<Template>): string => {
  const lookup: Record<string, string> = values;
  return template.replace(placeholderPattern, (match, key: string) => lookup[key] ?? match);
};

export const common = {
  close: "Close",
  tryAgain: "Try again",
  dismiss: "Dismiss",
  details: "Details",
  copyDetails: "Copy details",
  dragToClose: "Drag down to close",
  previousPage: "Previous page",
  nextPage: "Next page",
  page: "Page {page}",
  showMore: "Show more",
  loadingSection: "Loading {sectionName}",
  takingLonger: "Taking longer than usual.",
  steps: "Steps",
  stepOf: "Step {current} of {total}",
  copyAddress: "Copy",
  copyHash: "Copy",
  simulated: "Sandbox",
  referenceLabel: "Reference",
  errorCode: "Error code",
} as const;

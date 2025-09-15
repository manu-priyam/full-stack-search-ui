import Fuse from "fuse.js";

export function createFuzzyFilter(options: { label: string }[]) {
  const fuse = new Fuse(options, {
    keys: ["label"],
    threshold: 0.3,
  });

  return (candidate: any, inputValue: string) => {
    if (!inputValue) return true;
    const results = fuse.search(inputValue);
    return results.some((r) => r.item.label === candidate.label);
  };
}

const HARD_CUT_DESCRIPTION_LENGTH = 160;

export function cleanRecipeDescription(description: string) {
  const normalized = description.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const sourceEllipsisCleaned = normalized.replace(/[,\s]+[^\s.?!…]*\.{3}$/, "...");

  if (!sourceEllipsisCleaned || /[.!?…]$/.test(sourceEllipsisCleaned)) {
    return sourceEllipsisCleaned;
  }

  if (sourceEllipsisCleaned.length < HARD_CUT_DESCRIPTION_LENGTH) {
    return `${sourceEllipsisCleaned}...`;
  }

  const withoutLastToken = sourceEllipsisCleaned.replace(/\s+\S+$/, "").trim();
  return `${withoutLastToken || sourceEllipsisCleaned}...`;
}

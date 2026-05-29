const SMALL_NYT_IMAGE_VARIANT = /-mediumThreeByTwo(?:252|440)(?=(?:-v\d+)?\.(?:jpg|jpeg|png|webp)(?:\?|$))/i;

export function getRecipeImageSrc(imageUrl: string) {
  if (!imageUrl.includes("static01.nyt.com")) return imageUrl;
  if (imageUrl.includes("/28JPFLEX4/")) return imageUrl;

  const largerImageUrl = imageUrl.replace(SMALL_NYT_IMAGE_VARIANT, "-threeByTwoMediumAt2X");

  try {
    const url = new URL(largerImageUrl);
    url.searchParams.set("quality", "100");
    return url.toString();
  } catch {
    return largerImageUrl;
  }
}

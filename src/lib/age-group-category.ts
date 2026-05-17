/**
 * Maps an ageGroup string (as used by access-control + child profiles) to the
 * slug of the matching seeded Category. Used by createFlipbook/updateFlipbook
 * server actions to auto-set categoryId so the admin library grid stays
 * grouped correctly without exposing two redundant dropdowns to admins.
 */
export function categorySlugForAgeGroup(ageGroup: string | null | undefined): string {
  switch (ageGroup) {
    case "LITTLE_LOFTERS": return "little-lofters-0-3-years";
    case "LOFT_365":       return "loft-365-readers-ages-4-7";
    case "BIG_READERS":    return "big-readers-ages-8-plus";
    default:               return "all-ages";
  }
}

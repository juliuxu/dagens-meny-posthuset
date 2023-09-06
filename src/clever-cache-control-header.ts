export function isWeekendInNorway() {
  const timeZone = "Europe/Oslo";
  const shortWeekday = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    timeZone,
  });
  if (["Sat", "Sun"].includes(shortWeekday)) {
    return true;
  }
  return false;
}

export function getCleverCacheControlHeader(isMenuInResponse: boolean) {

  // During the weeknds there usually no menus, small chance of the response being stale
  if (isWeekendInNorway()) {
    return `public, max-age=0, s-maxage=${60 * 60 * 4}, stale-while-revalidate=${60 * 60 * 4}`;
  }

  // If it's a weekday but the menu is not yet ready, we want to be a bit more aggressive
  if (!isMenuInResponse) {
    return `public, max-age=0, s-maxage=${60 * 5}, stale-while-revalidate=${60 * 60}`;
  }

  // The menu is ready, we can be a bit more relaxed, probably won't change often
  return `public, max-age=0, s-maxage=${60 * 15}, stale-while-revalidate=${60 * 60 * 2}`;
}

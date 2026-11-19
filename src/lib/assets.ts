/**
 * Resolve a public asset against Vite's configured base path.
 *
 * The app can be served from the domain root (local development) or from a
 * subdirectory (GitHub Pages project site). Absolute `/images/...` paths would
 * break in the second case, so every public asset goes through this helper.
 */
export function publicAsset(path: string) {
  if (
    !path ||
    path.startsWith('media:') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    /^(?:[a-z]+:)?\/\//i.test(path)
  ) {
    return path;
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export const markSrc = publicAsset('mark.svg');

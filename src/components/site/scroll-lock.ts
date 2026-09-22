/**
 * Shared between the camera intro and the page scroller. `overflow: hidden`
 * stops a user scrolling, but not a programmatic one, so the scroller checks
 * this before moving the page itself.
 */
let locked = false;

export function setScrollLock(value: boolean) {
  locked = value;
}

export function isScrollLocked() {
  return locked;
}

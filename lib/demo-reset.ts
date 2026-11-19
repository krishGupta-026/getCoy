/**
 * "Reset demo data" lives in the header's settings modal, while the swipe state
 * lives in the Discover tab. They talk through one window event: the modal
 * announces a successful reset, and useDiscover reloads when it hears it.
 * (On /home nothing is listening, which is fine: Home is blank.)
 */
export const DEMO_RESET_EVENT = "coy:demo-reset";

export function announceDemoReset(): void {
  window.dispatchEvent(new CustomEvent(DEMO_RESET_EVENT));
}

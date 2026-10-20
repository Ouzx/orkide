/**
 * The CAD cursor (fine pointers, motion allowed): a crosshair with a pick box, marks on the
 * rulers, coordinates in the status line, and an object snap that glides to the nearest
 * endpoint, midpoint or centre of whatever interactive part is under the pointer.
 */
export const cad = {
  /** The loop stops this long after the pointer last moved. */
  idleAfter: 600,
  /** Millimetres per CSS pixel (96 px to the inch). */
  mmPerPx: 25.4 / 96,
  /** Parts the snap considers. */
  snapTo:
    "a, button, [data-snap], .o-plate, .o-note, .o-stage, .o-input, .o-vp, .o-qty, .o-step",
  /**
   * Parts where the visitor reads or types, and popovers (the top layer hides the crosshair): the
   * normal cursor comes back.
   */
  textual:
    "input, textarea, select, [contenteditable='true'], [popover], .prose-orkide, .o-lead, [data-cad-text]",
} as const;

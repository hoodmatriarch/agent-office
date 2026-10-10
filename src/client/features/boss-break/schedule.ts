export const BREAK_INTERVAL = 15 * 60 * 1000;

/** Missed breaks are skipped, rather than played in a burst on returning to the page. */
export class BreakSchedule {
  private next = Infinity;
  arm(now: number) { this.next = now + BREAK_INTERVAL; }
  due(now: number, audible: boolean): boolean {
    if (now < this.next) return false;
    this.next = now + BREAK_INTERVAL;
    return audible;
  }
}

/** One avatar per browser. Other visitors and separate browser profiles keep their own avatars. */
export class BrowserPresence {
  private channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('agent-office.active-tab');
  private id = crypto.randomUUID();
  private active = false;
  private notice: HTMLDivElement | null = null;
  constructor(private leave: () => void, private resume: () => void) {
    if (this.channel) this.channel.onmessage = event => {
      if (event.data?.type !== 'claim' || event.data.id === this.id || !this.active) return;
      this.active = false; this.leave();
      const notice = this.notice = document.createElement('div');
      notice.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#17232aee;display:grid;place-content:center;gap:20px;color:white;text-align:center;padding:30px';
      const text = document.createElement('p'); text.textContent = 'Your office is active in another tab. Only one tab controls your avatar.';
      const button = document.createElement('button'); button.className = 'btn'; button.textContent = 'Continue in this tab'; button.onclick = () => this.resume();
      notice.append(text, button); document.body.append(notice);
    };
  }
  claim() {
    if (this.active) return;
    this.active = true; this.notice?.remove(); this.notice = null;
    this.channel?.postMessage({ type: 'claim', id: this.id });
  }
}

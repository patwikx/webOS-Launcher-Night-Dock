/** Start optional discovery after input settles. Settings can cancel this wait
 * and request discovery immediately. Hidden pages wait until foregrounded. */
export function scheduleIdleDiscovery (work: () => void, quietMs = 600): () => void {
	let timer = 0, idle = 0, cancelled = false;
	const inputEvents = ['keydown', 'pointerdown', 'pointermove'];
	const clear = () => {
		window.clearTimeout(timer);
		timer = 0;
		if (idle) window.cancelIdleCallback(idle);
		idle = 0;
	};
	const cancel = () => {
		cancelled = true;
		clear();
		inputEvents.forEach(event => document.removeEventListener(event, arm));
		document.removeEventListener('visibilitychange', arm);
	};
	const run = () => {
		idle = 0;
		if (cancelled || document.hidden) return;
		cancel();
		work();
	};
	function arm () {
		clear();
		if (cancelled || document.hidden) return;
		timer = window.setTimeout(() => {
			timer = 0;
			if (typeof window.requestIdleCallback === 'function' && typeof window.cancelIdleCallback === 'function') {
				idle = window.requestIdleCallback(run, {timeout: 1500});
			} else run();
		}, quietMs);
	}
	inputEvents.forEach(event => document.addEventListener(event, arm, {passive: true}));
	document.addEventListener('visibilitychange', arm);
	arm();
	return cancel;
}

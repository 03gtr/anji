/**
 * Offline status while a new version installs in the background: it waits as
 * 'update' (never interrupts play), and late progress messages from the new
 * worker never hide the update again. Fake service worker objects only.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createOfflineStatus } from '../../src/game/core/sw-client.js';

const worker = (state) => Object.assign(new EventTarget(), { state, postMessage: vi.fn() });
const setState = (w, state) => {
  w.state = state;
  w.dispatchEvent(new Event('statechange'));
};
const message = (sw, data) => sw.dispatchEvent(Object.assign(new Event('message'), { data }));

function fakeNavigator({ controlled }) {
  const reg = Object.assign(new EventTarget(), { active: controlled ? worker('activated') : null, installing: controlled ? null : worker('installing'), waiting: null });
  const sw = Object.assign(new EventTarget(), { controller: controlled ? reg.active : null, register: vi.fn(async () => reg) });
  vi.stubGlobal('navigator', { serviceWorker: sw, storage: {} });
  return { sw, reg };
}

describe('offline status during install and update', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('first install: progress, then ready', async () => {
    const { sw, reg } = fakeNavigator({ controlled: false });
    const off = createOfflineStatus({ enabled: true });
    await off.start();
    expect(off.get().status).toBe('installing');
    message(sw, { type: 'precache-progress', done: 3, total: 36 });
    expect(off.get()).toMatchObject({ status: 'installing', done: 3, total: 36 });
    setState(reg.installing, 'installed');
    expect(off.get().status).toBe('ready');
  });

  it('an update waits as «update», even when its last progress messages arrive late', async () => {
    const { sw, reg } = fakeNavigator({ controlled: true });
    const off = createOfflineStatus({ enabled: true });
    await off.start();
    expect(off.get().status).toBe('ready');
    const next = worker('installing');
    reg.installing = next;
    reg.dispatchEvent(new Event('updatefound'));
    message(sw, { type: 'precache-progress', done: 10, total: 36 });
    expect(off.get().status).toBe('ready'); // playing offline is still fine meanwhile
    setState(next, 'installed');
    expect(off.get().status).toBe('update');
    message(sw, { type: 'precache-progress', done: 36, total: 36 }); // late
    message(sw, { type: 'precache-complete', total: 36 });
    expect(off.get().status).toBe('update');
  });

  it('applying the update asks the waiting worker to take over (the reload follows the switch)', async () => {
    const { reg } = fakeNavigator({ controlled: true });
    const off = createOfflineStatus({ enabled: true });
    await off.start();
    const next = worker('installing');
    reg.installing = next;
    reg.dispatchEvent(new Event('updatefound'));
    setState(next, 'installed');
    off.applyUpdate();
    expect(next.postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' });
  });
});

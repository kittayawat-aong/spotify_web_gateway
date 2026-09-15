import type { ServerResponse } from 'node:http';

const page = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spotify Remote</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #121212; color: #fff; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at top, #1db95433, transparent 42%), #121212; }
      main { width: min(100%, 430px); padding: 32px; border: 1px solid #ffffff1f; border-radius: 24px; background: #181818; box-shadow: 0 20px 70px #0008; }
      h1 { margin: 0; font-size: 1.8rem; } p { color: #b3b3b3; line-height: 1.5; }
      #track { min-height: 48px; margin: 28px 0 18px; font-weight: 700; font-size: 1.05rem; }
      label { display: grid; gap: 7px; margin-bottom: 18px; color: #b3b3b3; font-size: .85rem; }
      select { min-height: 42px; border: 1px solid #ffffff2c; border-radius: 10px; padding: 0 12px; background: #2a2a2a; color: #fff; font: inherit; }
      .controls { display: grid; grid-template-columns: 1fr 1.25fr 1fr; gap: 10px; }
      button, .authorize { min-height: 52px; border: 0; border-radius: 999px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; display: grid; place-items: center; }
      button { background: #2a2a2a; color: #fff; } button:hover { background: #3d3d3d; } button:disabled { cursor: wait; opacity: .6; }
      #play { background: #1db954; color: #071b0d; } #play:hover, .authorize:hover { background: #1ed760; }
      .authorize { margin-top: 24px; background: #1db954; color: #071b0d; }
      #status { min-height: 24px; font-size: .9rem; } .error { color: #ffb4ab; }
      [hidden] { display: none !important; }
    </style>
  </head>
  <body>
    <main>
      <h1>Spotify Remote</h1>
      <p id="status" aria-live="polite">กำลังตรวจสอบการเชื่อมต่อ…</p>
      <section id="unauthorized" hidden>
        <p>เชื่อมต่อบัญชี Spotify ก่อน จึงจะควบคุมการเล่นได้</p>
        <a class="authorize" href="/auth/login">Authorize Spotify</a>
      </section>
      <section id="remote" hidden>
        <div id="track">ยังไม่มีเพลงกำลังเล่น</div>
        <label>อุปกรณ์สำหรับเล่น
          <select id="device"><option value="">กำลังค้นหาอุปกรณ์…</option></select>
        </label>
        <div class="controls">
          <button type="button" data-action="pause" aria-label="Pause">พัก</button>
          <button type="button" id="play" data-action="play">เล่น</button>
          <button type="button" data-action="next" aria-label="Next track">ถัดไป</button>
        </div>
      </section>
    </main>
    <script>
      const status = document.querySelector('#status');
      const remote = document.querySelector('#remote');
      const unauthorized = document.querySelector('#unauthorized');
      const track = document.querySelector('#track');
      const device = document.querySelector('#device');
      const buttons = [...document.querySelectorAll('button')];

      async function request(path, options) {
        const response = await fetch(path, options);
        if (response.status === 401) { showUnauthorized(); throw new Error('Authorization is required'); }
        if (!response.ok && response.status !== 204) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || (body.error && (body.error.reason || body.error.message)) || 'Spotify returned an error (' + response.status + ')');
        }
        return response.status === 204 ? null : response.json();
      }

      function showUnauthorized() {
        remote.hidden = true; unauthorized.hidden = false;
        status.textContent = 'ยังไม่ได้เชื่อมต่อ Spotify';
        status.className = '';
      }

      async function refreshPlayback() {
        const playback = await request('/api/playback');
        const item = playback && playback.item;
        track.textContent = item ? item.name + ' — ' + item.artists.map(artist => artist.name).join(', ') : 'ยังไม่มีเพลงกำลังเล่น';
      }

      async function refreshDevices() {
        const result = await request('/api/devices');
        const devices = result.devices || [];
        device.replaceChildren();
        if (!devices.length) {
          device.add(new Option('ไม่พบอุปกรณ์ — เปิด Spotify บนอุปกรณ์ก่อน', ''));
          return;
        }
        devices.forEach(item => {
          const option = new Option(item.name + (item.is_active ? ' (กำลังใช้งาน)' : ''), item.id);
          option.selected = item.is_active;
          device.add(option);
        });
      }

      async function initialize() {
        try {
          const auth = await request('/api/auth/status');
          if (!auth.authorized) return showUnauthorized();
          status.textContent = 'เชื่อมต่อ Spotify แล้ว'; remote.hidden = false;
          await Promise.all([refreshPlayback(), refreshDevices()]);
        } catch (error) {
          if (unauthorized.hidden) { status.textContent = error.message; status.className = 'error'; }
        }
      }

      buttons.forEach(button => button.addEventListener('click', async () => {
        buttons.forEach(item => item.disabled = true);
        status.textContent = 'กำลังดำเนินการ…'; status.className = '';
        try {
          let path = '/api/' + button.dataset.action;
          if (button.dataset.action === 'play' && device.value) {
            path += '?device_id=' + encodeURIComponent(device.value);
          }
          await request(path, { method: 'POST' });
          status.textContent = 'เรียบร้อย';
          await Promise.all([refreshPlayback(), refreshDevices()]);
        } catch (error) {
          if (unauthorized.hidden) {
            status.textContent = error.message.includes('NO_ACTIVE_DEVICE')
              ? 'ยังไม่มีอุปกรณ์ที่พร้อมเล่น — เปิด Spotify บนอุปกรณ์ แล้วกดเล่นอีกครั้ง'
              : error.message;
            status.className = 'error';
          }
        } finally { buttons.forEach(item => item.disabled = false); }
      }));
      initialize();
    </script>
  </body>
</html>`;

export function renderUi(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
}

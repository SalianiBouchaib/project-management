(() => {
  const app = document.getElementById('app');
  const data = window.SEC_DATA;
  const state = {
    lang: 'en',
    incident: false,
    crowd: 68742,
    risk: 48,
    wearable: {
      connected: true,
      battery: 82,
      led: 'blue',
      vibration: 'right pulse',
      signal: 'Follow guidance'
    },
    scenarioRunning: false,
    scenarioStep: 0,
    routeStatus: 'Stable',
    alerts: [...data.alerts],
    activeRole: 'spectator'
  };
  const DEMO_STEP_DELAY_MS = 1800;
  const CROWD_DELTA_RANGE = 18;
  const MIN_CROWD_COUNT = 0;
  const RANDOM_CENTER_OFFSET = 0.5;
  const RISK_DELTA_RANGE = 7;
  const RISK_DELTA_BIAS = 0.4;
  const MIN_RISK_LEVEL = 8;
  const MAX_RISK_LEVEL = 96;
  const MIN_BATTERY_LEVEL = 20;
  const MAX_ALERT_HISTORY = 5;
  const BATTERY_DRAIN_RATE = 0.15;
  const ALERT_GENERATION_THRESHOLD = 0.72;

  const t = (k) => data.translations[state.lang][k] || k;
  const isRoute = (r) => location.hash.startsWith(r);

  const navFor = (items) => `<nav class="sidebar" aria-label="Section navigation">${items
    .map((i) => `<a href="${i.href}" class="${location.hash === i.href ? 'active' : ''}">${i.label}</a>`)
    .join('')}</nav>`;

  function topbar(extra = '') {
    return `<header class="topbar">
      <div class="brand">${t('appName')}</div>
      <div class="toolbar">
        <button aria-label="Toggle language" id="langBtn">${state.lang.toUpperCase()}</button>
        <a class="btn" href="#/login" aria-label="Go to login">${t('login')}</a>
        <button class="btn btn-danger" id="demoBtn" aria-label="Start scenario demo">${t('startDemo')}</button>
        ${extra}
      </div>
    </header>`;
  }

  function wearableCard() {
    const w = state.wearable;
    const battery = Math.round(w.battery);
    const flashing = w.signal.includes('nearby') || w.signal.includes('alert') ? 'flash' : '';
    return `<section class="card" aria-label="Wearable status">
      <h3>Wearable Sync</h3>
      <div class="wearable">
        <div class="band ${w.led} ${flashing}"></div>
        <div>
          <p><span class="status ${w.connected ? 'safe' : 'danger'}">${w.connected ? 'Connected' : 'Disconnected'}</span></p>
          <p class="muted">Battery: ${battery}%</p>
          <p class="muted">LED: ${w.led.toUpperCase()}</p>
          <p class="muted">Vibration: ${w.vibration}</p>
          <p class="muted">Signal: ${w.signal}</p>
          <button class="btn" id="testWearable" aria-label="Test wearable mode">Test bracelet</button>
        </div>
      </div>
      <ul class="muted">
        <li>Red LED + strong vibration = danger</li>
        <li>Green LED = safe direction</li>
        <li>Blue LED = follow guidance</li>
        <li>Left/right vibration = direction guidance</li>
        <li>Long vibration = emergency mode activated</li>
        <li>Flashing LED = group member nearby / alert received</li>
      </ul>
    </section>`;
  }

  function loginView() {
    return `${topbar()}<main class="layout" aria-label="Login and role selection">
      <section class="main grid">
        <article class="card">
          <h2>${t('roleSelect')}</h2>
          <div class="role-cards">
            ${data.roles.map((r) => `<a class="role" href="${r.route}" aria-label="Choose ${r.id} role" style="box-shadow:0 0 24px color-mix(in srgb, ${r.color}, transparent 75%)">
              <div><strong>${r.icon} ${t(r.id)}</strong><p class="muted">Role-focused emergency workflow</p></div><button class="cta" aria-hidden="true">→</button>
            </a>`).join('')}
          </div>
        </article>

        <article class="card">
          <h3>${t('login')}</h3>
          <form class="form" aria-label="Mock login form">
            <label>${t('email')}<input type="text" autocomplete="username" placeholder="name@event.com" /></label>
            <label>${t('password')}<input type="password" autocomplete="current-password" placeholder="••••••••" /></label>
            <button type="button" class="btn-primary">${t('login')}</button>
            <button type="button" class="btn">${t('qrScan')}</button>
          </form>
          <div class="actions" style="margin-top:10px">
            <button class="btn" type="button" id="connectWearable">${t('connectWearable')}</button>
            <a class="btn btn-danger" href="#/spectator/emergency">${t('quickEmergency')}</a>
          </div>
        </article>
      </section>
    </main>`;
  }

  function spectatorView(route) {
    const tabs = [
      ['#/spectator/home', 'Home'], ['#/spectator/map', 'Smart Map'], ['#/spectator/guidance', 'AI Guidance'], ['#/spectator/ar', 'AR Guidance'],
      ['#/spectator/emergency', 'Emergency'], ['#/spectator/group', 'Group-Safe'], ['#/spectator/offline', 'Offline'], ['#/spectator/wearable', 'Wearable']
    ].map(([href, label]) => ({ href, label }));

    let content = '';
    if (route === 'home') {
      content = `<div class="grid grid-2">
        <section class="card"><h3>Overview</h3><p><span class="status ${state.incident ? 'danger' : 'safe'}">${state.incident ? 'Incident active' : 'Zone secure'}</span></p>
          <p class="muted">Current zone: North Stand B2</p>
          <div class="map" aria-label="Mini map"><span class="poi" style="top:20%;left:35%"></span><span class="poi" style="top:55%;left:70%"></span><span class="route-dot" style="top:48%;left:47%"></span></div>
          <p>${t('nearestExit')}: B3 (2m 30s)</p>
          <div class="actions"><a class="btn btn-danger" href="#/spectator/emergency">${t('emergencyMode')}</a><a class="btn btn-primary" href="#/spectator/guidance">${t('guideMe')}</a></div>
        </section>
        ${wearableCard()}
      </div>`;
    }
    if (route === 'map') {
      content = `<div class="grid grid-2"><section class="card"><h3>Smart Map</h3><p class="muted">Live POIs, exits, and guided route</p>
        <div class="map" aria-label="Interactive map mock"><span class="poi" style="top:18%;left:18%"></span><span class="poi" style="top:64%;left:35%"></span><span class="poi" style="top:42%;left:78%"></span>
          <span class="route-dot" style="top:76%;left:21%"></span><span class="route-dot" style="top:63%;left:31%"></span><span class="route-dot" style="top:49%;left:42%"></span><span class="route-dot" style="top:40%;left:53%"></span>
        </div><button class="btn btn-primary">Start route</button></section>${wearableCard()}</div>`;
    }
    if (route === 'guidance') {
      content = `<div class="grid grid-2"><section class="card"><h3>AI Guidance</h3>
        <p><span class="status info">Route: ${state.routeStatus}</span> <span class="status safe">ETA 03:12</span></p>
        <p class="muted">Turn-by-turn: move ahead 80m, then right to Exit B3.</p>
        <div class="chart-bar" aria-hidden="true"></div>
        <div class="actions"><button class="btn">Recalculate route</button><a class="btn" href="#/spectator/ar">Open AR Overlay</a></div>
      </section>${wearableCard()}</div>`;
    }
    if (route === 'ar') {
      content = `<div class="grid grid-2"><section class="card"><h3>AR Guidance (mock)</h3>
        <div class="arrow-overlay" aria-label="Camera-like AR overlay">➜</div>
        <p class="muted">Follow arrows and exit markers; minimal text for stress conditions.</p>
      </section>${wearableCard()}</div>`;
    }
    if (route === 'emergency') {
      content = `<div class="grid grid-2"><section class="card"><h3>${t('emergencyMode')}</h3>
        <p><span class="status danger demo-chip">ALERT LEVEL HIGH</span></p>
        <button class="btn btn-danger" style="width:100%;padding:18px;font-size:1.2rem">SOS - I need help</button>
        <p>${t('nearestExit')}: Exit B3</p>
        <div class="actions"><a class="btn btn-primary" href="#/spectator/guidance">${t('guideMe')}</a><button class="btn">Notify group</button></div>
      </section>${wearableCard()}</div>`;
    }
    if (route === 'group') {
      content = `<div class="grid grid-2"><section class="card"><h3>Group-Safe</h3>
        ${data.groupMembers.map((g) => `<p><strong>${g.name}</strong> <span class="status ${g.status === 'Safe' ? 'safe' : 'warn'}">${g.status}</span> <span class="muted">${g.distance}</span></p>`).join('')}
        <p class="muted">Meeting point: P1 - East Concourse</p>
        <div class="actions"><button class="btn">Create QR</button><button class="btn">Join QR</button><button class="btn">Find group</button></div>
      </section>${wearableCard()}</div>`;
    }
    if (route === 'offline') {
      content = `<div class="grid grid-2"><section class="card"><h3>Offline Emergency</h3>
        <p><span class="status warn">Bluetooth mesh active</span> <span class="status info">Offline map available</span></p>
        <p class="muted">Local peer alerts continue even if internet is unstable.</p>
      </section>${wearableCard()}</div>`;
    }
    if (route === 'wearable') {
      content = `<div class="grid grid-2"><section class="card"><h3>Wearable Sync Center</h3>
        <p><span class="status safe">Bracelet connected</span></p>
        <p class="muted">Battery ${state.wearable.battery}% · vibration + LED guidance enabled</p>
        <div class="actions"><button class="btn">Vibration mode</button><button class="btn">LED mode</button><button class="btn">Run emergency test</button></div>
      </section>${wearableCard()}</div>`;
    }

    return `${topbar()}<main class="layout"><aside>${navFor(tabs)}</aside><section class="main">${content}</section></main>`;
  }

  function lineChartSvg(points = [70, 62, 78, 66, 58, 48]) {
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 48 + 10} ${100 - p}`).join(' ');
    return `<svg viewBox="0 0 260 100" width="100%" height="110" role="img" aria-label="Trend chart">
      <rect x="0" y="0" width="260" height="100" fill="#0d1528"></rect>
      <path d="${path}" stroke="#38a6ff" stroke-width="4" fill="none"></path>
      <path d="${path} L 250 100 L 10 100 Z" fill="rgba(56,166,255,.18)"></path>
    </svg>`;
  }

  function agentView(route) {
    const tabs = [
      { href: '#/agent/dashboard', label: 'Dashboard' },
      { href: '#/agent/intervention', label: 'Intervention' }
    ];
    const dashboard = `<div class="kpis">
      <article class="kpi"><span class="muted">Zone spectators</span><strong>2,450</strong></article>
      <article class="kpi"><span class="muted">Active alerts</span><strong>2</strong></article>
      <article class="kpi"><span class="muted">Interventions</span><strong>1</strong></article>
      <article class="kpi"><span class="muted">Nearby teams</span><strong>3</strong></article>
    </div>
    <div class="grid grid-2">
      <section class="card"><h3>Assigned Zone B2</h3><div class="map"><span class="poi" style="top:32%;left:42%"></span><span class="poi" style="top:54%;left:66%"></span><span class="poi" style="top:62%;left:31%"></span></div>
        <p class="muted">Danger cluster at Gate B2.</p></section>
      <section class="card"><h3>Alerts</h3>
        ${state.alerts.map((a) => `<p><span class="status ${a.type === 'critical' ? 'danger' : a.type === 'warning' ? 'warn' : 'info'}">${a.type}</span> ${a.msg}</p>`).join('')}
        <h3>Nearby teams</h3>${data.teams.map((tm) => `<p><strong>${tm.name}</strong> <span class="muted">${tm.distance}</span> ${tm.status}</p>`).join('')}
      </section>
      <section class="card"><h3>Quick Actions</h3><div class="actions"><button class="btn">Request backup</button><button class="btn">Report incident</button><button class="btn">Open/close access</button><button class="btn">Push-to-talk</button></div></section>
      ${wearableCard()}
    </div>`;

    const intervention = `<div class="grid grid-2">
      <section class="card"><h3>Intervention</h3>
        <p><span class="status warn">AI recommendation</span> Block Lane 7, redirect to Exit E12, request Team Bravo.</p>
        <p class="muted">Route to critical zone: 2m 10s</p>
        <div class="actions"><button class="btn btn-primary">On my way</button><button class="btn">Handled</button><button class="btn btn-danger">Need support</button></div>
      </section>
      <section class="card"><h3>Command Center Chat (mock)</h3>
        <p><strong>HQ:</strong> Confirm crowd split started?</p>
        <p><strong>You:</strong> Yes, moving barriers now.</p>
        <input type="text" aria-label="chat input" placeholder="Type update" />
      </section>
      ${wearableCard()}
    </div>`;

    return `${topbar()}<main class="layout"><aside>${navFor(tabs)}</aside><section class="main">${route === 'intervention' ? intervention : dashboard}</section></main>`;
  }

  function organizerView(route) {
    const tabs = [
      { href: '#/organizer/command-center', label: 'Command Center' },
      { href: '#/organizer/digital-twin', label: 'Digital Twin' },
      { href: '#/organizer/post-incident', label: 'Post-Incident' }
    ];

    const command = `<div class="kpis">
      <article class="kpi"><span class="muted">Spectators</span><strong>${state.crowd.toLocaleString()}</strong></article>
      <article class="kpi"><span class="muted">Active alerts</span><strong>${state.alerts.length}</strong></article>
      <article class="kpi"><span class="muted">Open exits</span><strong>18/24</strong></article>
      <article class="kpi"><span class="muted">${t('globalRisk')}</span><strong>${state.risk}%</strong></article>
    </div>
    <div class="grid grid-2">
      <section class="card"><h3>Digital Twin Stadium View</h3>
        <div class="map" style="height:260px" aria-label="Digital twin stadium map">
          <span class="poi" style="top:14%;left:20%"></span><span class="poi" style="top:27%;left:70%"></span><span class="poi" style="top:67%;left:33%"></span><span class="poi" style="top:75%;left:76%"></span>
        </div>
        <div class="actions"><button class="btn">2D</button><button class="btn">3D</button><button class="btn">Thermal</button><button class="btn">Flow</button><button class="btn">Sensors</button></div>
      </section>
      <section class="card"><h3>${t('liveAlerts')}</h3>
        ${state.alerts.map((a) => `<p><span class="status ${a.type === 'critical' ? 'danger' : a.type === 'warning' ? 'warn' : 'info'}">${a.zone}</span> ${a.msg}</p>`).join('')}
        <h3>Spectator distribution</h3>
        <p class="muted">North 28% · South 24% · East 26% · West 22%</p>
        ${lineChartSvg([28, 24, 26, 22, 29, 24])}
      </section>
      <section class="card"><h3>AI Flow Prediction & Simulation</h3>
        <p class="muted">Projected congestion in B2 within 6 min if no intervention.</p>
        <div class="actions"><button class="btn">Simulate scenario</button><button class="btn">Deploy Team Alpha</button><button class="btn">Send global alert</button><button class="btn">Public announcement</button></div>
      </section>
      <section class="card"><h3>${t('systemHealth')}</h3>
        <p><span class="status safe">Cameras 99%</span> <span class="status safe">Sensors 97%</span> <span class="status safe">Network 96%</span></p>
        <h4>Timeline</h4>
        <ul class="timeline"><li>14:15 Crowd spike detected</li><li>14:16 AI alert pushed to agents</li><li>14:18 Dynamic routing started</li></ul>
      </section>
    </div>`;

    const digitalTwin = `<div class="grid grid-2">
      <section class="card"><h3>Digital Twin Detailed View</h3>
        <div class="map" style="height:320px" aria-label="Detailed twin"> <span class="poi" style="top:15%;left:22%"></span><span class="poi" style="top:34%;left:58%"></span><span class="poi" style="top:58%;left:42%"></span><span class="poi" style="top:76%;left:65%"></span></div>
        <p class="muted">Overlay modes: occupancy, thermal, evacuation vector, IoT sensors.</p>
      </section>
      <section class="card"><h3>Scenario Preview</h3>
        <p><span class="status warn">Scenario:</span> Partial gate closure + reroute to exits E11-E14.</p>
        <table class="table"><thead><tr><th>Zone</th><th>Risk</th><th>ETA to safe</th></tr></thead><tbody><tr><td>B2</td><td><span class="status danger">Critical</span></td><td>5m</td></tr><tr><td>C4</td><td><span class="status warn">Elevated</span></td><td>4m</td></tr><tr><td>E1</td><td><span class="status safe">Safe</span></td><td>2m</td></tr></tbody></table>
      </section>
    </div>`;

    const post = `<div class="grid grid-3">
      <section class="card"><h3>Incident KPIs</h3><p class="muted">Duration: 32 min</p><p class="muted">People assisted: 1,248</p><p class="muted">Interventions: 28</p></section>
      <section class="card"><h3>Heatmap Summary</h3><div class="map" style="height:180px"></div></section>
      <section class="card"><h3>AI Recommendations</h3><ul><li>Increase staff at B2 during peak ingress</li><li>Add directional signage in hallways 6-8</li><li>Pre-open exits E10-E14 for finals</li></ul></section>
    </div>
    <div class="grid grid-2">
      <section class="card"><h3>Critical Zones Table</h3><table class="table"><thead><tr><th>Zone</th><th>Risk</th><th>Duration</th></tr></thead><tbody><tr><td>B2</td><td>Critical</td><td>14m</td></tr><tr><td>C3</td><td>High</td><td>9m</td></tr><tr><td>D1</td><td>Medium</td><td>5m</td></tr></tbody></table></section>
      <section class="card"><h3>Timeline</h3><ul class="timeline"><li>14:15 Detection</li><li>14:16 Agent dispatch</li><li>14:22 Exit rerouting</li><li>14:47 Resolution</li></ul>${lineChartSvg([18, 35, 62, 81, 55, 22])}<button class="btn">Export report</button></section>
    </div>`;

    return `${topbar('<span class="status info">Organizer View</span>')}<main class="layout desktop-wide"><aside>${navFor(tabs)}</aside><section class="main">${route === 'digital-twin' ? digitalTwin : route === 'post-incident' ? post : command}</section><aside>${wearableCard()}</aside></main>`;
  }

  function setDemoState(step) {
    state.scenarioStep = step;
    switch (step) {
      case 1:
        location.hash = '#/login';
        state.incident = false;
        state.wearable.led = 'blue';
        state.wearable.vibration = 'idle';
        state.wearable.signal = 'Connected';
        break;
      case 2:
        location.hash = '#/spectator/wearable';
        state.activeRole = 'spectator';
        state.wearable.connected = true;
        state.wearable.signal = 'Follow guidance';
        break;
      case 3:
        state.incident = true;
        state.alerts.unshift({ type: 'critical', msg: 'Emergency declared in zone B2', zone: 'B2' });
        location.hash = '#/spectator/home';
        break;
      case 4:
        location.hash = '#/spectator/emergency';
        state.wearable.led = 'red';
        state.wearable.vibration = 'long vibration';
        state.wearable.signal = 'Danger';
        break;
      case 5:
        location.hash = '#/spectator/guidance';
        state.wearable.led = 'blue';
        state.wearable.vibration = 'right then left';
        state.wearable.signal = 'Follow guidance';
        break;
      case 6:
        location.hash = '#/agent/intervention';
        break;
      case 7:
        location.hash = '#/organizer/command-center';
        state.wearable.led = 'green';
        state.wearable.vibration = 'short pulse';
        state.wearable.signal = 'Safe direction';
        break;
      case 8:
        location.hash = '#/organizer/post-incident';
        state.incident = false;
        break;
      default:
        state.scenarioRunning = false;
    }
    render();
  }

  function startScenario() {
    if (state.scenarioRunning) return;
    state.scenarioRunning = true;
    const steps = [1, 2, 3, 4, 5, 6, 7, 8];
    steps.forEach((s, i) => setTimeout(() => setDemoState(s), i * DEMO_STEP_DELAY_MS));
    setTimeout(() => {
      state.scenarioRunning = false;
      render();
    }, steps.length * DEMO_STEP_DELAY_MS + 300);
  }

  function bindEvents() {
    document.getElementById('langBtn')?.addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'fr' : 'en';
      render();
    });
    document.getElementById('demoBtn')?.addEventListener('click', startScenario);
    document.getElementById('connectWearable')?.addEventListener('click', () => {
      state.wearable.connected = !state.wearable.connected;
      state.wearable.signal = state.wearable.connected ? 'Connected' : 'Disconnected';
      render();
    });
    document.getElementById('testWearable')?.addEventListener('click', () => {
      state.wearable.led = state.wearable.led === 'green' ? 'blue' : 'green';
      state.wearable.vibration = 'left/right pulse';
      state.wearable.signal = 'group member nearby alert';
      render();
    });
  }

  function render() {
    const hash = location.hash || '#/login';
    let html = '';
    if (hash === '#/login') html = loginView();
    else if (isRoute('#/spectator/')) html = spectatorView(hash.split('/')[2]);
    else if (isRoute('#/agent/')) html = agentView(hash.split('/')[2]);
    else if (isRoute('#/organizer/')) html = organizerView(hash.split('/')[2]);
    else html = loginView();
    app.innerHTML = `<div class="app-shell">${html}</div>`;
    bindEvents();
  }

  const liveUpdateInterval = setInterval(() => {
    state.crowd = Math.max(MIN_CROWD_COUNT, state.crowd + Math.round((Math.random() - RANDOM_CENTER_OFFSET) * CROWD_DELTA_RANGE));
    state.risk = Math.max(MIN_RISK_LEVEL, Math.min(MAX_RISK_LEVEL, state.risk + Math.round((Math.random() - RISK_DELTA_BIAS) * RISK_DELTA_RANGE)));
    state.wearable.battery = Math.max(MIN_BATTERY_LEVEL, state.wearable.battery - BATTERY_DRAIN_RATE);
    state.routeStatus = state.risk > 65 ? 'Recalculated' : 'Stable';
    if (Math.random() > ALERT_GENERATION_THRESHOLD) {
      state.alerts = [{ type: 'warning', msg: 'Dynamic flow update near zone C3', zone: 'C3' }, ...state.alerts].slice(0, MAX_ALERT_HISTORY);
    }
    if (!state.scenarioRunning) render();
  }, 5000);

  window.addEventListener('hashchange', render);
  window.addEventListener('beforeunload', () => clearInterval(liveUpdateInterval));
  render();
})();

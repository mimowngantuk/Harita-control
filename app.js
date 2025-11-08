const tempEl = document.getElementById('temp');
const phEl = document.getElementById('ph');
const tdsEl = document.getElementById('tds');
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refresh');
const espIpInput = document.getElementById('espIp');

const pumpBtn = document.getElementById('pumpBtn');
const phUpBtn = document.getElementById('phUpBtn');
const phDownBtn = document.getElementById('phDownBtn');
const nutrientBtn = document.getElementById('nutrientBtn');

let espIp = '';

function log(msg) {
  logEl.textContent = `${new Date().toLocaleTimeString()} — ${msg}`;
}

async function fetchSensor() {
  if (!espIp) {
    log('Set ESP IP first');
    statusEl.textContent = 'status: set ESP IP';
    return;
  }
  const url = `http://${espIp}/sensor`;
  statusEl.textContent = 'status: fetching...';

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    tempEl.textContent = (data.temperature ?? '--') + ' °C';
    phEl.textContent = data.ph ?? '--';
    tdsEl.textContent = `TDS: ${data.tds ?? '--'} / Flow: ${data.flow ?? '--'}`;
    statusEl.textContent = 'status: OK';
    log('data updated');
  } catch (e) {
    statusEl.textContent = 'status: error';
    log('error: ' + e.message);
  }
}

// tombol refresh
refreshBtn.addEventListener('click', () => {
  espIp = espIpInput.value.trim();
  fetchSensor();
});

// auto refresh tiap 10 detik
setInterval(() => {
  if (espIpInput.value.trim()) {
    espIp = espIpInput.value.trim();
    fetchSensor();
  }
}, 10000);

// fungsi umum untuk kontrol relay
async function triggerRelay(endpoint, btn) {
  if (!espIp) {
    log('Set ESP IP first');
    statusEl.textContent = 'status: set ESP IP';
    return;
  }
  const url = `http://${espIp}/${endpoint}`;
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    log(`Relay ${endpoint} triggered`);
  } catch (e) {
    log('error: ' + e.message);
  }
}

// event untuk tombol relay
pumpBtn.addEventListener('click', () => triggerRelay('pump', pumpBtn));
phUpBtn.addEventListener('click', () => triggerRelay('phup', phUpBtn));
phDownBtn.addEventListener('click', () => triggerRelay('phdown', phDownBtn));
nutrientBtn.addEventListener('click', () => triggerRelay('nutrient', nutrientBtn));

// Animasi lottie
const animation = lottie.loadAnimation({
  container: document.getElementById('animationContainer'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'dashboard_anim.json' // nama file animasi kamu di folder yang sama
});
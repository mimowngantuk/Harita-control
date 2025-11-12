// === ELEMENT REFERENCES ===
const tempEl = document.getElementById('temp');
const phEl = document.getElementById('ph');
const tdsEl = document.getElementById('tds');
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refresh');

const pumpBtn = document.getElementById('pumpBtn');
const phUpBtn = document.getElementById('phUpBtn');
const phDownBtn = document.getElementById('phDownBtn');
const nutrientBtn = document.getElementById('nutrientBtn');
const espIpInput = document.getElementById('espIp');

// === CONFIG ===
// Link Google Apps Script kamu (deploy Web App)
const scriptUrl = 'https://script.google.com/macros/s/AKfycbzyrBRh732mjeFZmdB_QKxGbsnHhneGMKVZ4_q-I_QTJ448KpyA8YM8FfzfFk0GNk9grw/exec';

// === UTILITIES ===
function log(msg) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `${time} — ${msg}`;
  console.log(msg);
}

function setStatus(msg, ok = true) {
  statusEl.textContent = `status: ${msg}`;
  statusEl.style.color = ok ? "#9effa3" : "#ff8c8c";
}

// === FETCH SENSOR DATA ===
async function fetchSensor() {
  setStatus('fetching...', true);
  try {
    const res = await fetch(`${scriptUrl}?readSensor=1`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    tempEl.textContent = (data.temperature ?? '--') + ' °C';
    phEl.textContent = data.ph ?? '--';
    tdsEl.textContent = `TDS: ${data.tds ?? '--'} / Flow: ${data.flow ?? '--'}`;

    setStatus('connected');
    log('✅ Data updated successfully');
  } catch (e) {
    setStatus('error', false);
    log('❌ Error fetching data: ' + e.message);
  }
}

// === AUTO REFRESH EVERY 10s ===
refreshBtn.addEventListener('click', fetchSensor);
setInterval(fetchSensor, 10000);

// === SEND COMMAND TO SHEET ===
async function sendCommand(cmd, btn) {
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);

  try {
    const res = await fetch(`${scriptUrl}?cmd=${cmd}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    log(`🚀 Command sent: ${cmd}`);
    setStatus('command sent');
  } catch (e) {
    log('❌ Error sending command: ' + e.message);
    setStatus('command error', false);
  }
}

// === RELAY BUTTONS ===
pumpBtn.addEventListener('click', () => sendCommand('pump_on', pumpBtn));
phUpBtn.addEventListener('click', () => sendCommand('ph_up', phUpBtn));
phDownBtn.addEventListener('click', () => sendCommand('ph_down', phDownBtn));
nutrientBtn.addEventListener('click', () => sendCommand('nutrient_on', nutrientBtn));

// === LOTTIE ===
const animation = lottie.loadAnimation({
  container: document.getElementById('animationContainer'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'dashboard_anim.json'
});

// === OPTIONAL: Kirim command langsung ke ESP juga ===
async function sendToESP(cmd) {
  const ip = espIpInput.value.trim();
  if (!ip) return log('⚠️ ESP IP not set');
  try {
    await fetch(`http://${ip}/cmd?${cmd}`);
    log(`📡 Sent to ESP: ${cmd}`);
  } catch (e) {
    log(`⚠️ ESP unreachable: ${e.message}`);
  }
}

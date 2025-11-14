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

const brokerInput = document.getElementById('brokerIp');
const connectBtn = document.getElementById('connectBtn');

// === CONFIG ===
const scriptUrl = 'https://script.google.com/macros/s/AKfycbzyrBRh732mjeFZmdB_QKxGbsnHhneGMKVZ4_q-I_QTJ448KpyA8YM8FfzfFk0GNk9grw/exec';
const mqttTopicControl = "harita/control";

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

// === FETCH SENSOR DATA (via Google Sheets) ===
async function fetchSensor() {
  setStatus('fetching...', true);
  try {
    const res = await fetch(`${scriptUrl}?readSensor=true`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    tempEl.textContent = (data.temperature ?? '--') + ' °C';
    phEl.textContent = data.ph ?? '--';
    tdsEl.textContent = (data.tds ?? '--');

    setStatus('connected');
    log('✅ Data updated successfully (Google Sheets)');
  } catch (e) {
    setStatus('error', false);
    log('❌ Error fetching data: ' + e.message);
  }
}

// === AUTO REFRESH EVERY 10s ===
refreshBtn.addEventListener('click', fetchSensor);
setInterval(fetchSensor, 10000);

// === MQTT CONTROL ===
let client;

connectBtn.addEventListener('click', () => {
  const brokerIp = brokerInput.value.trim();
  if (!brokerIp) {
    log('⚠️ Please enter broker IP');
    return;
  }

  const mqttUrl = `ws://${brokerIp}`; // ws://IP:9001
  client = mqtt.connect(mqttUrl, {
    username: 'harita',
    password: 'mimo',
    reconnectPeriod: 2000
  });

  client.on("connect", () => {
    log("🛰️ Connected to Mosquitto broker");
    setStatus("MQTT connected");
  });

  client.on("error", (err) => {
    log("❌ MQTT Error: " + err.message);
    setStatus("MQTT disconnected", false);
  });
});

// === SEND MQTT COMMANDS ===
function sendMQTT(cmd, btn) {
  if (!client || !client.connected) {
    log("⚠️ MQTT not connected");
    setStatus("MQTT disconnected", false);
    return;
  }

  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);

  client.publish(mqttTopicControl, cmd);
  log(`🚀 MQTT published: ${cmd}`);
  setStatus("MQTT command sent");
}

// === RELAY BUTTONS ===
pumpBtn.addEventListener('click', () => sendMQTT('pump_on', pumpBtn));
phUpBtn.addEventListener('click', () => sendMQTT('ph_up', phUpBtn));
phDownBtn.addEventListener('click', () => sendMQTT('ph_down', phDownBtn));
nutrientBtn.addEventListener('click', () => sendMQTT('nutrient_on', nutrientBtn));

// === LOTTIE ===
const animation = lottie.loadAnimation({
  container: document.getElementById('animationContainer'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'dashboard_anim.json'
});

// === INITIAL FETCH ===
document.addEventListener('DOMContentLoaded', fetchSensor);

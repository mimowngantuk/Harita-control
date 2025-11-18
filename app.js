// === ELEMENT REFERENCES ===
const tempEl = document.getElementById('temp');
const phEl = document.getElementById('ph');
const tdsEl = document.getElementById('tds');
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');

const brokerInput = document.getElementById('brokerIp');
const connectBtn = document.getElementById('connectBtn');
const refreshBtn = document.getElementById('refresh');

const pumpBtn = document.getElementById('pumpBtn');
const phUpBtn = document.getElementById('phUpBtn');
const phDownBtn = document.getElementById('phDownBtn');
const nutrientBtn = document.getElementById('nutrientBtn');

// === CONFIG ===
const scriptUrl = 'https://script.google.com/macros/s/AKfycbygqEsOpMQUFsCMyytktIcVbXGTTX3syzcwf5w47oXMbdLyqx2H36D1az-7ndG_-DbjDw/exec';

const mqttTopicControl = "harita/control";
const mqttTopicSensor = {
  temp: "harita/sensor/temp",
  ph: "harita/sensor/ph",
  tds: "harita/sensor/tds"
};

// === UTILITIES ===
function log(msg) {
  const t = new Date().toLocaleTimeString();
  logEl.textContent = `${t} — ${msg}`;
  console.log(msg);
}

function setStatus(msg, ok = true) {
  statusEl.textContent = `status: ${msg}`;
  statusEl.style.color = ok ? "#9effa3" : "#ff8c8c";
}

// === FETCH FROM GOOGLE SHEETS ===
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


// === MQTT ===
let client = null;

function connectMQTT(brokerIp) {
  if (!brokerIp) {
    setStatus("Please enter broker IP", false);
    return;
  }

  const mqttUrl = `ws://${brokerIp}`;
  log(`🔗 Connecting to MQTT ${mqttUrl}`);

  client = mqtt.connect(mqttUrl);

  client.on("connect", () => {
    log(`🛰️ MQTT connected`);
    setStatus("MQTT connected");

    client.subscribe(Object.values(mqttTopicSensor), (err) => {
      if (err) log("⚠️ Failed to subscribe");
      else log("📡 Subscribed to sensor topics");
    });
  });

  client.on("error", err => {
    log("❌ MQTT Error: " + err.message);
    setStatus("MQTT disconnected", false);
  });

  client.on("message", (topic, msgBuf) => {
    const msg = msgBuf.toString();

    if (topic === mqttTopicSensor.temp) tempEl.textContent = msg + " °C";
    if (topic === mqttTopicSensor.ph) phEl.textContent = msg;
    if (topic === mqttTopicSensor.tds) tdsEl.textContent = msg;

    log(`📥 [${topic}] ${msg}`);
  });
}

// === SEND MQTT CMD ===
function sendMQTT(cmd, btn) {
  if (!client || !client.connected) {
    setStatus("MQTT disconnected", false);
    log("⚠️ MQTT not connected");
    return;
  }

  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), 500);

  client.publish(mqttTopicControl, cmd);
  log(`🚀 Sent: ${cmd}`);
  setStatus("command sent");
}

// === EVENTS ===
connectBtn.addEventListener('click', () => connectMQTT(brokerInput.value));
refreshBtn.addEventListener('click', fetchSensor);

pumpBtn.addEventListener('click', () => sendMQTT('pump_on', pumpBtn));
phUpBtn.addEventListener('click', () => sendMQTT('ph_up', phUpBtn));
phDownBtn.addEventListener('click', () => sendMQTT('ph_down', phDownBtn));
nutrientBtn.addEventListener('click', () => sendMQTT('nutrient_on', nutrientBtn));

// === AUTO ===
setInterval(fetchSensor, 10000);
document.addEventListener('DOMContentLoaded', fetchSensor);

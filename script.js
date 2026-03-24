// Airport names
const AIRPORT_NAMES = {
  LHR: "Heathrow", LGW: "Gatwick", STN: "Stansted", LTN: "Luton", MAN: "Manchester",
  BHX: "Birmingham", EDI: "Edinburgh", GLA: "Glasgow", BRS: "Bristol", NCL: "Newcastle"
};

// Game state
let selectedAirport = "";
let outDate = "";
let inDate = "";
let outTime = "06:00";
let inTime = "12:00";
let currentDimension = 1;

// Date helper
function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function calculateDays(start, end) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.abs(d2 - d1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Initialize
function init() {
  // Pre-fill dates
  outDate = datePlus(1);
  inDate = datePlus(9);
  document.getElementById("outDate").value = outDate;
  document.getElementById("inDate").value = inDate;

  // Get airport from URL
  const params = new URLSearchParams(window.location.search);
  const locationParam = params.get("Location") || params.get("location");

  if (locationParam && AIRPORT_NAMES[locationParam.toUpperCase()]) {
    selectedAirport = locationParam.toUpperCase();
    // Skip to dimension 2
    setTimeout(() => travelToDimension(2), 500);
  }

  // Event listeners
  document.querySelectorAll(".planet-card").forEach(btn => {
    btn.addEventListener("click", handleAirportSelect);
  });

  document.getElementById("proceedFromDates").addEventListener("click", () => {
    outDate = document.getElementById("outDate").value;
    inDate = document.getElementById("inDate").value;
    travelToDimension(3);
  });

  document.getElementById("proceedFromTimes").addEventListener("click", () => {
    outTime = document.getElementById("outTime").value;
    inTime = document.getElementById("inTime").value;
    populateSummary();
    travelToDimension(4);
  });

  document.getElementById("launchBtn").addEventListener("click", launchSearch);
}

function handleAirportSelect(e) {
  const card = e.currentTarget;
  selectedAirport = card.dataset.airport;

  // Highlight selected
  document.querySelectorAll(".planet-card").forEach(c => c.style.borderColor = "rgba(253, 220, 6, 0.3)");
  card.style.borderColor = "#FDDC06";
  card.style.boxShadow = "0 10px 30px rgba(253, 220, 6, 0.4)";

  // Auto-proceed after short delay
  setTimeout(() => travelToDimension(2), 800);
}

function travelToDimension(dimension) {
  // Trigger wormhole animation
  animateWormhole(() => {
    // Hide current dimension
    document.querySelector(".dimension-screen.active").classList.remove("active");

    // Update progress markers
    document.querySelectorAll(".dimension-marker").forEach(marker => {
      marker.classList.remove("active");
    });
    document.querySelector(`[data-dimension="${dimension}"]`).classList.add("active");

    // Show new dimension
    document.getElementById(`dimension${dimension}`).classList.add("active");

    currentDimension = dimension;
  });
}

function animateWormhole(callback) {
  const canvas = document.getElementById("wormholeCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  canvas.classList.add("active");

  let frame = 0;
  const maxFrames = 60;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw expanding spiral
    const progress = frame / maxFrames;
    const numSpirals = 8;

    for (let i = 0; i < numSpirals; i++) {
      const angle = (i / numSpirals) * Math.PI * 2 + progress * Math.PI * 2;
      const radius = progress * Math.max(canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? "rgba(84, 46, 145, 0.6)" : "rgba(253, 220, 6, 0.6)";
      ctx.lineWidth = 20 * (1 - progress);

      for (let r = 0; r < radius; r += 20) {
        const x = centerX + Math.cos(angle + r * 0.01) * r;
        const y = centerY + Math.sin(angle + r * 0.01) * r;

        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    frame++;

    if (frame < maxFrames) {
      requestAnimationFrame(drawFrame);
    } else {
      canvas.classList.remove("active");
      callback();
    }
  }

  drawFrame();
}

function populateSummary() {
  const airportName = AIRPORT_NAMES[selectedAirport] || "Unknown";
  document.getElementById("summaryAirport").textContent = airportName;
  document.getElementById("summaryOutDate").textContent = `${formatDate(outDate)} at ${outTime}`;
  document.getElementById("summaryInDate").textContent = `${formatDate(inDate)} at ${inTime}`;
  document.getElementById("summaryDays").textContent = `${calculateDays(outDate, inDate)} days`;
}

function launchSearch() {
  const btn = document.getElementById("launchBtn");
  btn.textContent = "🚀 LAUNCHING...";
  btn.disabled = true;

  // Countdown
  let count = 3;
  const countdown = setInterval(() => {
    btn.textContent = `🚀 ${count}...`;
    count--;

    if (count < 0) {
      clearInterval(countdown);
      redirect();
    }
  }, 800);
}

function redirect() {
  // Get params from URL
  const params = new URLSearchParams(window.location.search);
  const agent = params.get("agent") || "WY992";
  const adcode = params.get("adcode") || "";
  const promotionCode = params.get("promotionCode") || "";
  const flight = params.get("flight") || "default";

  // HX stays on www
  const host = window.location.host;
  const isLocal = host.startsWith("127") || host.includes("github.io");
  const basedomain = isLocal ? "www.holidayextras.com" : host;

  // Format times for URL
  const outTimeEncoded = outTime.replace(":", "%3A");
  const inTimeEncoded = inTime.replace(":", "%3A");

  // Assemble search URL
  const depart = selectedAirport || "LGW";
  const searchUrl = `https://${basedomain}/static/?selectProduct=cp&#/categories?agent=${agent}&ppts=&customer_ref=&lang=en&adults=2&depart=${depart}&terminal=&arrive=&flight=${flight}&in=${inDate}&out=${outDate}&park_from=${outTimeEncoded}&park_to=${inTimeEncoded}&filter_meetandgreet=&filter_parkandride=&children=0&infants=0&redirectReferal=carpark&from_categories=true&adcode=${adcode}&promotionCode=${promotionCode}`;

  window.location.href = searchUrl;
}

// Initialize on load
document.addEventListener("DOMContentLoaded", init);

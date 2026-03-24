// Airport names
const AIRPORT_NAMES = {
  LHR: "Heathrow", LGW: "Gatwick", STN: "Stansted", LTN: "Luton", MAN: "Manchester",
  BHX: "Birmingham", EDI: "Edinburgh", GLA: "Glasgow", BRS: "Bristol", NCL: "Newcastle"
};

// Flight API
const FLIGHT_API = "https://flight.dock-yard.io";

// Game state
let selectedAirport = "";
let outDate = "";
let inDate = "";
let outTime = "06:00";
let inTime = "12:00";
let outFlight = "default";
let inFlight = "default";
let outboundDestination = ""; // Track destination for return flight
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

  document.getElementById("showMoreAirports").addEventListener("click", () => {
    const moreAirports = document.getElementById("moreAirports");
    const btn = document.getElementById("showMoreAirports");
    const isHidden = moreAirports.classList.contains("hidden");

    if (isHidden) {
      moreAirports.classList.remove("hidden");
      btn.innerHTML = '<span>Show Less</span><span class="btn-icon">🔼</span>';
    } else {
      moreAirports.classList.add("hidden");
      btn.innerHTML = '<span>Show Other Airports</span><span class="btn-icon">🔽</span>';
    }
  });

  document.getElementById("proceedFromDates").addEventListener("click", () => {
    outDate = document.getElementById("outDate").value;
    inDate = document.getElementById("inDate").value;
    travelToDimension(3);
  });

  document.getElementById("proceedFromTimes").addEventListener("click", () => {
    outTime = document.getElementById("outTime").value;
    inTime = document.getElementById("inTime").value;
    loadFlights("out");
    travelToDimension(4);
  });

  document.getElementById("proceedFromOutFlight").addEventListener("click", () => {
    cachedFlights = []; // Clear cache to load return flights
    loadFlights("in");
    travelToDimension(5);
  });
  document.getElementById("skipOutFlight").addEventListener("click", () => {
    outFlight = "default";
    cachedFlights = []; // Clear cache
    travelToDimension(5);
  });

  document.getElementById("proceedFromInFlight").addEventListener("click", () => {
    populateSummary();
    travelToDimension(6);
  });

  document.getElementById("skipInFlight").addEventListener("click", () => {
    inFlight = "default";
    populateSummary();
    travelToDimension(6);
  });

  document.getElementById("launchBtn").addEventListener("click", launchSearch);

  // Flight search listeners
  document.getElementById("outFlightSearch").addEventListener("input", (e) => searchFlights(e.target.value, "out"));
  document.getElementById("inFlightSearch").addEventListener("input", (e) => searchFlights(e.target.value, "in"));
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
  const flight = outFlight || "default";

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

// Flight functions
let cachedFlights = [];

async function loadFlights(direction) {
  const listId = direction === "out" ? "outFlightList" : "inFlightList";
  const list = document.getElementById(listId);
  list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:20px;">Loading flights...</div>';

  try {
    let apiUrl;
    if (direction === "out") {
      // Outbound: from UK airport on departure date
      apiUrl = `${FLIGHT_API}/searchDayFlights?location=${selectedAirport}&departDate=${outDate}&fullResults=true`;
    } else {
      // Return: from destination back to UK airport on return date
      if (!outboundDestination) {
        list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:20px;">Please select an outbound flight first.</div>';
        return;
      }
      apiUrl = `${FLIGHT_API}/searchDayFlights?location=${outboundDestination}&departDate=${inDate}&destination=${selectedAirport}&fullResults=true`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();
    // API returns array directly, not wrapped in {results: [...]}
    cachedFlights = Array.isArray(data) ? data : [];
    displayFlights(cachedFlights, direction);
  } catch (error) {
    console.error("Failed to load flights:", error);
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:20px;">Failed to load flights. You can skip this step.</div>';
    cachedFlights = [];
  }
}

function displayFlights(flights, direction) {
  const listId = direction === "out" ? "outFlightList" : "inFlightList";
  const list = document.getElementById(listId);

  if (!flights || flights.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:20px;">No flights available. You can skip this step.</div>';
    return;
  }

  list.innerHTML = flights.slice(0, 20).map(f => {
    const code = (f.flight && f.flight.code) || "Unknown";
    const airline = (f.flight && f.flight.carrier && f.flight.carrier.name) || "";
    const destination = (f.arrival && f.arrival.airport) || (f.arrival && f.arrival.airport_iata) || "";
    const destinationIata = (f.arrival && f.arrival.airport_iata) || "";
    const depTime = (f.departure && f.departure.time) || "";
    return `
      <div class="flight-card" data-code="${code}" data-direction="${direction}" data-destination="${destinationIata}">
        <div class="flight-info">
          <div class="flight-code">${code}</div>
          <div class="flight-details">${depTime}${airline ? ' • ' + airline : ''} → ${destination}</div>
        </div>
        <div class="flight-icon">🚀</div>
      </div>
    `;
  }).join("");

  // Add click handlers
  list.querySelectorAll(".flight-card").forEach(card => {
    card.addEventListener("click", () => selectFlight(card));
  });
}

function selectFlight(card) {
  const code = card.dataset.code;
  const direction = card.dataset.direction;
  const destination = card.dataset.destination;

  // Update selection
  card.parentElement.querySelectorAll(".flight-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");

  // Store flight code
  if (direction === "out") {
    outFlight = code;
    outboundDestination = destination; // Store destination for return flight
    document.getElementById("proceedFromOutFlight").style.display = "flex";
  } else {
    inFlight = code;
    document.getElementById("proceedFromInFlight").style.display = "flex";
  }
}

function searchFlights(query, direction) {
  if (!query) {
    displayFlights(cachedFlights, direction);
    return;
  }

  const filtered = cachedFlights.filter(f => {
    const code = ((f.flight && f.flight.code) || "").toLowerCase();
    const airline = ((f.flight && f.flight.carrier && f.flight.carrier.name) || "").toLowerCase();
    const dest = ((f.arrival && f.arrival.airport) || (f.arrival && f.arrival.airport_iata) || "").toLowerCase();
    const q = query.toLowerCase();
    return code.includes(q) || airline.includes(q) || dest.includes(q);
  });

  displayFlights(filtered, direction);
}

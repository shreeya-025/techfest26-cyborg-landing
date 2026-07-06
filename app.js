/* --- App Initialization & State Management --- */
document.addEventListener("DOMContentLoaded", () => {
  initNeuralCanvas();
  initAudioSystem();
  initAugmentationMap();
  initEventFilters();
  initTerminalConsole();
  initRegistrationForm();
  initScrollSpy();
});

/* --- 1. NEURAL CANVAS PARTICLE SYSTEM --- */
function initNeuralCanvas() {
  const canvas = document.getElementById("neural-canvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const particleCount = Math.min(80, Math.floor((width * height) / 15000));
  const maxDistance = 120;
  const mouse = { x: null, y: null, radius: 150 };

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseout", () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce on edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse interaction (repel gently)
      if (mouse.x != null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.45)";
      ctx.fill();
    }
  }

  // Populate particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines connecting particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = (1 - dist / maxDistance) * 0.12;
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw line to mouse
      if (mouse.x != null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          const alpha = (1 - dist / mouse.radius) * 0.15;
          ctx.strokeStyle = `rgba(255, 0, 91, ${alpha})`; // Pink path connecting to user focus
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* --- 2. WEB AUDIO SYNTHESIZER --- */
let audioCtx = null;
let audioEnabled = false;

function initAudioSystem() {
  const toggleBtn = document.getElementById("audio-toggle");

  toggleBtn.addEventListener("click", () => {
    // Sound initialization on click to fulfill browser permissions
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioEnabled = !audioEnabled;

    if (audioEnabled) {
      toggleBtn.classList.add("active");
      toggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      playSynthSound("success"); // Welcome chime
    } else {
      toggleBtn.classList.remove("active");
      toggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }
  });

  // Attach hover sounds to active interactive components
  document.querySelectorAll(".cyber-btn, .aug-node, .filter-btn, .social-link").forEach(el => {
    el.addEventListener("mouseenter", () => {
      if (audioEnabled) playSynthSound("hover");
    });
    el.addEventListener("click", () => {
      if (audioEnabled) playSynthSound("click");
    });
  });
}

function playSynthSound(type) {
  if (!audioCtx || !audioEnabled) return;

  // Make sure AudioContext is running
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const dest = audioCtx.destination;

  switch (type) {
    case "click": {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      break;
    }
    case "hover": {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
      break;
    }
    case "type": {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.01);
      break;
    }
    case "success": {
      const playTone = (freq, delay, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };

      playTone(523.25, 0, 0.15); // C5
      playTone(659.25, 0.07, 0.15); // E5
      playTone(783.99, 0.14, 0.25); // G5
      break;
    }
    case "alarm": {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      break;
    }
  }
}

/* --- 3. INTERACTIVE AUGMENTATION MAP --- */
function initAugmentationMap() {
  const nodes = document.querySelectorAll(".aug-node");
  const infobox = document.getElementById("aug-infobox");
  const title = document.getElementById("infobox-title");
  const status = document.getElementById("infobox-status");
  const desc = document.getElementById("infobox-desc");

  nodes.forEach(node => {
    node.addEventListener("click", () => {
      // Remove active classes
      nodes.forEach(n => n.classList.remove("active"));
      
      // Make this node active
      node.classList.add("active");

      // Extract metadata values
      const nodeTitle = node.getAttribute("data-title");
      const nodeDesc = node.getAttribute("data-desc");
      const nodeStatus = node.getAttribute("data-status");

      // Animate Info Box Content swap
      infobox.classList.remove("active");

      setTimeout(() => {
        title.innerText = nodeTitle;
        status.innerText = nodeStatus;
        desc.innerText = nodeDesc;

        // Color status toxic green if active, yellow/pink if syncing/calibrating
        if (nodeStatus.includes("ACTIVE")) {
          status.style.color = "var(--tertiary)";
        } else {
          status.style.color = "var(--warning)";
        }

        infobox.classList.add("active");
        if (audioEnabled) playSynthSound("success");
      }, 250);
    });
  });
}

/* --- 4. SECTOR MATRIX FILTERS --- */
function initEventFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const eventCards = document.querySelectorAll(".event-card");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Manage active style
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      eventCards.forEach(card => {
        const category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.style.display = "flex";
          // Quick CSS scale fade in trigger
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
            card.style.transition = "opacity 0.4s, transform 0.4s";
          }, 30);
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // Pre-fill target event in form when clicking register buttons on cards
  document.querySelectorAll(".event-register-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const eventName = btn.getAttribute("data-event");
      const select = document.getElementById("event-select");
      if (select) {
        select.value = eventName;
        // Trigger style/state calculations
        select.dispatchEvent(new Event("change"));
      }
    });
  });
}

/* --- 5. CORE TERMINAL CONSOLE --- */
function initTerminalConsole() {
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const body = document.getElementById("terminal-body");

  if (!input || !output || !body) return;

  // Make whole terminal focus input on click
  body.addEventListener("click", () => {
    input.focus();
  });

  // Helper command parser
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const rawCmd = input.value.trim();
      input.value = "";

      if (rawCmd === "") return;

      if (audioEnabled) playSynthSound("type");
      processCommand(rawCmd);
    }
  });

  function printLine(text, className = "") {
    const line = document.createElement("div");
    line.className = `terminal-line ${className}`;
    line.innerHTML = text;
    output.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function processCommand(cmdStr) {
    // Print echo command
    printLine(`<span class="terminal-prefix">guest@mainframe:~$</span> <span class="command-echo">${cmdStr}</span>`);

    const parts = cmdStr.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setTimeout(() => {
      switch (cmd) {
        case "help":
          printLine("Active Mainframe Terminal Operations:");
          printLine("  <span style='color: var(--primary)'>about</span>         Retrieve bio-mechanical narrative context.");
          printLine("  <span style='color: var(--primary)'>status</span>        Inspect mainframe link and diagnostic status.");
          printLine("  <span style='color: var(--primary)'>events</span>        List active competition sub-modules.");
          printLine("  <span style='color: var(--primary)'>register</span>      Request linkage to form directory upload.");
          printLine("  <span style='color: var(--primary)'>hack</span>          Initiate encryption codebreaker matrix.");
          printLine("  <span style='color: var(--primary)'>clear</span>         Wipe telemetry cache display.");
          break;

        case "about":
          printLine("IIT Bombay Techfest 2026.");
          printLine("Chronicles of Synapse: A global platform tracking bio-computing evolution.");
          printLine("The fusion of artificial synapse meshes with organic logical structures has officially begun.");
          break;

        case "status":
          printLine("DIAGNOSTIC TELEMETRY:");
          printLine("  - Neural Latency: <span style='color: var(--tertiary)'>12ms (Stabilized)</span>");
          printLine("  - Transmitter Range: <span style='color: var(--tertiary)'>Local Uplink Active</span>");
          printLine("  - Database Node: <span style='color: var(--tertiary)'>Online // iitb.tf26.db.cluster</span>");
          printLine("  - Security Protocol: <span style='color: var(--tertiary)'>AES-256 (Cypher-Grade V4)</span>");
          break;

        case "events":
          printLine("EVENT MATRIX DIRECTORY:");
          printLine("  [SYS_ROB_01] RoboWars - Mechanical combat");
          printLine("  [SYS_ROB_02] Meshmerize - Robot pathfinder solver");
          printLine("  [SYS_COD_01] Coding Synapse - Competitive math algorithms");
          printLine("  [SYS_COD_02] Neural Biohack - EEG and bio signal processing");
          printLine("  [SYS_AER_01] AeroDynamics - Fixed wing glider design");
          printLine("  [SYS_AER_02] Atmos Rover - Rough terrain planetary navigation");
          break;

        case "register":
          printLine("INITIALIZING SYNC POINTER...");
          printLine("Redirecting focus vector directly to uploads portal...");
          document.getElementById("register").scrollIntoView({ behavior: "smooth" });
          document.getElementById("name").focus();
          break;

        case "hack":
          printLine("BYPASSING PROTOCOLS...");
          if (audioEnabled) playSynthSound("alarm");
          runCodebreakerAnimation();
          break;

        case "clear":
          output.innerHTML = "";
          break;

        default:
          printLine(`Command not found: ${cmd}. Type <span style='color: var(--secondary)'>help</span> for operations list.`, "error-line");
          break;
      }
      body.scrollTop = body.scrollHeight;
    }, 100);
  }

  function runCodebreakerAnimation() {
    let count = 0;
    const interval = setInterval(() => {
      let randString = "";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";
      for (let i = 0; i < 40; i++) {
        randString += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      printLine(`<span style='color: var(--secondary)'>OVERRIDE: ${randString}</span>`);
      count++;
      if (count > 15) {
        clearInterval(interval);
        printLine("-------------------------------------------------");
        printLine("<span style='color: var(--tertiary)'>ACCESS GRANTED: WELCOME TO IIT BOMBAY CORE SECTOR</span>");
        printLine("-------------------------------------------------");
      }
    }, 80);
  }
}

/* --- 6. REGISTRATION UPLOAD PORTAL --- */
function initRegistrationForm() {
  const form = document.getElementById("registration-form");
  const modal = document.getElementById("success-modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  
  // Interactive inputs telemetry diagnostics helper
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const eventSelect = document.getElementById("event-select");
  const orgInput = document.getElementById("org");

  if (!form || !modal || !closeBtn) return;

  function calculateSyncStrength() {
    let filled = 0;
    if (nameInput.value.trim() !== "") filled++;
    if (emailInput.value.trim() !== "") filled++;
    if (eventSelect.value !== "") filled++;
    if (orgInput.value.trim() !== "") filled++;

    const percent = filled * 25;
    
    if (percent === 0) {
      statusDot.className = "status-dot";
      statusText.innerText = "CALIBRATING TRANSMITTER...";
    } else if (percent < 100) {
      statusDot.className = "status-dot";
      statusDot.style.background = "var(--warning)";
      statusDot.style.boxShadow = "0 0 6px var(--warning)";
      statusText.innerText = `SYNC IN PROGRESS... (${percent}%)`;
    } else {
      statusDot.className = "status-dot connected";
      statusDot.style.background = ""; // Restore CSS default toxic green
      statusDot.style.boxShadow = "";
      statusText.innerText = "TRANSMITTER READY (100%)";
    }
  }

  [nameInput, emailInput, eventSelect, orgInput].forEach(input => {
    input.addEventListener("input", calculateSyncStrength);
    input.addEventListener("change", calculateSyncStrength);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Play visual synchronization effect
    statusText.innerText = "UPLOADING DATA PACKETS...";
    
    if (audioEnabled) {
      playSynthSound("click");
      setTimeout(() => playSynthSound("success"), 800);
    }

    setTimeout(() => {
      // Clear inputs
      form.reset();
      calculateSyncStrength();

      // Show success modal
      modal.classList.add("active");
    }, 1200);
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });
}

/* --- 7. SCROLL SPY HUD NAV LINKS --- */
function initScrollSpy() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href").slice(1) === current) {
        link.classList.add("active");
      }
    });
  });
}

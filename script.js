const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-btn");
import { segments } from "./gifts.js";
const baseUrl = "https://cnkdbe.vercel.app";

// Kích thước & tâm canvas (R = 200)
const radius = 200;
const center = radius + 20; // chừa viền ngoài
canvas.width = center * 2;
canvas.height = center * 2;

let selectedPrizeIndex = null;

const imageCache = {};

function loadImage(src) {
  return new Promise((resolve) => {
    if (imageCache[src]) return resolve(imageCache[src]);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageCache[src] = img;
      resolve(img);
    };
  });
}

// Lấy contactId từ URL
const urlParams = new URLSearchParams(window.location.search);
const contactId = urlParams.get("contact_id") || null;

// Quay bánh xe
const arc = (2 * Math.PI) / segments.length; // góc mỗi ô
let currentAngle = 0;

function drawWheel() {
  Promise.all(segments.map((seg) => seg.image && loadImage(seg.image)));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < segments.length; i++) {
    const start = i * arc + currentAngle;
    const end = start + arc;

    // Vẽ từng phần
    ctx.beginPath();
    ctx.fillStyle = segments[i].color;
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.fill();

    // Góc giữa ô
    const midAngle = start + arc / 2;
    const textRadius = radius - 50; // chữ gần viền
    const maxWidth = 100; // độ rộng tối đa cho 1 dòng chữ
    const lineHeight = 16;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(midAngle);
    ctx.rotate(Math.PI / 2); // vuông góc với hướng tâm
    ctx.textAlign = "center";
    ctx.fillStyle = "#061F60";
    ctx.font = "12px Baloo";

    // Tách chữ theo độ rộng cho phép
    const words = segments[i].text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let j = 1; j < words.length; j++) {
      const testLine = currentLine + " " + words[j];
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = words[j];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Vẽ từng dòng, canh giữa
    const totalHeight = lineHeight * lines.length;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], 0, -textRadius - totalHeight / 2 + k * lineHeight);
    }

    // Vẽ ảnh nếu có
    const img = imageCache[segments[i].image];
    if (img) {
      const imgSize = 50; // kích thước ảnh
      const imgY = -textRadius + 15;
      ctx.drawImage(img, -imgSize / 2, imgY, imgSize, imgSize);
    }

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#b6d4ff";
  ctx.stroke();

  drawPointer();
}
drawWheel();

function drawPointer() {
  const img = new Image();
  img.src = "assets/arrown.png";

  img.onload = function () {
    const size = 1;
    ctx.save();
    ctx.translate(center, center - radius);
    ctx.drawImage(img, -size / 2, -size - 6, size, size);

    ctx.restore();
  };
}

async function rotateWheel(selectedIndex) {
  const spins = 6;
  const prizeAngle = selectedIndex * arc + arc / 2;
  const stopAngle = (3 * Math.PI - prizeAngle + Math.PI / 2) % (2 * Math.PI);
  const totalAngle = spins * 2 * Math.PI + stopAngle;

  const duration = 5000;
  const start = performance.now();
  function animate(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3); // chậm dần
    currentAngle = totalAngle * easeOut;

    drawWheel(); // vẽ lại bánh xe theo currentAngle

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      showPrize();
      confirmPrize();
    }
  }

  requestAnimationFrame(animate);
}
// Giả sử sau khi người chơi hoàn thành trò chơi:
async function confirmPrize() {
  const prize = segments[selectedPrizeIndex];
  try {
    await fetch(`${baseUrl}/api/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, prize }),
    });
  } catch (err) {
    console.error(err);
  }
}

async function getSelectedIndex() {
  try {
    const prize = await fetch(`${baseUrl}/api/spin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    const data = await prize.json();
    if (data?.error) {
      alert(data.message);
      return null;
    }
    return data?.index;
  } catch (err) {
    console.error(err);
  }
}

async function initWheel() {
  try {
    selectedPrizeIndex = await getSelectedIndex();
    drawWheel();
  } catch (err) {
    console.error("Failed to get prize:", err);
  }
}
initWheel();

spinBtn.addEventListener("click", async () => {
  spinning = true;
  selectedPrizeIndex = await getSelectedIndex();
  if (selectedPrizeIndex != null) {
    rotateWheel(selectedPrizeIndex);
  }
});

// Hiển thị phần thưởng khi dừng
async function showPrize() {
  const prize = segments[selectedPrizeIndex];
  const oldPopup = document.getElementById("prize-popup");
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement("div");
  popup.id = "prize-popup";
  Object.assign(popup.style, {
    position: "fixed",
    left: "50%",
    top: "30%",
    transform: "translateX(-50%)",
    zIndex: 9998,
    animation: "popupFadeIn 0.6s ease-out",
  });

  // Ảnh phần thưởng
  const img = document.createElement("img");
  img.src = `assets/${prize.code}.png`;
  Object.assign(img.style, {
    width: "90vw",
    maxWidth: "400px",
    height: "auto",
    display: "block",
    margin: "0 auto",
    objectFit: "contain",
  });

  popup.appendChild(img);
  document.body.appendChild(popup);

  // Bắn pháo hoa từ hai bên
  if (prize.code !== "0007") launchSideFireworks(4000);

  // Ẩn popup sau 10s
  setTimeout(() => {
    popup.style.transition = "opacity 0.5s";
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 500);
  }, 4000);
}

// Hiệu ứng pháo hoa từ hai bên (đè lên phần thưởng)
function launchSideFireworks(duration = 4000) {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: 9999, // cao hơn popup
  });
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const particles = [];
  const startTime = Date.now();

  function spawnParticle(side) {
    const angle =
      side === "left"
        ? Math.random() * 0.4 - 0.2 // lệch phải nhẹ
        : Math.PI + Math.random() * 0.4 - 0.2; // lệch trái nhẹ
    const speed = 4 + Math.random() * 2;
    particles.push({
      x: side === "left" ? 0 : canvas.width,
      y: Math.random() * canvas.height * 0.6 + canvas.height * 0.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      radius: Math.random() * 4 + 2,
      life: 80 + Math.random() * 40,
    });
  }

  function animate() {
    const now = Date.now();
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tạo pháo hoa từ hai bên trong 4s
    if (elapsed < duration) {
      if (Math.random() < 0.4) spawnParticle("left");
      if (Math.random() < 0.4) spawnParticle("right");
    }

    // Cập nhật và vẽ
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // trọng lực nhẹ
      p.radius *= 0.98;
      p.life -= 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Xóa hạt đã chết
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (elapsed < duration || particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();
}

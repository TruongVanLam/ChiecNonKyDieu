const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-btn");

const blacklist = [];

// 🔹 Các phần thưởng
const segments = [
  {
    text: "GIẢI ĐỘC ĐẮC",
    color: "#F7DADF",
    code: "0001",
    image: "assets/img-0001.png",
  },
  {
    text: "BÌNH TRỮ SỮA KENDAMIL",
    color: "#FFF8EB",
    code: "0002",
    image: "assets/img-0002.png",
  },
  {
    text: "KHĂN DỊU ÊM",
    color: "#F7DADF",
    code: "0003",
    image: "assets/img-0003.png",
  },
  {
    text: "TÚI KENDAMIL",
    color: "#FFF8EB",
    code: "0004",
    image: "assets/img-0004.png",
  },
  {
    text: "THÌA BÁO NÓNG 2 ĐẦU",
    color: "#F7DADF",
    code: "0005",
    image: "assets/img-0005.png",
  },
  {
    text: "TÚI KENDAMIL & KHĂN DỊU ÊM",
    color: "#FFF8EB",
    code: "0006",
    image: "assets/img-0006.png",
  },
  {
    text: "CHÚC BẠN MAY MẮN LẦN SAU",
    color: "#F7DADF",
    code: "0007",
    image: "assets/img-0007.png",
  },
  {
    text: "BÌNH TRỮ SỮA & KHĂN DỊU ÊM",
    color: "#FFF8EB",
    code: "0008",
    image: "assets/img-0008.png",
  },
];

const prizeLimits = {
  "0001": 2,
  "0002": 5,
  "0003": 5,
  "0004": 5,
  "0005": 5,
  "0006": 5,
  "0008": 5,
  "0007": 9999,
};

function getPrizeCount(code) {
  return parseInt(localStorage.getItem("count_" + code) || "0");
}

// 🔹 Thông số vòng quay
let startAngle = 0;
const arc = (2 * Math.PI) / segments.length;
let spinAngle = 0;
let spinning = false;

// 🔹 Kích thước & tâm canvas (R = 200)
const radius = 200;
const center = radius + 20; // chừa viền ngoài
canvas.width = center * 2;
canvas.height = center * 2;

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

async function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  await Promise.all(segments.map((seg) => seg.image && loadImage(seg.image)));

  for (let i = 0; i < segments.length; i++) {
    const angle = startAngle + i * arc;

    // Vẽ từng phần
    ctx.beginPath();
    ctx.fillStyle = segments[i].color;
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + arc);
    ctx.fill();

    // Góc giữa ô
    const midAngle = angle + arc / 2;
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

    // 🔹 Tách chữ theo độ rộng cho phép
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

    // 🔹 Vẽ từng dòng, canh giữa
    const totalHeight = lineHeight * lines.length;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], 0, -textRadius - totalHeight / 2 + k * lineHeight);
    }

    // 🔹 Vẽ ảnh nếu có
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

function getSelectedIndex() {
  const pointerAngle = -Math.PI / 2;
  let relativeAngle = pointerAngle - startAngle;
  relativeAngle =
    ((relativeAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(relativeAngle / arc);
  return (index + segments.length) % segments.length;
}

function showPrize(prize) {
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

  // Ẩn popup sau 4s
  setTimeout(() => {
    popup.style.transition = "opacity 0.5s";
    popup.style.opacity = "0";
    setTimeout(() => popup.remove(), 500);
  }, 5000);
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

// Lấy subscriber_id từ URL
const urlParams = new URLSearchParams(window.location.search);
const subscriberId =
  urlParams.get("mc_id") || urlParams.get("subscriber_id") || null;
const playedKey = "played_" + subscriberId;
const result = document.getElementById("result");

// Giả sử sau khi người chơi hoàn thành trò chơi:
function sendResultToManyChat(subscriberId, prize) {
  const apiKey = "9596298:45a160ad72e6a65222e8d3d3f0249484";

  if (!subscriberId) {
    console.warn("No subscriber id - không gửi ManyChat:", prize);
    return;
  }

  let message = "";
  if (prize.code == "0007") {
    message = `Tiếc quá 🙁 mẹ chưa trúng thưởng rồi, mẹ theo dõi fanpage để cập nhật minigame hấp dẫn khác nhé`;
  } else if (prize.code == "0001") {
    message = `Chúc mừng mẹ đã trúng phần quà 2 tháng sử dụng Kendamil miễn phí, mỗi tháng tối đa 3 lon. Mẹ hãy để lại thông tin họ tên, sđt và địa chỉ nhận hàng để Kendamil gửi quà tới mẹ nha.`;
  } else {
    message = `Chúc mừng mẹ đã trúng phần quà ${prize.text}. Mẹ hãy để lại thông tin họ tên, sđt và địa chỉ nhận hàng để Kendamil gửi quà tới mẹ nha.`;
  }

  fetch("https://api.manychat.com/fb/sending/sendContent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: "v2",
        content: {
          messages: [
            {
              type: "text",
              text: message,
            },
          ],
        },
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("✅ Đã gửi kết quả về ManyChat:", data);
    })
    .catch((error) => {
      console.error("❌ Lỗi khi gửi ManyChat:", error);
    });
}

function rotateWheel() {
  startAngle += (spinAngle * Math.PI) / 180;
  spinAngle *= 0.97;
  drawWheel();
  if (spinAngle > 0.2) {
    requestAnimationFrame(rotateWheel);
  } else {
    // Khi dừng, xác định phần thưởng nằm tại pointer và hiển thị/gửi
    spinning = false;

    const selectedIndex = getSelectedIndex();
    const prize = segments[selectedIndex];
    // Hiển thị cho người dùng
    showPrize(prize);
    localStorage.setItem(playedKey, "true");
    // Gửi về ManyChat (nếu có subscriberId)
    sendResultToManyChat(subscriberId, prize);
  }
}

drawWheel();

if (localStorage.getItem(playedKey)) {
  spinBtn.disabled = true;
  alert("⚠️ Bạn đã quay rồi. Hẹn bạn lần sau!");
}

spinBtn.addEventListener("click", () => {
  if (localStorage.getItem(playedKey)) {
    alert("⚠️ Bạn đã quay rồi. Hẹn bạn lần sau!");
    return;
  }
  if (spinning) return;
  spinAngle = 20 + Math.random() * 20;
  spinning = true;
  spinBtn.disabled = true;
  rotateWheel();
  blacklist.push(subscriberId);
});

let timeOffset = 0; // 用於控制 noise 的時間流動
let weeds = []; // 儲存多根水草的資料
let fishes = []; // 儲存小魚的資料
let bubbles = []; // 儲存泡泡的資料
let stones = []; // 儲存石頭的資料

function setup() {
  // 建立全螢幕畫布
  let cnv = createCanvas(windowWidth, windowHeight);
  // 將畫布設為絕對定位並允許滑鼠穿透，讓使用者可以操作背後的 iframe
  cnv.style('position', 'absolute');
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('pointer-events', 'none'); 

  // 在畫布底層建立全螢幕 IFRAME
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.et.tku.edu.tw/');
  iframe.style('position', 'absolute');
  iframe.style('top', '0');
  iframe.style('left', '0');
  iframe.style('width', '100%');
  iframe.style('height', '100%');
  iframe.style('z-index', '-1'); // 確保在畫布後方
  iframe.style('border', 'none');

  initWeeds(); // 初始化水草
  initFishes(); // 初始化小魚
  initStones(); // 初始化石頭
}

function initWeeds() {
  weeds = [];
  let numWeeds = 50; // 將數量改為 50 根
  let spacing = width / numWeeds; // 計算每根水草分配到的寬度間距
  // 產生 50 根長短不一的水草
  for (let i = 0; i < numWeeds; i++) {
    weeds.push({
      x: spacing * i + spacing / 2, // 平均分布在畫布上（置中於每個間距）
      targetY: random(height * 0.5, height * 0.85), // 隨機長度（數值變大代表水草變矮）
      noiseOffset: random(1000) // 獨立的 noise 偏移量，讓搖晃不同步
    });
  }
}

function initFishes() {
  fishes = [];
  let numFishes = 12; // 設定畫面中要有 12 隻小魚
  for (let i = 0; i < numFishes; i++) {
    let initialSpeed = random(1, 2.5) * (random() > 0.5 ? 1 : -1);
    fishes.push({
      x: random(width), // 隨機 X 位置
      y: random(height * 0.1, height * 0.4), // 限制在畫布上方的空區
      baseSpeed: initialSpeed, // 記錄原本正常的速度
      speed: initialSpeed, // 目前游動速度
      size: random(10, 20), // 隨機魚的大小
      color: [random(200, 255), random(100, 200), random(50, 100)], // 隨機產生溫暖色調 (橘/紅/黃)
      isSpooked: false, // 是否處於受驚嚇狀態
      spookTimer: 0 // 驚嚇狀態持續時間
    });
  }
}

function initStones() {
  stones = [];
  let numStones = floor(width / 30) + 20; // 根據螢幕寬度決定石頭數量
  for (let i = 0; i < numStones; i++) {
    stones.push({
      x: random(width), // 隨機 X 位置
      y: height - random(5, 30), // 錯落分佈在畫面最底部
      w: random(50, 150), // 隨機石頭寬度
      h: random(30, 80), // 隨機石頭高度
      color: [random(100, 150), random(110, 160), random(110, 160)] // 帶點青灰色的石頭顏色
    });
  }
  // 根據 Y 座標排序，讓位置較低的石頭畫在較前面，產生前後堆疊感
  stones.sort((a, b) => a.y - b.y);
}

function draw() {
  clear(); // 清空上一幀，避免半透明背景產生殘影

  // 設定水草的繪製樣式
  noFill();
  stroke(255);        // 重新啟用邊框，避免被畫小魚時的 noStroke() 影響
  strokeWeight(30);   // 水草粗細（加粗）
  strokeCap(ROUND);   // 讓水草的頂部和底部呈現圓潤感
  strokeJoin(ROUND);  // 轉折處圓滑

  // 迴圈繪製每一根水草
  for (let i = 0; i < weeds.length; i++) {
    let weed = weeds[i];

    // 使用 Canvas 原生 API 建立線性漸層，由底部 (height) 漸變到這根水草的頂部
    let gradient = drawingContext.createLinearGradient(0, height, 0, weed.targetY);
    gradient.addColorStop(0, 'rgba(27, 67, 50, 0.2)'); // 底部原色 #1b4332 加上 0.2 透明度
    gradient.addColorStop(1, 'rgba(116, 198, 157, 0.2)'); // 頂端原色 #74c69d 加上 0.2 透明度
    drawingContext.strokeStyle = gradient;

    // 開始繪製由頂點組成的形狀
    beginShape();
    for (let y = height; y > weed.targetY; y -= 10) {
      let swayAmplitude = map(y, height, weed.targetY, 0, 80); // 將最大搖晃幅度設為 80
      let n = noise(y * 0.01 + weed.noiseOffset, timeOffset); // 加入獨立偏移量
      let offsetX = map(n, 0, 1, -swayAmplitude, swayAmplitude);
      
      // p5.js 的 curveVertex 需要重複第一個點與最後一個點作為控制點
      if (y === height) {
        curveVertex(weed.x + offsetX, y); // 第一個控制點
      }
      curveVertex(weed.x + offsetX, y);   // 實際繪製的點
      if (y - 10 <= weed.targetY) {
        curveVertex(weed.x + offsetX, y); // 最後一個控制點
      }
    }
    endShape();
  }

  // --- 繪製底部石頭 ---
  push();
  noStroke(); // 石頭不需要邊框
  for (let i = 0; i < stones.length; i++) {
    let s = stones[i];
    fill(s.color[0], s.color[1], s.color[2], 51); // 加上 0.2 透明度 (255 * 0.2 約等於 51)
    ellipse(s.x, s.y, s.w, s.h); // 將石頭畫成不同大小的橢圓
  }
  pop();

  // --- 繪製小魚 ---
  noStroke(); // 小魚不需要邊框
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];
    
    // 因為畫布允許滑鼠穿透 (pointer-events: none)，系統無法讀取滑鼠在 iframe 上的座標
    // 我們改為讓小魚有一定機率「自己隨機受驚嚇」而加速衝刺，保持畫面的生動感
    if (!f.isSpooked && random() < 0.005) { // 0.5% 機率觸發驚嚇
      f.isSpooked = true;
      f.spookTimer = floor(random(30, 80)); // 隨機設定衝刺持續的幀數
    }

    if (f.isSpooked) {
      // 處於驚嚇狀態時，加速到原本的 4 倍
      let escapeSpeed = f.baseSpeed * 4;
      f.speed = lerp(f.speed, escapeSpeed, 0.1); // 平滑過渡到逃跑速度
      f.spookTimer--;
      if (f.spookTimer <= 0) f.isSpooked = false; // 時間到解除驚嚇
    } else {
      // 恢復平靜時，平滑恢復成原本的速度
      f.speed = lerp(f.speed, f.baseSpeed, 0.05);
    }

    // 更新小魚位置
    f.x += f.speed;
    
    // 若小魚游出螢幕邊界，讓牠從另一側繞回來
    if (f.speed > 0 && f.x > width + 50) f.x = -50;
    else if (f.speed < 0 && f.x < -50) f.x = width + 50;
    
    // --- 隨機產生泡泡 ---
    if (random() < 0.02) { // 每隻魚每幀有 2% 的機率吐泡泡
      let mouthX = f.x + (f.speed > 0 ? f.size * 1.25 : -f.size * 1.25);
      let mouthY = f.y + sin(timeOffset * 5 + i) * 10;
      bubbles.push({
        x: mouthX,
        y: mouthY,
        size: random(4, 10), // 隨機泡泡大小
        speedY: random(1, 2.5), // 隨機泡泡上升速度
        wobbleOffset: random(100) // 獨立偏移量，讓每個泡泡左右飄動頻率不同步
      });
    }

    push();
    // 將座標系移動到小魚的所在位置，並利用 sin 函數加入微微上下浮動的效果
    translate(f.x, f.y + sin(timeOffset * 5 + i) * 10);
    
    // 若小魚是往左游 (speed < 0)，則利用 scale 水平翻轉畫布
    if (f.speed < 0) scale(-1, 1);
    
    // 繪製魚身與魚尾巴
    fill(f.color[0], f.color[1], f.color[2]);
    ellipse(0, 0, f.size * 2.5, f.size * 1.5); // 魚身 (橢圓)
    triangle(-f.size, 0, -f.size * 2.2, -f.size, -f.size * 2.2, f.size); // 魚尾巴 (三角形)
    
    // 繪製眼睛
    fill(255);
    ellipse(f.size * 0.6, -f.size * 0.2, f.size * 0.5); // 眼白
    fill(0);
    ellipse(f.size * 0.7, -f.size * 0.2, f.size * 0.2); // 瞳孔
    pop();
  }

  // --- 更新與繪製泡泡 ---
  push();
  stroke(255, 180); // 半透明白色邊框
  strokeWeight(1.5);
  fill(255, 80);    // 淡淡的半透明白色內部
  // 為了在陣列中安全地移除元素，我們從陣列尾端往前迴圈 (Reverse Loop)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.y -= b.speedY; // 泡泡往上升
    let currentX = b.x + sin(timeOffset * 3 + b.wobbleOffset) * 8; // 加入水中的左右飄搖感
    ellipse(currentX, b.y, b.size);
    
    // 若泡泡完全飄出畫面最上方，則從陣列中移除它
    if (b.y + b.size < 0) {
      bubbles.splice(i, 1);
    }
  }
  pop();

  // 推進時間，讓水草能持續搖晃
  timeOffset += 0.01;
}

// 確保視窗縮放時，畫布能保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initWeeds(); // 視窗縮放時重新產生水草以適應新尺寸
  initFishes(); // 視窗縮放時重新產生小魚
  initStones(); // 視窗縮放時重新產生石頭
}

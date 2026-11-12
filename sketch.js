// 宣告全域變數，用來儲存各個動作狀態的精靈圖（Sprite Sheet）物件
let stopSpriteSheet;
let walkSpriteSheet;
let jumpSpriteSheet;
let magicSpriteSheet;
let effectSpriteSheet;

// 宣告對應的陣列，用來儲存切割好的單張影格（Frame）圖片
let stopFrames = [];
let walkFrames = [];
let jumpFrames = [];
let magicFrames = [];
let effectFrames = [];

// 宣告變數記錄目前播放到第幾個影格
let currentFrame = 0;

// 宣告變數控制動畫播放速度（影格更新頻率），數值越大切換越慢
let frameDelay = 6;

// 宣告變數記錄當前影格經過了多少個畫格，用於計數切換
let frameCounter = 0;

// 宣告角色目前的狀態：'STOP'、'WALK_RIGHT'、'WALK_LEFT'、'JUMP'、'MAGIC'
let currentState = 'STOP';

// 宣告變數記錄上一個動作狀態，用來判斷動作是否剛好切換
let previousState = 'STOP';

// 宣告角色最後面向的方向：1 代表面向右邊，-1 代表面向左邊
let facingDirection = 1;

// 宣告角色在畫布上的 X 軸座標與 Y 軸垂直偏移量、垂直速度與重力加速度
let posX;
let posYOffset = 0;   // 跳躍時的 Y 軸位移量（向上為負）
let velocityY = 0;    // 垂直速度
let gravity = 0.6;    // 重力加速度
let jumpForce = -12;  // 起跳的瞬間向上推力
let isJumping = false; // 判斷是否正在跳躍中

// 移動速度（每秒移動的像素）
let moveSpeed = 4;

// 宣告特效相關變數
let isCastingMagic = false; // 判斷是否正在施展魔法（空白鍵施法中）
let activeEffect = null;     // 記錄當前生成的特效物件

// p5.js 預載入函式：在網頁畫布建立前，先載入外部的精靈圖檔案以避免讀取延遲
function preload() {
  // 載入停止狀態的精靈圖（路徑：1/STOP/STOP.png）
  stopSpriteSheet = loadImage('1/STOP/STOP.png');
  
  // 載入移動（走路）狀態的精靈圖（路徑：1/WALK/WALK.png）
  walkSpriteSheet = loadImage('1/WALK/WALK.png');

  // 載入跳躍狀態的精靈圖（路徑：1/JUMP/JUMP.png）
  jumpSpriteSheet = loadImage('1/JUMP/JUMP.png');

  // 載入魔法施放狀態的精靈圖（路徑：1/MAGIC01/MAGIC01.png）
  magicSpriteSheet = loadImage('1/MAGIC01/MAGIC01.png');

  // 載入特效精靈圖（路徑：1/特效/特效.png）
  effectSpriteSheet = loadImage('1/特效/特效.png');
}

// p5.js 初始化設定函式：網頁載入時執行一次，用於建立畫布與切割圖片
function setup() {
  // 建立一個剛好填滿整個視窗寬高的動態畫布
  createCanvas(windowWidth, windowHeight);
  
  // 設定畫格更新速率為每秒 60 次，讓動畫播放更為流暢
  frameRate(60);

  // 初始化角色位置在整個畫布 X 軸的 2/3 位置上
  posX = width * (2 / 3);

  // --- 切割停止狀態（STOP）的圖片精靈（共 6 張，總寬 931，高 211） ---
  let stopTotal = 6;
  let stopW = 931 / stopTotal;
  let stopH = 211;
  for (let i = 0; i < stopTotal; i++) {
    let img = stopSpriteSheet.get(i * stopW, 0, stopW, stopH);
    stopFrames.push(img);
  }

  // --- 切割走路狀態（WALK）的圖片精靈（共 9 張，總寬 1246，高 198） ---
  let walkTotal = 9;
  let walkW = 1246 / walkTotal;
  let walkH = 198;
  for (let i = 0; i < walkTotal; i++) {
    let img = walkSpriteSheet.get(i * walkW, 0, walkW, walkH);
    walkFrames.push(img);
  }

  // --- 切割跳躍狀態（JUMP）的圖片精靈（共 6 張，總寬 1015，高 198） ---
  let jumpTotal = 6;
  let jumpW = 1015 / jumpTotal;
  let jumpH = 198;
  for (let i = 0; i < jumpTotal; i++) {
    let img = jumpSpriteSheet.get(i * jumpW, 0, jumpW, jumpH);
    jumpFrames.push(img);
  }

  // --- 切割魔法施放狀態（MAGIC01）的圖片精靈（共 6 張，總寬 1561，高 155） ---
  let magicTotal = 6;
  let magicW = 1561 / magicTotal;
  let magicH = 155;
  for (let i = 0; i < magicTotal; i++) {
    let img = magicSpriteSheet.get(i * magicW, 0, magicW, magicH);
    magicFrames.push(img);
  }

  // --- 切割特效（特效）的圖片精靈（共 5 張，總寬 629，高 19） ---
  let effectTotal = 5;
  let effectW = 629 / effectTotal;
  let effectH = 19;
  for (let i = 0; i < effectTotal; i++) {
    let img = effectSpriteSheet.get(i * effectW, 0, effectW, effectH);
    effectFrames.push(img);
  }
}

// p5.js 繪製迴圈函式：每一秒重複執行約 60 次，持續更新畫面與互動邏輯
function draw() {
  // 設定背景顏色為淺草地色（明亮的淺綠色）
  background(168, 228, 160);

  // 計算角色的寬高與邊界限制，用來進行碰撞邊界判定
  let targetHeight = height / 3;
  let walkOriginalW = 1246 / 9;
  let walkOriginalH = 198;
  let targetWidth = targetHeight * (walkOriginalW / walkOriginalH);
  
  let leftLimit = targetWidth / 2;
  let rightLimit = width - targetWidth / 2;

  // 記錄上一個迴圈的狀態，用於比對是否發生狀態切換
  previousState = currentState;

  // 優先處理施放魔法狀態（按下空白鍵）
  if (isCastingMagic) {
    currentState = 'MAGIC';
    // 魔法動畫執行一次就好：當播放到最後一格時結束施法狀態
    if (currentFrame >= magicFrames.length - 1) {
      isCastingMagic = false;
      currentState = 'STOP';
      
      // 施法完成後，根據當前面向的方向產生特效圖片（依照指定的 629 * 19 比例計算）
      let effOriginalW = 629 / 5;
      let effOriginalH = 19;
      let effH = targetHeight * 0.3; // 特效高度設定為角色高度的 30%
      let effW = effH * (effOriginalW / effOriginalH); // 依照原圖寬高比縮放特效寬度
      
      activeEffect = {
        x: posX,
        y: height - targetHeight / 2, // 顯示在角色中心高度附近
        w: effW,
        h: effH,
        dir: facingDirection,
        frame: 0,
        counter: 0
      };
    }
  } else if (isJumping) {
    // 如果正在跳躍中，優先執行跳躍物理運算
    currentState = 'JUMP';
    
    // 讓垂直速度受到重力影響而改變
    velocityY += gravity;
    posYOffset += velocityY;

    // 空中左右移動偵測
    if (keyIsDown(RIGHT_ARROW)) {
      if (posX < rightLimit) posX += moveSpeed;
      facingDirection = 1;
    } else if (keyIsDown(LEFT_ARROW)) {
      if (posX > leftLimit) posX -= moveSpeed;
      facingDirection = -1;
    }

    // 當角色落回地面時，結束跳躍並回到原位
    if (posYOffset >= 0) {
      posYOffset = 0;
      isJumping = false;
      currentState = 'STOP';
    }
  } else {
    // 沒有在施法或跳躍時，偵測鍵盤按鍵
    if (keyIsDown(UP_ARROW)) {
      isJumping = true;
      velocityY = jumpForce;
      currentState = 'JUMP';
    } else if (keyIsDown(RIGHT_ARROW)) {
      if (posX < rightLimit) {
        posX += moveSpeed;
        currentState = 'WALK_RIGHT';
        facingDirection = 1;
      } else {
        posX = rightLimit;
        currentState = 'STOP';
      }
    } else if (keyIsDown(LEFT_ARROW)) {
      if (posX > leftLimit) {
        posX -= moveSpeed;
        currentState = 'WALK_LEFT';
        facingDirection = -1;
      } else {
        posX = leftLimit;
        currentState = 'STOP';
      }
    } else {
      currentState = 'STOP';
    }
  }

  // 如果前後狀態改變了，將影格重設以確保動作流暢地從頭開始銜接
  if (currentState !== previousState) {
    currentFrame = 0;
    frameCounter = 0;
  }

  // 決定目前要使用哪一組圖片陣列與原始尺寸比例
  let currentFrames;
  let originalW, originalH;
  
  if (currentState === 'STOP') {
    currentFrames = stopFrames;
    originalW = 931 / 6;
    originalH = 211;
  } else if (currentState === 'JUMP') {
    currentFrames = jumpFrames;
    originalW = 1015 / 6;  // JUMP 寬度 1015，共 6 張
    originalH = 198;       // JUMP 高度 198
  } else if (currentState === 'MAGIC') {
    currentFrames = magicFrames;
    originalW = 1561 / 6;
    originalH = 155;
  } else {
    currentFrames = walkFrames;
    originalW = 1246 / 9;
    originalH = 198;
  }

  // 重新計算當前狀態下的顯示寬度
  targetWidth = targetHeight * (originalW / originalH);
  
  // 角色最底端的 Y 座標落在畫布的最底端，加上跳躍的 posYOffset 變化
  let targetY = height + posYOffset;

  // 更新動畫影格計數器
  frameCounter++;
  if (frameCounter >= frameDelay) {
    if (currentState === 'JUMP') {
      // 跳躍影格播放至最後一格時停住，直到落地回原位
      if (currentFrame < currentFrames.length - 1) {
        currentFrame++;
      }
    } else if (currentState === 'MAGIC') {
      // 魔法播放一次，由內部邏輯控制結束，此處循序加到最後一格
      if (currentFrame < currentFrames.length - 1) {
        currentFrame++;
      }
    } else {
      currentFrame = (currentFrame + 1) % currentFrames.length;
    }
    frameCounter = 0;
  }

  // --- 繪製特效邏輯 ---
  if (activeEffect) {
    // 特效移動速度
    let effectSpeed = 10;
    if (activeEffect.dir === 1) {
      activeEffect.x += effectSpeed;
      // 往右移動至畫布右端就消失不見
      if (activeEffect.x > width) {
        activeEffect = null;
      }
    } else {
      activeEffect.x -= effectSpeed;
      // 往左移動到畫布左端即消失不見
      if (activeEffect.x < 0) {
        activeEffect = null;
      }
    }

    // 如果特效還存在，則進行播放與繪製
    if (activeEffect) {
      activeEffect.counter++;
      if (activeEffect.counter >= frameDelay) {
        // 特效圖片循環播放
        activeEffect.frame = (activeEffect.frame + 1) % effectFrames.length;
        activeEffect.counter = 0;
      }

      push();
      translate(activeEffect.x, activeEffect.y);
      if (activeEffect.dir === -1) {
        scale(-1, 1); // 特效面向左邊時進行水平翻轉
      }
      imageMode(CENTER);
      image(effectFrames[activeEffect.frame], 0, 0, activeEffect.w, activeEffect.h);
      pop();
    }
  }

  // 使用 push() 與 pop() 隔離畫布繪圖狀態，避免影響其他設定
  push();
  
  // 將原點移動到角色中心點位置（包含跳躍的垂直位移）
  translate(posX, targetY - targetHeight / 2);
  
  // 如果面向左邊（向左移動或施法/停在左邊），利用 scale(-1, 1) 將圖片進行水平鏡射反轉
  if (facingDirection === -1) {
    scale(-1, 1);
  }

  // 設定圖片繪製模式從中心點開始繪製（CENTER），配合 translate 精準對齊
  imageMode(CENTER);
  
  // 繪製當前影格的圖片
  image(currentFrames[currentFrame], 0, 0, targetWidth, targetHeight);
  
  pop();
}

// 監聽鍵盤按下事件：當按下空白鍵且目前不是在施法或跳躍中時，觸發施放魔法
function keyPressed() {
  if (key === ' ' && !isCastingMagic && !isJumping) {
    isCastingMagic = true;
    currentFrame = 0;
    frameCounter = 0;
  }
}

// 當瀏覽器視窗大小改變（如手機旋轉螢幕或調整視窗大小）時自動觸發，調整畫布尺寸以適應不同載具
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
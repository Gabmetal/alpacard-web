import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AlpacaBaristaCard3DProps {
  stamps: number;
  maxStamps: number;
  storeName: string;
  cardTitle: string;
  cardSubtitle: string;
  progressLabel: string;
  rewardReadyText: string;
  rewardDescText: string;
  remainingStampsText: string;
  scanTrigger: number;
  resetTrigger: number;
}

/**
 * Plays a short, pleasant POS scanner beep using the Web Audio API
 */
function playScannerBeep(isRewardUnlock: boolean) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isRewardUnlock ? 1046.5 : 880, now);
    if (isRewardUnlock) {
      osc.frequency.setValueAtTime(1318.5, now + 0.09);
      osc.frequency.setValueAtTime(1567.98, now + 0.18);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isRewardUnlock ? 0.35 : 0.14));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isRewardUnlock ? 0.36 : 0.15));
  } catch {
    // Ignore audio context restrictions if blocked
  }
}

/**
 * Helper to create a rounded rectangle THREE.Shape centered at (0, 0)
 */
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/**
 * Draws a rounded rect path onto a 2D canvas context
 */
function roundRect2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Creates a baked warm brick wall texture with subtle ambient occlusion
 */
function createBakedBrickTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Mortar base
  ctx.fillStyle = '#c9b8a8';
  ctx.fillRect(0, 0, 512, 256);

  const rows = 10;
  const cols = 8;
  const brickH = 256 / rows;
  const brickW = 512 / cols;
  const palette = ['#9c4a32', '#b0583c', '#8a3e28', '#a85138', '#bf6a4b', '#7d3722'];

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brickW / 2);
    for (let col = -1; col <= cols; col++) {
      const x = col * brickW + offset;
      const y = r * brickH;
      ctx.fillStyle = palette[(r * 7 + col * 3 + 10) % palette.length];
      roundRect2D(ctx, x + 3, y + 3, brickW - 6, brickH - 6, 3);
      ctx.fill();
    }
  }

  // Baked warm top/bottom AO vignette
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(30, 15, 5, 0.35)');
  grad.addColorStop(0.3, 'rgba(255, 210, 160, 0.08)');
  grad.addColorStop(1, 'rgba(25, 12, 5, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a baked wooden horizontal plank texture for the front of the coffee counter
 */
function createBakedWoodPlankTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  const planks = 5;
  const pH = 256 / planks;
  const tones = ['#9c663b', '#8c5830', '#a66f43', '#825029', '#966036'];

  for (let i = 0; i < planks; i++) {
    ctx.fillStyle = tones[i % tones.length];
    ctx.fillRect(0, i * pH, 512, pH);
    // Plank seam line
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(0, i * pH, 512, 3);
  }

  // Baked top shadow under countertop lip
  const ao = ctx.createLinearGradient(0, 0, 0, 256);
  ao.addColorStop(0, 'rgba(20, 10, 4, 0.42)');
  ao.addColorStop(0.22, 'rgba(0, 0, 0, 0)');
  ao.addColorStop(1, 'rgba(20, 10, 4, 0.25)');
  ctx.fillStyle = ao;
  ctx.fillRect(0, 0, 512, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates the Chalkboard MENU texture seen on the upper-right brick wall
 */
function createChalkboardMenuTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 220;
  const ctx = c.getContext('2d')!;

  // Slate chalkboard background
  ctx.fillStyle = '#1c1b1a';
  ctx.fillRect(0, 0, 384, 220);

  ctx.fillStyle = '#f5f5f4';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.fillText('MENU', 192, 34);

  ctx.strokeStyle = 'rgba(245,245,244,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(32, 44);
  ctx.lineTo(352, 44);
  ctx.stroke();

  ctx.font = '600 13px monospace';
  ctx.textAlign = 'left';
  const leftItems = [
    ['ESPRESSO', '3.50'],
    ['AMERICANO', '3.60'],
    ['FLAT WHITE', '4.20'],
    ['CAPPUCCINO', '4.50'],
    ['CROISSANT', '3.80'],
  ];
  leftItems.forEach(([name, price], i) => {
    const y = 70 + i * 26;
    ctx.fillStyle = '#e7e5e4';
    ctx.fillText(name, 26, y);
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(price, 142, y);
  });

  const rightItems = [
    ['COLD BREW', '4.50'],
    ['MOCHA', '4.80'],
    ['MATCHA', '4.90'],
    ['POUR OVER', '5.20'],
    ['MUFFIN', '3.50'],
  ];
  rightItems.forEach(([name, price], i) => {
    const y = 70 + i * 26;
    ctx.fillStyle = '#e7e5e4';
    ctx.fillText(name, 206, y);
    ctx.fillStyle = '#fcd34d';
    ctx.fillText(price, 326, y);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function AlpacaBaristaCard3D({
  stamps,
  maxStamps,
  storeName,
  cardTitle,
  cardSubtitle,
  progressLabel,
  rewardReadyText,
  rewardDescText,
  remainingStampsText,
  scanTrigger,
  resetTrigger,
}: AlpacaBaristaCard3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Store latest props in ref for the animation & texture draw loop
  const propsRef = useRef({
    stamps,
    maxStamps,
    storeName,
    cardTitle,
    cardSubtitle,
    progressLabel,
    rewardReadyText,
    rewardDescText,
    remainingStampsText,
  });
  propsRef.current = {
    stamps,
    maxStamps,
    storeName,
    cardTitle,
    cardSubtitle,
    progressLabel,
    rewardReadyText,
    rewardDescText,
    remainingStampsText,
  };

  // Animation & lifecycle state shared with the Three.js loop
  const animRef = useRef({
    isScanning: false,
    scanStartTime: 0,
    scanDuration: 1.95,
    targetSlotIndex: -1,
    isRewardCelebration: false,
    isResetFlip: false,
    resetStartTime: 0,
    userPointerX: 0,
    userPointerY: 0,
    gyroX: 0,
    gyroY: 0,
    isPointerHoveringCard: false,
    hasRevealed3D: false,
    needTextureUpdate: true,
    displayedStampsOnCard: stamps,
    isVisibleInViewport: true,
    isTabActive: true,
  });

  // Trigger scan animation when scanTrigger increments
  useEffect(() => {
    if (scanTrigger === 0) return;
    const a = animRef.current;
    a.isScanning = true;
    a.scanStartTime = performance.now() / 1000;
    a.targetSlotIndex = Math.max(0, stamps - 1);
    a.isRewardCelebration = stamps >= maxStamps;
    a.displayedStampsOnCard = Math.max(0, stamps - 1);
    a.hasRevealed3D = true;
    a.needTextureUpdate = true;
  }, [scanTrigger, stamps, maxStamps]);

  // Trigger reset flip when resetTrigger increments
  useEffect(() => {
    if (resetTrigger === 0) return;
    const a = animRef.current;
    a.isResetFlip = true;
    a.resetStartTime = performance.now() / 1000;
    a.isScanning = false;
    a.targetSlotIndex = -1;
    a.displayedStampsOnCard = 0;
    a.hasRevealed3D = true;
    a.needTextureUpdate = true;
  }, [resetTrigger]);

  // Update texture whenever text/language changes
  useEffect(() => {
    if (!animRef.current.isScanning) {
      animRef.current.displayedStampsOnCard = stamps;
    }
    animRef.current.needTextureUpdate = true;
  }, [
    stamps,
    storeName,
    cardTitle,
    cardSubtitle,
    progressLabel,
    rewardReadyText,
    rewardDescText,
    remainingStampsText,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const getContainerSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(250, Math.floor(rect.width || container.clientWidth || 340));
      const h = w < 360 ? 535 : 585;
      return { w, h };
    };

    const { w: initW, h: initH } = getContainerSize();

    // 1. SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();

    const fov = 35;
    const camera = new THREE.PerspectiveCamera(fov, initW / initH, 0.1, 100);
    let baseCameraZ = 12.0;

    const updateCameraDistance = (w: number, h: number) => {
      const aspect = w / h;
      const halfFovTan = Math.tan((fov * Math.PI) / 360);
      // Ensure the full coffee shop counter + card width (4.65 units) fits on both mobile & desktop
      const requiredZForWidth = 4.65 / (2 * halfFovTan * aspect) + 0.45;
      baseCameraZ = Math.max(11.6, requiredZForWidth);
      camera.aspect = aspect;
      camera.position.set(0, 0.05, baseCameraZ);
      camera.lookAt(0, 0.02, 0);
      camera.updateProjectionMatrix();
    };

    updateCameraDistance(initW, initH);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = `${initH}px`;
    renderer.domElement.style.maxWidth = '100%';
    renderer.domElement.style.display = 'block';
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. WARM SPECIALTY COFFEE SHOP LIGHTING
    // Warm cozy ambient fill
    const ambientLight = new THREE.AmbientLight(0xfff6e9, 1.45);
    scene.add(ambientLight);

    // Warm morning sunlight streaming through the left street window
    const windowSunLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
    windowSunLight.position.set(-5.2, 6.2, 5.5);
    windowSunLight.castShadow = true;
    windowSunLight.shadow.mapSize.width = 1024;
    windowSunLight.shadow.mapSize.height = 1024;
    windowSunLight.shadow.camera.near = 1;
    windowSunLight.shadow.camera.far = 20;
    const d = 5.5;
    windowSunLight.shadow.camera.left = -d;
    windowSunLight.shadow.camera.right = d;
    windowSunLight.shadow.camera.top = d;
    windowSunLight.shadow.camera.bottom = -d;
    windowSunLight.shadow.bias = -0.0015;
    scene.add(windowSunLight);

    // Warm golden point light from the hanging Edison pendant lamps
    const pendantPointLight = new THREE.PointLight(0xffb74d, 1.8, 8.5);
    pendantPointLight.position.set(0.2, 2.85, 0.3);
    scene.add(pendantPointLight);

    // Dynamic green POS scanner point light (activates during smartphone scan)
    const scanPointLight = new THREE.PointLight(0x10b981, 0, 5.5);
    scanPointLight.position.set(0, 0.2, 1.5);
    scene.add(scanPointLight);

    // ============================================================================
    // 3. SPECIALTY COFFEE SHOP DIORAMA (Customer POV matching Reference Image)
    // ============================================================================
    const shopGroup = new THREE.Group();
    shopGroup.position.set(0, 1.65, -0.35);
    scene.add(shopGroup);

    // Shared Stylized Clay / Toy Materials
    const woolMat = new THREE.MeshStandardMaterial({
      color: 0xfbf6ee,
      roughness: 0.74,
      metalness: 0.02,
    });
    const faceSkinMat = new THREE.MeshStandardMaterial({
      color: 0xf5dfc3,
      roughness: 0.65,
      metalness: 0.02,
    });
    const snoutMat = new THREE.MeshStandardMaterial({
      color: 0xfdf1dc,
      roughness: 0.6,
      metalness: 0.02,
    });
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xe5b18a,
      roughness: 0.7,
    });
    const darkBrownMat = new THREE.MeshStandardMaterial({
      color: 0x3b2316,
      roughness: 0.42,
      metalness: 0.08,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x1e110a,
      roughness: 0.1,
      metalness: 0.15,
    });
    // Forest Green Barista Apron (from reference image!)
    const greenApronMat = new THREE.MeshStandardMaterial({
      color: 0x2c4c38,
      roughness: 0.72,
      metalness: 0.04,
    });
    const woodShelfMat = new THREE.MeshStandardMaterial({
      color: 0x8f5b34,
      roughness: 0.62,
      metalness: 0.05,
    });
    const stoneCounterTopMat = new THREE.MeshStandardMaterial({
      color: 0xc7bdb1,
      roughness: 0.48,
      metalness: 0.06,
    });
    const leafGreenMat = new THREE.MeshStandardMaterial({
      color: 0x3b7a3e,
      roughness: 0.58,
    });
    const leafLightMat = new THREE.MeshStandardMaterial({
      color: 0x5da34e,
      roughness: 0.55,
    });
    const pastryGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd9822b,
      roughness: 0.52,
      metalness: 0.04,
    });
    const breadCrustMat = new THREE.MeshStandardMaterial({
      color: 0xc87a2e,
      roughness: 0.6,
    });

    // --- 3A. BACKGROUND ARCHITECTURE: BRICK WALL, STREET WINDOW, SHELVES, MENU & PENDANT LAMPS ---
    const bgGroup = new THREE.Group();
    bgGroup.position.set(0, 0.25, -1.05);
    shopGroup.add(bgGroup);

    // 1. Warm Brick Back Wall (center & right)
    const brickTex = createBakedBrickTexture();
    const brickWallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.25, 2.35, 0.12),
      new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.85 })
    );
    brickWallMesh.position.set(0.65, 0.36, 0);
    brickWallMesh.receiveShadow = true;
    bgGroup.add(brickWallMesh);

    // 2. Large Left Street Window (black mullion frame + sunlit street glow + hanging plants)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(-1.52, 0.36, 0.05);
    windowGroup.rotation.y = 0.18;
    bgGroup.add(windowGroup);

    // Sunlit outside street backdrop plane
    const streetSkyMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const windowGlassPane = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 2.28), streetSkyMat);
    windowGlassPane.position.set(0, 0, -0.02);
    windowGroup.add(windowGlassPane);

    // Soft blurred warm building/trees silhouette outside the window
    const outsideBuilding = new THREE.Mesh(
      new THREE.PlaneGeometry(1.28, 0.95),
      new THREE.MeshBasicMaterial({ color: 0xd6b892 })
    );
    outsideBuilding.position.set(0, 0.2, -0.01);
    windowGroup.add(outsideBuilding);

    const outsideGreenery = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x86efac })
    );
    outsideGreenery.scale.set(1.4, 0.9, 0.2);
    outsideGreenery.position.set(-0.2, -0.35, -0.005);
    windowGroup.add(outsideGreenery);

    // Black window mullions / frame bars
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
    const vFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.32, 0.06), frameMat);
    vFrameLeft.position.set(-0.64, 0, 0.02);
    windowGroup.add(vFrameLeft);

    const vFrameMid = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.32, 0.05), frameMat);
    vFrameMid.position.set(0, 0, 0.02);
    windowGroup.add(vFrameMid);

    const vFrameRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.32, 0.06), frameMat);
    vFrameRight.position.set(0.64, 0, 0.02);
    windowGroup.add(vFrameRight);

    const hFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.06, 0.06), frameMat);
    hFrameTop.position.set(0, 1.13, 0.02);
    windowGroup.add(hFrameTop);

    const hFrameMid = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.045, 0.05), frameMat);
    hFrameMid.position.set(0, 0.35, 0.02);
    windowGroup.add(hFrameMid);

    // Hanging potted ivy vines at the top of the street window
    const hangingVinesGroup = new THREE.Group();
    hangingVinesGroup.position.set(-0.1, 1.02, 0.12);
    windowGroup.add(hangingVinesGroup);

    const planterBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.16), woodShelfMat);
    hangingVinesGroup.add(planterBox);

    for (let v = 0; v < 9; v++) {
      const vx = -0.4 + v * 0.1;
      const vLen = 0.25 + (v % 3) * 0.16;
      for (let l = 0; l < 4; l++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.048, 8, 8),
          (v + l) % 2 === 0 ? leafGreenMat : leafLightMat
        );
        leaf.scale.set(0.8, 1.3, 0.5);
        leaf.position.set(vx + Math.sin(l) * 0.02, -0.08 - l * (vLen / 3.5), 0.05);
        hangingVinesGroup.add(leaf);
      }
    }

    // 3. Framed Chalkboard MENU on Upper-Right Brick Wall
    const menuGroup = new THREE.Group();
    menuGroup.position.set(1.42, 0.88, 0.09);
    bgGroup.add(menuGroup);

    const menuFrame = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.86, 0.05), woodShelfMat);
    menuFrame.castShadow = true;
    menuGroup.add(menuFrame);

    const menuBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.74),
      new THREE.MeshBasicMaterial({ map: createChalkboardMenuTexture() })
    );
    menuBoard.position.set(0, 0, 0.028);
    menuGroup.add(menuBoard);

    // 4. Wooden Wall Shelves Behind the Alpaca with Coffee Bags, Jars & Trailing Plants
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-0.12, 0.72, 0.16);
    bgGroup.add(shelfGroup);

    const topShelf = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.055, 0.26), woodShelfMat);
    topShelf.position.set(0, 0.34, 0);
    topShelf.castShadow = true;
    shelfGroup.add(topShelf);

    const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.055, 0.26), woodShelfMat);
    lowerShelf.position.set(0, -0.06, 0);
    lowerShelf.castShadow = true;
    shelfGroup.add(lowerShelf);

    // Small coffee bags & jars sitting on the wall shelves
    const shelfBagColors = [0xfbbf24, 0x60a5fa, 0xf472b6, 0x34d399];
    for (let sb = 0; sb < 4; sb++) {
      const sBag = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.22, 0.11),
        new THREE.MeshStandardMaterial({ color: 0xd6b08a, roughness: 0.7 })
      );
      sBag.position.set(-0.44 + sb * 0.26, 0.08, 0);
      shelfGroup.add(sBag);

      const sLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.11, 0.1),
        new THREE.MeshBasicMaterial({ color: shelfBagColors[sb] })
      );
      sLabel.position.set(-0.44 + sb * 0.26, 0.06, 0.058);
      shelfGroup.add(sLabel);
    }

    // Trailing green plant on the right side of the top shelf
    const shelfPlantGroup = new THREE.Group();
    shelfPlantGroup.position.set(0.52, 0.42, 0.04);
    shelfGroup.add(shelfPlantGroup);
    for (let p = 0; p < 7; p++) {
      const pLeaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        p % 2 === 0 ? leafGreenMat : leafLightMat
      );
      pLeaf.scale.set(1.0, 1.2, 0.7);
      pLeaf.position.set(Math.sin(p * 1.3) * 0.08, -p * 0.075, 0.05);
      shelfPlantGroup.add(pLeaf);
    }

    // 5. Back Counter Behind Barista: Commercial Dual-Grouphead Espresso Machine + Bean Grinders
    const backBarGroup = new THREE.Group();
    backBarGroup.position.set(1.12, -0.25, 0.35);
    bgGroup.add(backBarGroup);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.26,
      metalness: 0.72,
    });
    const darkMachineMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.45,
      metalness: 0.35,
    });

    // Commercial wide espresso machine body
    const espBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.42), steelMat);
    espBody.position.set(0, 0.18, 0);
    espBody.castShadow = true;
    backBarGroup.add(espBody);

    // Dual groupheads & portafilter handles
    [-0.22, 0.22].forEach((gx) => {
      const gh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.08, 14), darkMachineMat);
      gh.position.set(gx, 0.14, 0.22);
      backBarGroup.add(gh);

      const handle = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.14, 6, 8),
        darkMachineMat
      );
      handle.rotation.x = Math.PI / 2;
      handle.rotation.z = -0.25;
      handle.position.set(gx + 0.05, 0.12, 0.31);
      backBarGroup.add(handle);
    });

    // Stacked ceramic espresso cups on top of the machine
    const cupColors = [0xffffff, 0xfde68a, 0x93c5fd, 0xffffff];
    cupColors.forEach((cc, ci) => {
      const miniCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.042, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: cc, roughness: 0.25 })
      );
      miniCup.position.set(-0.3 + ci * 0.18, 0.51, 0);
      backBarGroup.add(miniCup);
    });

    // Coffee Bean Grinder next to the espresso machine
    const grinderBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.36, 16), darkMachineMat);
    grinderBase.position.set(0.68, 0.08, 0.02);
    backBarGroup.add(grinderBase);

    const grinderHopper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.08, 0.24, 16),
      new THREE.MeshStandardMaterial({
        color: 0x78350f,
        transparent: true,
        opacity: 0.78,
        roughness: 0.2,
      })
    );
    grinderHopper.position.set(0.68, 0.38, 0.02);
    backBarGroup.add(grinderHopper);

    // Rising Steam Puffs from the Espresso Machine
    const steamPuffs: THREE.Mesh[] = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
    });
    for (let i = 0; i < 4; i++) {
      const sPuff = new THREE.Mesh(new THREE.SphereGeometry(0.052 - i * 0.006, 10, 10), steamMat.clone());
      sPuff.position.set(-0.18, 0.55 + i * 0.12, 0.15);
      backBarGroup.add(sPuff);
      steamPuffs.push(sPuff);
    }

    // 6. Hanging Warm Cage Pendant Lamps (Swaying gently in the animation loop!)
    const createPendantLamp = (x: number, y: number, z: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8),
        frameMat
      );
      cord.position.set(0, -0.21, 0);
      pivot.add(cord);

      const shadeCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.11, 0.08, 14),
        frameMat
      );
      shadeCap.position.set(0, -0.42, 0);
      pivot.add(shadeCap);

      // Wire cage around bulb
      const cage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.16, 0.22, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x292524, wireframe: true })
      );
      cage.position.set(0, -0.54, 0);
      pivot.add(cage);

      // Glowing warm Edison bulb
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffedd5 })
      );
      bulb.scale.set(0.85, 1.25, 0.85);
      bulb.position.set(0, -0.53, 0);
      pivot.add(bulb);

      // Soft warm halo glow sprite around the bulb
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        })
      );
      halo.position.set(0, -0.53, 0);
      pivot.add(halo);

      return pivot;
    };

    const leftLamp = createPendantLamp(-0.92, 1.52, 0.55);
    const centerLamp = createPendantLamp(0.08, 1.56, 0.65);
    bgGroup.add(leftLamp, centerLamp);

    // --- 3B. CENTER CHARACTER: THE STYLIZED ALPACA BARISTA IN GREEN APRON ---
    const alpacaRoot = new THREE.Group();
    alpacaRoot.position.set(0.14, -0.24, 0.02);
    alpacaRoot.scale.setScalar(0.86);
    shopGroup.add(alpacaRoot);

    const bodyGroup = new THREE.Group();
    alpacaRoot.add(bodyGroup);

    // Fluffy White Torso & Long Neck (matching reference image!)
    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 0.58, 16, 24), woolMat);
    torsoMesh.position.set(0, 0.08, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.52, 20), woolMat);
    neckMesh.position.set(0, 0.58, 0.04);
    neckMesh.castShadow = true;
    bodyGroup.add(neckMesh);

    // Fluffy neck & shoulder wool puffs
    const bodyPuffs: [number, number, number, number][] = [
      [0, 0.55, 0.24, 0.19],
      [-0.2, 0.52, 0.2, 0.17],
      [0.2, 0.52, 0.2, 0.17],
      [0, 0.36, 0.29, 0.21],
      [-0.48, 0.12, 0.22, 0.23],
      [0.48, 0.12, 0.22, 0.23],
      [-0.52, -0.08, 0.26, 0.24],
      [0.52, -0.08, 0.26, 0.24],
    ];
    bodyPuffs.forEach(([px, py, pz, pr]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 18, 18), woolMat);
      puff.position.set(px, py, pz);
      puff.castShadow = true;
      bodyGroup.add(puff);
    });

    // Forest Green Barista Bib Apron (#2c4c38) + Neck Straps + Round Pin Badge
    const apronBib = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.61, 0.72, 24, 1, true, -0.82, 1.64),
      greenApronMat
    );
    apronBib.position.set(0, -0.02, 0.06);
    bodyGroup.add(apronBib);

    // Left & right green apron shoulder straps
    [-0.24, 0.24].forEach((sx) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.32, 0.05), greenApronMat);
      strap.position.set(sx, 0.38, 0.48);
      strap.rotation.x = -0.35;
      strap.rotation.z = sx * -0.3;
      bodyGroup.add(strap);
    });

    // Cute round brass/wood barista pin on the right apron strap (just like reference image!)
    const apronPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.03, 18),
      new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.35, metalness: 0.4 })
    );
    apronPin.rotation.x = Math.PI / 2;
    apronPin.position.set(0.19, 0.24, 0.58);
    bodyGroup.add(apronPin);

    // --- ALPACA HEAD GROUP ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.96, 0.08);
    bodyGroup.add(headGroup);

    const headCore = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 28), woolMat);
    headCore.scale.set(1.04, 0.98, 0.95);
    headCore.castShadow = true;
    headGroup.add(headCore);

    const facePlate = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 28), faceSkinMat);
    facePlate.scale.set(1.02, 0.88, 0.65);
    facePlate.position.set(0, -0.02, 0.25);
    headGroup.add(facePlate);

    // Fluffy Forehead & Cheek Puffs
    const headWoolPuffs: [number, number, number, number, number, number, number][] = [
      [0, 0.34, 0.32, 0.24, 1.15, 1.0, 0.95],
      [-0.25, 0.32, 0.26, 0.21, 1.0, 1.0, 0.9],
      [0.25, 0.32, 0.26, 0.21, 1.0, 1.0, 0.9],
      [0, 0.45, 0.08, 0.25, 1.1, 0.95, 1.0],
      [-0.44, 0.06, 0.16, 0.22, 0.95, 1.05, 0.9],
      [0.44, 0.06, 0.16, 0.22, 0.95, 1.05, 0.9],
      [-0.41, -0.16, 0.2, 0.21, 1.0, 0.95, 0.9],
      [0.41, -0.16, 0.2, 0.21, 1.0, 0.95, 0.9],
      [0, -0.34, 0.22, 0.2, 1.35, 0.75, 0.85],
    ];
    headWoolPuffs.forEach(([x, y, z, r, sx, sy, sz]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 18), woolMat);
      puff.position.set(x, y, z);
      puff.scale.set(sx, sy, sz);
      puff.castShadow = true;
      headGroup.add(puff);
    });

    // Snout & Y-Nose + Smile
    const snoutMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 22, 22), snoutMat);
    snoutMesh.scale.set(1.12, 0.88, 0.85);
    snoutMesh.position.set(0, -0.1, 0.45);
    headGroup.add(snoutMesh);

    const noseTop = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), darkBrownMat);
    noseTop.scale.set(1.35, 0.75, 0.7);
    noseTop.position.set(0, -0.045, 0.61);
    headGroup.add(noseTop);

    const philtrum = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.065, 8, 8), darkBrownMat);
    philtrum.position.set(0, -0.095, 0.61);
    headGroup.add(philtrum);

    const smileLeft = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.015, 10, 18, Math.PI * 0.85),
      darkBrownMat
    );
    smileLeft.rotation.z = Math.PI + 0.2;
    smileLeft.position.set(-0.055, -0.12, 0.595);
    headGroup.add(smileLeft);

    const smileRight = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.015, 10, 18, Math.PI * 0.85),
      darkBrownMat
    );
    smileRight.rotation.z = Math.PI - 0.2;
    smileRight.position.set(0.055, -0.12, 0.595);
    headGroup.add(smileRight);

    // Rosy Cheek Blushes
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xf4978e,
      transparent: true,
      opacity: 0.42,
    });
    [-1, 1].forEach((s) => {
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), blushMat);
      blush.position.set(s * 0.26, -0.09, 0.49);
      blush.rotation.y = s * 0.35;
      headGroup.add(blush);
    });

    // Big Glossy Chibi Eyes with Catchlights
    const createEye = (xSign: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(xSign * 0.2, 0.04, 0.49);

      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.072, 20, 20), eyeMat);
      eyeball.scale.set(1, 1.1, 0.7);
      eyeGroup.add(eyeball);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      catchlight.position.set(xSign * -0.018, 0.028, 0.052);
      eyeGroup.add(catchlight);

      return eyeGroup;
    };

    const leftEye = createEye(-1);
    const rightEye = createEye(1);
    headGroup.add(leftEye, rightEye);

    // Sculpted Alpaca Ears
    const createEar = (xSign: number) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(xSign * 0.33, 0.42, 0.04);
      earPivot.rotation.z = xSign * -0.2;

      const outerEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.25, 12, 16), woolMat);
      outerEar.position.set(0, 0.15, 0);
      outerEar.scale.set(0.82, 1.0, 0.55);
      outerEar.castShadow = true;
      earPivot.add(outerEar);

      const innerEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.18, 10, 14), innerEarMat);
      innerEar.position.set(0, 0.14, 0.042);
      innerEar.scale.set(0.78, 1.0, 0.35);
      earPivot.add(innerEar);

      return earPivot;
    };

    const leftEar = createEar(-1);
    const rightEar = createEar(1);
    headGroup.add(leftEar, rightEar);

    // --- 3C. FOREGROUND COUNTER: WOOD & STONE COUNTER, GLASS PASTRY DISPLAY, BRANDED COFFEE BAGS ---
    const counterGroup = new THREE.Group();
    counterGroup.position.set(0, -0.56, 0.62);
    shopGroup.add(counterGroup);

    // Smooth Stone/Concrete Countertop Slab
    const counterTopShape = createRoundedRectShape(4.28, 0.82, 0.1);
    const counterTopGeo = new THREE.ExtrudeGeometry(counterTopShape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    counterTopGeo.center();
    const counterTop = new THREE.Mesh(counterTopGeo, stoneCounterTopMat);
    counterTop.rotation.x = Math.PI / 2;
    counterTop.position.set(0, 0.06, 0);
    counterTop.receiveShadow = true;
    counterTop.castShadow = true;
    counterGroup.add(counterTop);

    // Horizontal Wood Plank Front Panel
    const woodPlankTex = createBakedWoodPlankTexture();
    const counterFront = new THREE.Mesh(
      new THREE.BoxGeometry(4.18, 0.36, 0.68),
      new THREE.MeshStandardMaterial({ map: woodPlankTex, roughness: 0.68 })
    );
    counterFront.position.set(0, -0.17, -0.02);
    counterFront.receiveShadow = true;
    counterFront.castShadow = true;
    counterGroup.add(counterFront);

    // 1. LEFT COUNTER FOREGROUND: Glass Pastry Display Case with Croissants, Muffins & Bread Loaves
    const pastryCaseGroup = new THREE.Group();
    pastryCaseGroup.position.set(-1.18, 0.12, 0.04);
    counterGroup.add(pastryCaseGroup);

    // Wooden pastry trays inside & on top of the display
    const bottomTray = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.045, 0.52), woodShelfMat);
    bottomTray.position.set(0, 0.02, 0);
    pastryCaseGroup.add(bottomTray);

    const topTray = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 0.38), woodShelfMat);
    topTray.position.set(-0.08, 0.56, -0.02);
    pastryCaseGroup.add(topTray);

    // Scored Artisan Bread Loaves on top & inside
    [-0.32, 0.14].forEach((bx) => {
      const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 14), breadCrustMat);
      loaf.scale.set(1.35, 0.72, 0.9);
      loaf.position.set(bx, 0.66, -0.02);
      loaf.castShadow = true;
      pastryCaseGroup.add(loaf);
    });

    // Golden Muffins & Croissants inside the glass case
    [-0.45, -0.18, 0.08].forEach((mx) => {
      const muffinCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.065, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 })
      );
      muffinCup.position.set(mx, 0.08, 0.06);
      pastryCaseGroup.add(muffinCup);

      const muffinTop = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), pastryGoldMat);
      muffinTop.scale.set(1.1, 0.75, 1.1);
      muffinTop.position.set(mx, 0.13, 0.06);
      pastryCaseGroup.add(muffinTop);
    });

    // Flaky Crescent Croissants on front-right wood tray
    [0.34, 0.56].forEach((cx, ci) => {
      const croissant = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.042, 10, 16, Math.PI * 1.15),
        pastryGoldMat
      );
      croissant.rotation.x = Math.PI / 2 - 0.2;
      croissant.rotation.z = ci * 0.4;
      croissant.position.set(cx, 0.08, 0.08);
      croissant.castShadow = true;
      pastryCaseGroup.add(croissant);
    });

    // Little dark slate price tags along the front of the pastry trays
    [-0.45, -0.12, 0.38].forEach((tx) => {
      const tag = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.015), frameMat);
      tag.position.set(tx, 0.05, 0.27);
      tag.rotation.x = -0.25;
      pastryCaseGroup.add(tag);
    });

    // Tinted Teal-Glass Pastry Display Panels (Front, Top, Sides)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.15,
      depthWrite: false,
    });
    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.52, 0.018), glassMat);
    glassFront.position.set(0, 0.28, 0.25);
    pastryCaseGroup.add(glassFront);

    const glassTop = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.02, 0.52), glassMat);
    glassTop.position.set(0, 0.54, 0);
    pastryCaseGroup.add(glassTop);

    // Teal glass edge highlight strips (gives that exact tempered glass edge look from the reference image)
    const glassEdgeMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.55,
    });
    const glassTopEdge = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.018, 0.018), glassEdgeMat);
    glassTopEdge.position.set(0, 0.54, 0.25);
    pastryCaseGroup.add(glassTopEdge);

    // 2. RIGHT COUNTER FOREGROUND: Branded Kraft Coffee Bags with Pastel Labels
    const coffeeBagsGroup = new THREE.Group();
    coffeeBagsGroup.position.set(1.28, 0.12, 0.08);
    counterGroup.add(coffeeBagsGroup);

    const bagTray = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.055, 0.46), woodShelfMat);
    bagTray.position.set(0, 0.025, 0);
    coffeeBagsGroup.add(bagTray);

    const kraftBagMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.68,
      metalness: 0.03,
    });
    const pastelLabelColors = [0xf97316, 0xfacc15, 0x38bdf8, 0xf472b6, 0x4ade80];

    pastelLabelColors.forEach((lColor, bi) => {
      const bx = -0.5 + bi * 0.25;
      const bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.14), kraftBagMat);
      bagMesh.position.set(bx, 0.2, 0);
      bagMesh.rotation.y = -0.08;
      bagMesh.castShadow = true;
      coffeeBagsGroup.add(bagMesh);

      // Folded top crease of coffee bag
      const bagCrease = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.06), kraftBagMat);
      bagCrease.position.set(bx, 0.38, 0);
      bagCrease.rotation.y = -0.08;
      coffeeBagsGroup.add(bagCrease);

      // Colorful pastel rectangular label on front of bag
      const labelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 0.15),
        new THREE.MeshBasicMaterial({ color: lColor })
      );
      labelPlane.position.set(bx, 0.17, 0.073);
      labelPlane.rotation.y = -0.08;
      coffeeBagsGroup.add(labelPlane);

      // Little dark slate price tag on the wood tray lip
      const priceTag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.015), frameMat);
      priceTag.position.set(bx, 0.045, 0.24);
      priceTag.rotation.x = -0.2;
      coffeeBagsGroup.add(priceTag);
    });

    // --- 3D. ALPACA ARMS ON THE COUNTER & MERCHANT SMARTPHONE RIG ---
    // Left fluffy arm resting on the counter with dark cloven hoof tip
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.18, 0.19, 0.12);
    counterGroup.add(leftArmGroup);

    const leftPaw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), woolMat);
    leftPaw.scale.set(1.0, 0.78, 1.3);
    leftPaw.castShadow = true;
    leftArmGroup.add(leftPaw);

    const leftHoof = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), darkBrownMat);
    leftHoof.scale.set(1.1, 0.65, 0.9);
    leftHoof.position.set(0, -0.04, 0.16);
    leftArmGroup.add(leftHoof);

    // Right Arm & Smartphone Rig (Rests on counter when idle; lifts Smartphone to scan when triggered!)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.42, 0.19, 0.12);
    counterGroup.add(rightArmPivot);

    const rightPaw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), woolMat);
    rightPaw.scale.set(1.0, 0.82, 1.3);
    rightPaw.castShadow = true;
    rightArmPivot.add(rightPaw);

    const rightHoof = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), darkBrownMat);
    rightHoof.scale.set(1.1, 0.65, 0.9);
    rightHoof.position.set(0, -0.04, 0.16);
    rightArmPivot.add(rightHoof);

    // 3D Smartphone held by the alpaca's right paw
    // Back of the phone (+Z side) has the rear camera island facing forward/down toward the card;
    // Front screen (-Z side) faces back toward the barista alpaca!
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.06, 0.14, 0.16);
    phoneGroup.rotation.set(0.18, -0.22, 0.1);
    rightArmPivot.add(phoneGroup);

    const phoneBodyGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.38, 0.68, 0.06), {
      depth: 0.042,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    phoneBodyGeo.center();
    const phoneBodyMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.28,
      metalness: 0.75,
    });
    const phoneMesh = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
    phoneMesh.castShadow = true;
    phoneGroup.add(phoneMesh);

    const phoneBackCanvas = document.createElement('canvas');
    phoneBackCanvas.width = 128;
    phoneBackCanvas.height = 256;
    const pbCtx = phoneBackCanvas.getContext('2d')!;
    const drawPhoneBack = (activeScan: boolean) => {
      pbCtx.fillStyle = '#1c1917';
      roundRect2D(pbCtx, 0, 0, 128, 256, 20);
      pbCtx.fill();

      pbCtx.strokeStyle = '#57534e';
      pbCtx.lineWidth = 4;
      roundRect2D(pbCtx, 2, 2, 124, 252, 18);
      pbCtx.stroke();

      // Glossy Camera Island
      pbCtx.fillStyle = '#0c0a09';
      roundRect2D(pbCtx, 14, 14, 58, 82, 14);
      pbCtx.fill();
      pbCtx.strokeStyle = activeScan ? '#10b981' : '#44403c';
      pbCtx.lineWidth = 3;
      roundRect2D(pbCtx, 14, 14, 58, 82, 14);
      pbCtx.stroke();

      // Dual Camera Lens Rings
      pbCtx.fillStyle = '#1f2937';
      pbCtx.beginPath();
      pbCtx.arc(34, 36, 13, 0, Math.PI * 2);
      pbCtx.fill();
      pbCtx.strokeStyle = '#9ca3af';
      pbCtx.lineWidth = 2.5;
      pbCtx.stroke();

      pbCtx.beginPath();
      pbCtx.arc(34, 72, 13, 0, Math.PI * 2);
      pbCtx.fill();
      pbCtx.stroke();

      // Flash / Scanner Laser LED
      pbCtx.fillStyle = activeScan ? '#34d399' : '#fde68a';
      pbCtx.beginPath();
      pbCtx.arc(58, 54, 6, 0, Math.PI * 2);
      pbCtx.fill();

      // Gold Star Emblem on back of phone
      pbCtx.fillStyle = '#f59e0b';
      pbCtx.beginPath();
      pbCtx.arc(64, 148, 16, 0, Math.PI * 2);
      pbCtx.fill();
      pbCtx.fillStyle = '#78350f';
      pbCtx.font = 'bold 16px sans-serif';
      pbCtx.textAlign = 'center';
      pbCtx.textBaseline = 'middle';
      pbCtx.fillText('★', 64, 149);
    };
    drawPhoneBack(false);
    const phoneBackTex = new THREE.CanvasTexture(phoneBackCanvas);
    phoneBackTex.colorSpace = THREE.SRGBColorSpace;
    const phoneBackMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.64),
      new THREE.MeshStandardMaterial({
        map: phoneBackTex,
        roughness: 0.35,
        metalness: 0.4,
      })
    );
    phoneBackMesh.position.set(0, 0, 0.034);
    phoneGroup.add(phoneBackMesh);

    // 3D Raised Rear Camera Lens on +Z face (points straight down at the card during scan!)
    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.025, 20),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.75,
      })
    );
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(-0.075, 0.17, 0.042);
    phoneGroup.add(cameraLens);

    // Volumetric Laser Scanner Beam (Tip at 0,0,0; Base at z = +1.0 so lookAt() aims it straight down at the card!)
    const laserBeamGroup = new THREE.Group();
    scene.add(laserBeamGroup);
    laserBeamGroup.visible = false;

    const beamConeGeo = new THREE.ConeGeometry(1.65, 1.0, 32, 1, true);
    beamConeGeo.translate(0, -0.5, 0);
    beamConeGeo.rotateX(-Math.PI / 2);

    const beamConeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beamConeMesh = new THREE.Mesh(beamConeGeo, beamConeMat);
    laserBeamGroup.add(beamConeMesh);

    const laserLineGeo = new THREE.BoxGeometry(3.35, 0.055, 0.14);
    const laserLineMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.94,
    });
    const laserLineMesh = new THREE.Mesh(laserLineGeo, laserLineMat);
    scene.add(laserLineMesh);
    laserLineMesh.visible = false;

    // ============================================================================
    // 4. BOTTOM HALF: THE "HIDDEN 3D" LOYALTY CARD
    //    Looks like a normal flat 2D card when idle at rotation (0,0,0),
    //    then tilts in 3D space with real depth, beveled layers & popping 3D stamps!
    // ============================================================================
    const cardPivot = new THREE.Group();
    cardPivot.position.set(0, -1.36, 0);
    scene.add(cardPivot);

    const cardWidth = 3.82;
    const cardHeight = 3.84;
    const cardDepth = 0.16;

    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 1024;
    frontCanvas.height = 1056;
    const fCtx = frontCanvas.getContext('2d')!;
    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.anisotropy = 4;

    const drawFrontCardTexture = () => {
      const p = propsRef.current;
      const curStamps = animRef.current.displayedStampsOnCard;
      const isReady = curStamps >= p.maxStamps;
      const W = frontCanvas.width;
      const H = frontCanvas.height;

      fCtx.clearRect(0, 0, W, H);

      fCtx.fillStyle = '#FFFFFF';
      roundRect2D(fCtx, 0, 0, W, H, 56);
      fCtx.fill();

      fCtx.strokeStyle = '#E7E5E4';
      fCtx.lineWidth = 8;
      roundRect2D(fCtx, 4, 4, W - 8, H - 8, 54);
      fCtx.stroke();

      const pad = 54;
      const headerY = 52;
      const headerH = 248;
      fCtx.fillStyle = '#3D2B1F';
      roundRect2D(fCtx, pad, headerY, W - pad * 2, headerH, 36);
      fCtx.fill();

      fCtx.fillStyle = '#D6D3D1';
      fCtx.font = '600 24px system-ui, -apple-system, sans-serif';
      fCtx.textAlign = 'center';
      fCtx.fillText(p.storeName.toUpperCase(), W / 2, headerY + 68);

      fCtx.fillStyle = '#FFFFFF';
      fCtx.font = '800 50px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.cardTitle, W / 2, headerY + 138);

      fCtx.fillStyle = '#E7E5E4';
      fCtx.font = '500 28px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.cardSubtitle, W / 2, headerY + 194);

      const progY = 368;
      fCtx.textAlign = 'left';
      fCtx.fillStyle = '#57534E';
      fCtx.font = '600 30px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.progressLabel, pad + 4, progY);

      fCtx.textAlign = 'right';
      fCtx.fillStyle = '#5C4028';
      fCtx.font = '800 32px system-ui, -apple-system, sans-serif';
      fCtx.fillText(`${curStamps} / ${p.maxStamps}`, W - pad - 4, progY);

      const gridTop = 408;
      const cols = 5;
      const gap = 24;
      const totalGridW = W - pad * 2;
      const cellS = (totalGridW - gap * (cols - 1)) / cols;

      for (let i = 0; i < p.maxStamps; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = pad + col * (cellS + gap);
        const cy = gridTop + row * (cellS + gap);
        const isLast = i === p.maxStamps - 1;

        fCtx.fillStyle = isLast ? '#FFFBEB' : '#FAFAF9';
        roundRect2D(fCtx, cx, cy, cellS, cellS, 30);
        fCtx.fill();

        fCtx.strokeStyle = isLast ? '#D97706' : '#E7E5E4';
        fCtx.lineWidth = 4;
        if (isLast) fCtx.setLineDash([10, 8]);
        roundRect2D(fCtx, cx, cy, cellS, cellS, 30);
        fCtx.stroke();
        fCtx.setLineDash([]);
      }

      const statusY = 816;
      const statusH = 178;
      fCtx.fillStyle = isReady ? '#ECFDF5' : '#FAFAF9';
      roundRect2D(fCtx, pad, statusY, W - pad * 2, statusH, 32);
      fCtx.fill();

      fCtx.strokeStyle = isReady ? '#A7F3D0' : '#E7E5E4';
      fCtx.lineWidth = 4;
      roundRect2D(fCtx, pad, statusY, W - pad * 2, statusH, 32);
      fCtx.stroke();

      fCtx.textAlign = 'center';
      if (isReady) {
        fCtx.fillStyle = '#065F46';
        fCtx.font = '800 30px system-ui, -apple-system, sans-serif';
        fCtx.fillText(`✓ ${p.rewardReadyText.toUpperCase()}`, W / 2, statusY + 72);

        fCtx.fillStyle = '#57534E';
        fCtx.font = '500 24px system-ui, -apple-system, sans-serif';
        fCtx.fillText(p.rewardDescText, W / 2, statusY + 122, W - pad * 2 - 40);
      } else {
        fCtx.fillStyle = '#57534E';
        fCtx.font = '600 28px system-ui, -apple-system, sans-serif';
        const rem = p.maxStamps - curStamps;
        fCtx.fillText(`${rem} ${p.remainingStampsText}`, W / 2, statusY + 102, W - pad * 2 - 36);
      }

      frontTexture.needsUpdate = true;
    };

    const backCanvas = document.createElement('canvas');
    backCanvas.width = 512;
    backCanvas.height = 528;
    const bCtx = backCanvas.getContext('2d')!;
    bCtx.fillStyle = '#3D2B1F';
    roundRect2D(bCtx, 0, 0, 512, 528, 32);
    bCtx.fill();
    bCtx.strokeStyle = '#F59E0B';
    bCtx.lineWidth = 10;
    roundRect2D(bCtx, 22, 22, 468, 484, 24);
    bCtx.stroke();
    bCtx.fillStyle = '#F59E0B';
    bCtx.font = '800 40px system-ui, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('ALPACARD', 256, 220);
    bCtx.fillStyle = '#FDE68A';
    bCtx.font = '600 22px system-ui, sans-serif';
    bCtx.fillText('CRYPTOGRAPHIC QR PASS', 256, 265);
    bCtx.fillStyle = '#FFFFFF';
    roundRect2D(bCtx, 196, 300, 120, 120, 16);
    bCtx.fill();
    bCtx.fillStyle = '#1C1917';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 4 && c === 4)) {
          bCtx.fillRect(212 + c * 18, 316 + r * 18, 14, 14);
        }
      }
    }
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.colorSpace = THREE.SRGBColorSpace;

    const cardShape = createRoundedRectShape(cardWidth, cardHeight, 0.22);
    const cardSlabGeo = new THREE.ExtrudeGeometry(cardShape, {
      depth: cardDepth,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 4,
    });
    cardSlabGeo.center();

    const cardEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.32,
      metalness: 0.45,
    });
    const cardSlabMesh = new THREE.Mesh(cardSlabGeo, cardEdgeMat);
    cardSlabMesh.castShadow = true;
    cardSlabMesh.receiveShadow = true;
    cardPivot.add(cardSlabMesh);

    const frontFacePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshStandardMaterial({
        map: frontTexture,
        roughness: 0.38,
        metalness: 0.04,
        transparent: true,
      })
    );
    frontFacePlane.position.set(0, 0, cardDepth / 2 + 0.037);
    cardPivot.add(frontFacePlane);

    const backFacePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshStandardMaterial({
        map: backTexture,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
      })
    );
    backFacePlane.rotation.y = Math.PI;
    backFacePlane.position.set(0, 0, -(cardDepth / 2 + 0.037));
    cardPivot.add(backFacePlane);

    // 10 Physical 3D Stamp Tiles on the Card Face
    const createStampTileTexture = (label: string, isStamped: boolean, isLast: boolean) => {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 160;
      const ctx = c.getContext('2d')!;

      if (isStamped) {
        ctx.fillStyle = '#4A3525';
        roundRect2D(ctx, 0, 0, 160, 160, 32);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(46, 84);
        ctx.lineTo(70, 108);
        ctx.lineTo(116, 56);
        ctx.stroke();
      } else if (isLast) {
        ctx.fillStyle = '#FFFBEB';
        roundRect2D(ctx, 0, 0, 160, 160, 32);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 6;
        ctx.setLineDash([12, 10]);
        roundRect2D(ctx, 6, 6, 148, 148, 28);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 8;
        ctx.strokeRect(48, 74, 64, 48);
        ctx.strokeRect(42, 56, 76, 18);
        ctx.beginPath();
        ctx.moveTo(80, 56);
        ctx.lineTo(80, 122);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FAFAF9';
        roundRect2D(ctx, 0, 0, 160, 160, 32);
        ctx.fill();
        ctx.strokeStyle = '#E7E5E4';
        ctx.lineWidth = 6;
        roundRect2D(ctx, 4, 4, 152, 152, 28);
        ctx.stroke();

        ctx.fillStyle = '#A8A29E';
        ctx.font = '700 52px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 80, 84);
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const stampTileSize = 0.58;
    const stampTileGeo = new THREE.ExtrudeGeometry(
      createRoundedRectShape(stampTileSize, stampTileSize, 0.11),
      {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.015,
        bevelSegments: 3,
      }
    );
    stampTileGeo.center();

    interface StampTileObj {
      group: THREE.Group;
      bodyMesh: THREE.Mesh;
      capMesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      stampedTex: THREE.CanvasTexture;
      unstampedTex: THREE.CanvasTexture;
    }

    const stampTiles: StampTileObj[] = [];
    const stampedSideMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.4,
      metalness: 0.25,
    });
    const unstampedSideMat = new THREE.MeshStandardMaterial({
      color: 0xe7e5e4,
      roughness: 0.6,
      metalness: 0.05,
    });

    const padUV = 54 / 1024;
    const gridTopUV = 408 / 1056;
    const gapUV = 24 / 1024;
    const cellSUV = (1 - padUV * 2 - gapUV * 4) / 5;

    for (let i = 0; i < maxStamps; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const uCenter = padUV + col * (cellSUV + gapUV) + cellSUV / 2;
      const vCenter =
        gridTopUV +
        row * ((cellSUV * 1024) / 1056 + (gapUV * 1024) / 1056) +
        (cellSUV * 1024) / 1056 / 2;

      const xPos = (uCenter - 0.5) * cardWidth;
      const yPos = (0.5 - vCenter) * cardHeight;

      const tileGroup = new THREE.Group();
      tileGroup.position.set(xPos, yPos, cardDepth / 2 + 0.02);
      cardPivot.add(tileGroup);

      const bodyMesh = new THREE.Mesh(stampTileGeo, stampedSideMat);
      tileGroup.add(bodyMesh);

      const stampedTex = createStampTileTexture(String(i + 1), true, i === maxStamps - 1);
      const unstampedTex = createStampTileTexture(String(i + 1), false, i === maxStamps - 1);

      const capMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(stampTileSize, stampTileSize),
        new THREE.MeshStandardMaterial({
          map: i < stamps ? stampedTex : unstampedTex,
          roughness: 0.35,
          transparent: true,
        })
      );
      capMesh.position.set(0, 0, 0.059);
      tileGroup.add(capMesh);

      stampTiles.push({
        group: tileGroup,
        bodyMesh,
        capMesh,
        baseX: xPos,
        baseY: yPos,
        stampedTex,
        unstampedTex,
      });
    }

    // Floating 3D Holographic QR Ring during scan
    const holoQrGroup = new THREE.Group();
    holoQrGroup.position.set(0, 0.85, cardDepth / 2 + 0.25);
    holoQrGroup.visible = false;
    cardPivot.add(holoQrGroup);

    const holoRing = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.38, 32),
      new THREE.MeshBasicMaterial({
        color: 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    holoQrGroup.add(holoRing);

    // 3D Burst Particles when a stamp punches into the card
    const particleCount = 18;
    const particles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
    const particleGeo = new THREE.OctahedronGeometry(0.055, 0);
    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf59e0b : 0x10b981,
        transparent: true,
        opacity: 0,
      });
      const pMesh = new THREE.Mesh(particleGeo, pMat);
      pMesh.visible = false;
      cardPivot.add(pMesh);
      particles.push({ mesh: pMesh, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    const triggerParticleBurst = (originX: number, originY: number) => {
      particles.forEach((p, idx) => {
        const angle = (idx / particleCount) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1.2 + Math.random() * 1.6;
        p.mesh.position.set(originX, originY, cardDepth / 2 + 0.16);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.vz = 1.4 + Math.random() * 1.5;
        p.life = 1.0;
        p.mesh.visible = true;
      });
    };

    drawFrontCardTexture();
    setIsHydrated(true);

    // ============================================================================
    // 5. CAMERA PARALLAX (Desktop PointerMove + Mobile Gyroscope) & LIFECYCLE
    // ============================================================================
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = THREE.MathUtils.clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      const ny = THREE.MathUtils.clamp(-((e.clientY - rect.top) / rect.height) * 2 + 1, -1, 1);
      animRef.current.userPointerX = nx;
      animRef.current.userPointerY = ny;
      animRef.current.isPointerHoveringCard =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom &&
        ny < 0.2;
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        animRef.current.gyroX = THREE.MathUtils.clamp(e.gamma / 35, -1, 1);
        animRef.current.gyroY = THREE.MathUtils.clamp((e.beta - 45) / 35, -1, 1);
      }
    };

    const handleVisibilityChange = () => {
      animRef.current.isTabActive = !document.hidden;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // IntersectionObserver to pause rendering when scrolled out of view (Crucial for PWA battery/CPU)
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries[0]) {
                animRef.current.isVisibleInViewport = entries[0].isIntersecting;
              }
            },
            { threshold: 0.05 }
          )
        : null;
    io?.observe(container);

    // ============================================================================
    // 6. MAIN 60FPS ANIMATION LOOP
    // ============================================================================
    let reqId = 0;
    let prevTime = performance.now() / 1000;
    let stampBurstTriggeredForCurrentScan = false;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const a = animRef.current;

      // Lifecycle optimization: skip GPU draw when tab is hidden or hero scrolled out of view
      if (!a.isTabActive || !a.isVisibleInViewport) {
        prevTime = performance.now() / 1000;
        return;
      }

      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - prevTime);
      prevTime = now;

      if (a.needTextureUpdate) {
        drawFrontCardTexture();
        a.needTextureUpdate = false;
      }

      // Combined parallax input from mouse pointer + mobile gyroscope
      const parallaxX = THREE.MathUtils.clamp(a.userPointerX + a.gyroX * 0.65, -1, 1);
      const parallaxY = THREE.MathUtils.clamp(a.userPointerY + a.gyroY * 0.65, -1, 1);

      // Subtle Customer-POV Camera Parallax & Shop Depth Shift
      shopGroup.rotation.y += (parallaxX * 0.085 - shopGroup.rotation.y) * 0.08;
      shopGroup.rotation.x += (-parallaxY * 0.045 - shopGroup.rotation.x) * 0.08;
      bgGroup.position.x += (-parallaxX * 0.09 - bgGroup.position.x) * 0.08;

      // --- 6A. IDLE ALPACA & COFFEE SHOP AMBIENT ANIMATIONS ---
      // Alpaca gentle breathing loop
      bodyGroup.position.y = Math.sin(now * 2.3) * 0.024;
      const targetHeadRotY = a.isScanning
        ? Math.sin((now - a.scanStartTime) * 6) * 0.08
        : parallaxX * 0.22 + Math.sin(now * 1.1) * 0.05;
      const targetHeadRotX = a.isScanning ? 0.28 : -parallaxY * 0.1 + Math.sin(now * 1.6) * 0.03;

      headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * 0.12;
      headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.12;

      // Occasional eye blink
      const blinkCycle = now % 3.9;
      const isBlinking = blinkCycle > 3.74;
      const targetEyeScaleY = isBlinking ? 0.08 : 1.0;
      leftEye.scale.y += (targetEyeScaleY - leftEye.scale.y) * 0.35;
      rightEye.scale.y += (targetEyeScaleY - rightEye.scale.y) * 0.35;

      // Slight ear twitches
      leftEar.rotation.z = 0.2 + Math.sin(now * 3.1) * 0.045;
      rightEar.rotation.z = -0.2 - Math.cos(now * 2.7) * 0.045;

      // Gentle swaying of hanging pendant lamps & window vines
      leftLamp.rotation.z = Math.sin(now * 1.4) * 0.045;
      centerLamp.rotation.z = Math.cos(now * 1.25) * 0.04;
      hangingVinesGroup.rotation.z = Math.sin(now * 1.8) * 0.025;
      shelfPlantGroup.rotation.z = Math.cos(now * 1.6) * 0.035;

      // Rising steam particles from the espresso machine
      steamPuffs.forEach((puff, idx) => {
        const phase = (now * 0.5 + idx * 0.25) % 1;
        puff.position.y = 0.52 + phase * 0.42;
        puff.position.x = -0.18 + Math.sin(now * 2.4 + idx) * 0.04;
        const s = 0.55 + Math.sin(phase * Math.PI) * 0.65;
        puff.scale.setScalar(s);
        (puff.material as THREE.MeshBasicMaterial).opacity = Math.sin(phase * Math.PI) * 0.38;
      });

      // --- 6B. SCANNING SEQUENCE: BARISTA LIFTS PHONE + CARD BREAKS INTO 3D ---
      let targetCardRotX = 0;
      let targetCardRotY = 0;
      let targetCardRotZ = 0;
      let targetCardPosZ = 0;
      let targetCardPosY = -1.36;

      let targetArmPosY = 0.19;
      let targetArmPosZ = 0.12;
      let targetArmRotX = 0;
      let targetPhoneRotX = 0.18;
      let targetPhoneRotY = -0.22;

      if (a.isScanning) {
        const elapsed = now - a.scanStartTime;
        const progress = elapsed / a.scanDuration;

        if (progress <= 0.15) {
          stampBurstTriggeredForCurrentScan = false;
        }

        if (progress < 1.0) {
          const holdEnv =
            progress < 0.22
              ? THREE.MathUtils.smoothstep(progress, 0, 0.22)
              : progress < 0.76
              ? 1.0
              : 1.0 - THREE.MathUtils.smoothstep(progress, 0.76, 1.0);

          // 1) Barista Alpaca raises the Merchant Smartphone over the counter & aims its rear camera down at the card
          targetArmPosY = 0.19 + holdEnv * 0.42;
          targetArmPosZ = 0.12 + holdEnv * 0.48;
          targetArmRotX = holdEnv * 0.42;
          targetPhoneRotX = 0.18 + holdEnv * 0.58;
          targetPhoneRotY = -0.22 + holdEnv * 0.16;

          // 2) The Card reveals it is a 3D object! Tilts back in 3D perspective & lifts toward camera
          targetCardRotX = -0.54 * holdEnv;
          targetCardRotY = 0.32 * Math.cos(progress * Math.PI * 1.4) * holdEnv;
          targetCardRotZ = -0.06 * holdEnv;
          targetCardPosZ = 0.82 * holdEnv;
          targetCardPosY = -1.36 + 0.16 * holdEnv;

          if (a.isRewardCelebration && progress > 0.38) {
            const flipProg = THREE.MathUtils.smoothstep(progress, 0.38, 0.92);
            targetCardRotY += flipProg * Math.PI * 2;
            alpacaRoot.position.y = -0.24 + Math.abs(Math.sin(flipProg * Math.PI * 3)) * 0.16;
          }

          // 3) Laser Beam & Sweep Line between progress = 0.16 and 0.68
          if (progress >= 0.16 && progress <= 0.68) {
            const scanSweep = (progress - 0.16) / 0.52;
            laserBeamGroup.visible = true;
            laserLineMesh.visible = true;
            holoQrGroup.visible = true;
            holoQrGroup.rotation.z = now * 4;

            const phoneWorldPos = new THREE.Vector3();
            cameraLens.getWorldPosition(phoneWorldPos);
            laserBeamGroup.position.copy(phoneWorldPos);

            const sweepY = -0.52 - Math.sin(scanSweep * Math.PI) * 1.75;
            laserLineMesh.position.set(0, sweepY, cardPivot.position.z + 0.42);
            laserLineMesh.rotation.copy(cardPivot.rotation);

            // Point laser cone (+Z) straight from the rear camera lens down to the laser line on the card
            laserBeamGroup.lookAt(laserLineMesh.position);
            const distToCard = Math.max(0.5, phoneWorldPos.distanceTo(laserLineMesh.position));
            laserBeamGroup.scale.set(1, 1, distToCard);

            scanPointLight.intensity = 3.5;
            scanPointLight.position.set(0, sweepY, 1.8);
          } else {
            laserBeamGroup.visible = false;
            laserLineMesh.visible = false;
            holoQrGroup.visible = false;
            scanPointLight.intensity = 0;
          }

          // 4) At progress >= 0.34, the laser locks onto the target stamp slot & PUNCHES it in 3D!
          if (progress >= 0.34 && !stampBurstTriggeredForCurrentScan) {
            stampBurstTriggeredForCurrentScan = true;
            a.displayedStampsOnCard = propsRef.current.stamps;
            a.needTextureUpdate = true;
            drawPhoneBack(true);
            phoneBackTex.needsUpdate = true;
            playScannerBeep(a.isRewardCelebration);

            const targetTile = stampTiles[a.targetSlotIndex];
            if (targetTile) {
              triggerParticleBurst(targetTile.baseX, targetTile.baseY);
            }
          }

          // Card physical recoil bounce right when the stamp slams in
          if (progress >= 0.34 && progress <= 0.56) {
            const impactPhase = (progress - 0.34) / 0.22;
            const recoil = Math.sin(impactPhase * Math.PI) * 0.24;
            targetCardPosZ -= recoil;
            targetCardRotX -= recoil * 0.35;
          }
        } else {
          a.isScanning = false;
          laserBeamGroup.visible = false;
          laserLineMesh.visible = false;
          holoQrGroup.visible = false;
          scanPointLight.intensity = 0;
          alpacaRoot.position.y = -0.24;
          drawPhoneBack(false);
          phoneBackTex.needsUpdate = true;
        }
      } else if (a.isResetFlip) {
        const elapsed = now - a.resetStartTime;
        const dur = 0.75;
        if (elapsed < dur) {
          const p = elapsed / dur;
          const ease = THREE.MathUtils.smoothstep(p, 0, 1);
          targetCardRotY = ease * Math.PI * 2;
          targetCardRotX = -Math.sin(p * Math.PI) * 0.35;
          targetCardPosZ = Math.sin(p * Math.PI) * 0.65;
        } else {
          a.isResetFlip = false;
        }
      } else if (a.isPointerHoveringCard && a.hasRevealed3D) {
        targetCardRotY = parallaxX * 0.22;
        targetCardRotX = parallaxY * 0.18;
        targetCardPosZ = 0.22;
      }

      // Smooth spring interpolation
      rightArmPivot.position.y += (targetArmPosY - rightArmPivot.position.y) * 0.16;
      rightArmPivot.position.z += (targetArmPosZ - rightArmPivot.position.z) * 0.16;
      rightArmPivot.rotation.x += (targetArmRotX - rightArmPivot.rotation.x) * 0.16;
      phoneGroup.rotation.x += (targetPhoneRotX - phoneGroup.rotation.x) * 0.16;
      phoneGroup.rotation.y += (targetPhoneRotY - phoneGroup.rotation.y) * 0.16;

      cardPivot.rotation.x += (targetCardRotX - cardPivot.rotation.x) * 0.16;
      cardPivot.rotation.y += (targetCardRotY - cardPivot.rotation.y) * 0.16;
      cardPivot.rotation.z += (targetCardRotZ - cardPivot.rotation.z) * 0.16;
      cardPivot.position.z += (targetCardPosZ - cardPivot.position.z) * 0.16;
      cardPivot.position.y += (targetCardPosY - cardPivot.position.y) * 0.16;

      // --- 6C. UPDATE THE 10 3D STAMP TILES ---
      const curStamps = a.displayedStampsOnCard;
      stampTiles.forEach((tile, idx) => {
        const isStamped = idx < curStamps;
        tile.bodyMesh.material = isStamped ? stampedSideMat : unstampedSideMat;
        const capMat = tile.capMesh.material as THREE.MeshStandardMaterial;
        const desiredMap = isStamped ? tile.stampedTex : tile.unstampedTex;
        if (capMat.map !== desiredMap) {
          capMat.map = desiredMap;
          capMat.needsUpdate = true;
        }

        const cardTiltAmount =
          Math.abs(cardPivot.rotation.x) +
          Math.abs(cardPivot.rotation.y) +
          cardPivot.position.z * 0.3;
        const baseZ =
          cardDepth / 2 + 0.02 + (isStamped ? Math.min(0.08, cardTiltAmount * 0.12) : 0);

        if (a.isScanning && idx === a.targetSlotIndex) {
          const elapsed = now - a.scanStartTime;
          const progress = elapsed / a.scanDuration;
          if (progress >= 0.32 && progress <= 0.72) {
            const punchP = (progress - 0.32) / 0.4;
            const popHeight = Math.sin(punchP * Math.PI) * 0.65;
            tile.group.position.z = baseZ + popHeight;
            tile.group.rotation.y = punchP * Math.PI * 2;
            const scaleBoost = 1 + Math.sin(punchP * Math.PI) * 0.32;
            tile.group.scale.setScalar(scaleBoost);
            return;
          }
        }

        tile.group.position.z += (baseZ - tile.group.position.z) * 0.2;
        tile.group.rotation.y += (0 - tile.group.rotation.y) * 0.2;
        tile.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
      });

      // --- 6D. UPDATE 3D BURST PARTICLES ---
      particles.forEach((p) => {
        if (p.life > 0) {
          p.life -= dt * 1.65;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vz -= 4.5 * dt;
          p.mesh.rotation.x += 6 * dt;
          p.mesh.rotation.y += 6 * dt;
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
          if (p.life <= 0) {
            p.mesh.visible = false;
          }
        }
      });

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const { w: newW, h: newH } = getContainerSize();
      updateCameraDistance(newW, newH);
      renderer.setSize(newW, newH, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = `${newH}px`;
    };
    window.addEventListener('resize', handleResize);
    const resizeObs =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => handleResize()) : null;
    resizeObs?.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObs?.disconnect();
      io?.disconnect();
      renderer.dispose();
    };
  }, [maxStamps]);

  return (
    <div className="relative w-full max-w-full overflow-hidden select-none rounded-xl">
      {/* Static Blur Placeholder while 3D Canvas Hydrates */}
      {!isHydrated && (
        <img
          src="/alpaca-hero-poster.jpg"
          alt="Alpacard Specialty Coffee Shop"
          className="absolute inset-0 h-full w-full object-cover blur-sm opacity-60 transition-opacity duration-500 pointer-events-none"
        />
      )}
      <div
        ref={mountRef}
        className="w-full max-w-full overflow-hidden flex items-center justify-center"
      />
    </div>
  );
}

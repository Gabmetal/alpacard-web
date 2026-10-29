import { useEffect, useRef } from 'react';
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
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
 * Helper to create a 5-pointed star THREE.Shape centered at (0, 0)
 */
function createStarShape(outerRadius: number, innerRadius: number, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step + Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();
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

  // Animation state shared with the Three.js loop
  const animRef = useRef({
    isScanning: false,
    scanStartTime: 0,
    scanDuration: 1.95, // seconds for the full scan + 3D tilt + stamp punch sequence
    targetSlotIndex: -1,
    isRewardCelebration: false,
    isResetFlip: false,
    resetStartTime: 0,
    userPointerX: 0,
    userPointerY: 0,
    isPointerHoveringCard: false,
    hasRevealed3D: false,
    needTextureUpdate: true,
    displayedStampsOnCard: stamps,
  });

  // Trigger scan animation when scanTrigger increments
  useEffect(() => {
    if (scanTrigger === 0) return;
    const a = animRef.current;
    a.isScanning = true;
    a.scanStartTime = performance.now() / 1000;
    a.targetSlotIndex = Math.max(0, stamps - 1);
    a.isRewardCelebration = stamps >= maxStamps;
    // Keep card face showing previous count until the laser hits at progress = 0.34
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
      const w = Math.max(240, Math.floor(rect.width || container.clientWidth || 320));
      const h = w < 350 ? 470 : 520;
      return { w, h };
    };

    const { w: initW, h: initH } = getContainerSize();

    // 1. SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();

    const fov = 34;
    const camera = new THREE.PerspectiveCamera(fov, initW / initH, 0.1, 100);

    const updateCameraDistance = (w: number, h: number) => {
      const aspect = w / h;
      const halfFovTan = Math.tan((fov * Math.PI) / 360);
      // Ensure 4.45 world units of horizontal width always fit inside the frustum even when card tilts forward
      const requiredZForWidth = 4.45 / (2 * halfFovTan * aspect) + 0.55;
      camera.aspect = aspect;
      camera.position.set(0, -0.05, Math.max(11.8, requiredZForWidth));
      camera.lookAt(0, -0.05, 0);
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
    renderer.toneMappingExposure = 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. LIGHTING (Soft studio clay lighting matching alpacard-logo.jpg)
    const ambientLight = new THREE.AmbientLight(0xfffaf2, 1.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.85);
    keyLight.position.set(4.5, 7.5, 6.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0015;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.75);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    // Dynamic green/amber scanner point light that illuminates the card during scan
    const scanPointLight = new THREE.PointLight(0x10b981, 0, 5.5);
    scanPointLight.position.set(0, 0.2, 1.5);
    scene.add(scanPointLight);

    // ============================================================================
    // 3. TOP DIORAMA: BARISTA ALPACA MANNING THE COFFEE BAR
    // ============================================================================
    const dioramaGroup = new THREE.Group();
    dioramaGroup.position.set(0, 1.72, -0.25);
    scene.add(dioramaGroup);

    // Shared Materials (Matte soft clay aesthetic like alpacard-logo.jpg)
    const woolMat = new THREE.MeshStandardMaterial({
      color: 0xfbf7f0,
      roughness: 0.72,
      metalness: 0.02,
    });
    const faceSkinMat = new THREE.MeshStandardMaterial({
      color: 0xf4dec2,
      roughness: 0.65,
      metalness: 0.02,
    });
    const snoutMat = new THREE.MeshStandardMaterial({
      color: 0xfcefd9,
      roughness: 0.6,
      metalness: 0.02,
    });
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: 0xe3b58c,
      roughness: 0.7,
      metalness: 0.0,
    });
    const darkBrownMat = new THREE.MeshStandardMaterial({
      color: 0x3b2316,
      roughness: 0.4,
      metalness: 0.08,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x24130b,
      roughness: 0.12,
      metalness: 0.15,
    });
    const collarBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2c36b8,
      roughness: 0.35,
      metalness: 0.18,
    });
    const goldStarMat = new THREE.MeshStandardMaterial({
      color: 0xf5a623,
      roughness: 0.25,
      metalness: 0.65,
      emissive: 0x4a2c00,
      emissiveIntensity: 0.15,
    });
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.75,
      metalness: 0.05,
    });
    const counterWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8c5832,
      roughness: 0.55,
      metalness: 0.05,
    });
    const counterBaseMat = new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.7,
      metalness: 0.05,
    });

    // --- 3A. THE ALPACA CHARACTER ---
    const alpacaRoot = new THREE.Group();
    alpacaRoot.position.set(0, -0.15, -0.12);
    alpacaRoot.scale.setScalar(0.92);
    dioramaGroup.add(alpacaRoot);

    // Body / Chest Torso
    const bodyGroup = new THREE.Group();
    alpacaRoot.add(bodyGroup);

    const torsoGeo = new THREE.CapsuleGeometry(0.62, 0.55, 16, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, woolMat);
    torsoMesh.position.set(0, 0.15, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Fluffy chest cloud puffs (like bottom of the logo)
    const chestPuffPositions: [number, number, number, number][] = [
      [0, -0.02, 0.46, 0.26],
      [-0.27, 0.03, 0.41, 0.23],
      [0.27, 0.03, 0.41, 0.23],
      [-0.46, 0.12, 0.26, 0.21],
      [0.46, 0.12, 0.26, 0.21],
    ];
    chestPuffPositions.forEach(([px, py, pz, pr]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 20, 20), woolMat);
      puff.position.set(px, py, pz);
      puff.castShadow = true;
      bodyGroup.add(puff);
    });

    // Barista Apron worn over torso
    const apronFrontGeo = new THREE.CylinderGeometry(0.635, 0.655, 0.65, 24, 1, true, -0.95, 1.9);
    const apronFront = new THREE.Mesh(apronFrontGeo, apronMat);
    apronFront.position.set(0, -0.05, 0.03);
    bodyGroup.add(apronFront);

    // Apron coffee badge on chest
    const apronBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.3 })
    );
    apronBadge.rotation.x = Math.PI / 2;
    apronBadge.position.set(0.22, 0.02, 0.64);
    bodyGroup.add(apronBadge);

    // Iconic Royal Blue Collar (from alpacard-logo.jpg)
    const collarGeo = new THREE.TorusGeometry(0.54, 0.135, 20, 40);
    const collarMesh = new THREE.Mesh(collarGeo, collarBlueMat);
    collarMesh.rotation.x = Math.PI / 2 + 0.12;
    collarMesh.position.set(0, 0.34, 0.04);
    collarMesh.castShadow = true;
    bodyGroup.add(collarMesh);

    // 3D Extruded Gold Star on the Collar
    const starShape = createStarShape(0.24, 0.115, 5);
    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.028,
      bevelSegments: 5,
    });
    starGeo.center();
    const starMesh = new THREE.Mesh(starGeo, goldStarMat);
    starMesh.position.set(0, 0.26, 0.68);
    starMesh.rotation.x = 0.1;
    starMesh.castShadow = true;
    bodyGroup.add(starMesh);

    // --- HEAD GROUP (Animated for nodding, looking at card, blinking) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.88, 0.06);
    bodyGroup.add(headGroup);

    // Base head sphere
    const headCore = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 28), woolMat);
    headCore.scale.set(1.04, 0.98, 0.95);
    headCore.castShadow = true;
    headGroup.add(headCore);

    // Warm beige face inset
    const facePlate = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 28), faceSkinMat);
    facePlate.scale.set(1.02, 0.88, 0.65);
    facePlate.position.set(0, -0.03, 0.27);
    headGroup.add(facePlate);

    // Fluffy Forehead & Cheek Wool Puffs (matching the exact silhouette of alpacard-logo.jpg)
    const headWoolPuffs: [number, number, number, number, number, number, number][] = [
      [0, 0.36, 0.35, 0.27, 1.15, 1.0, 0.95],
      [-0.28, 0.34, 0.28, 0.23, 1.0, 1.0, 0.9],
      [0.28, 0.34, 0.28, 0.23, 1.0, 1.0, 0.9],
      [0, 0.48, 0.08, 0.28, 1.1, 0.95, 1.0],
      [-0.47, 0.06, 0.18, 0.24, 0.95, 1.05, 0.9],
      [0.47, 0.06, 0.18, 0.24, 0.95, 1.05, 0.9],
      [-0.44, -0.18, 0.22, 0.23, 1.0, 0.95, 0.9],
      [0.44, -0.18, 0.22, 0.23, 1.0, 0.95, 0.9],
      [0, -0.36, 0.24, 0.22, 1.35, 0.75, 0.85],
    ];
    headWoolPuffs.forEach(([x, y, z, r, sx, sy, sz]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), woolMat);
      puff.position.set(x, y, z);
      puff.scale.set(sx, sy, sz);
      puff.castShadow = true;
      headGroup.add(puff);
    });

    // Cute Barista Visor Cap on top of the alpaca's head
    const capBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.04, 24, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
      apronMat
    );
    capBrim.position.set(0, 0.56, 0.18);
    capBrim.rotation.x = 0.22;
    headGroup.add(capBrim);

    // Snout / Muzzle
    const snoutMesh = new THREE.Mesh(new THREE.SphereGeometry(0.21, 24, 24), snoutMat);
    snoutMesh.scale.set(1.12, 0.88, 0.85);
    snoutMesh.position.set(0, -0.11, 0.49);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Nose & Smile (Y-shaped alpaca nose + curved smile from logo)
    const noseTop = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), darkBrownMat);
    noseTop.scale.set(1.35, 0.75, 0.7);
    noseTop.position.set(0, -0.05, 0.66);
    headGroup.add(noseTop);

    const philtrum = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.07, 8, 8), darkBrownMat);
    philtrum.position.set(0, -0.1, 0.66);
    headGroup.add(philtrum);

    const smileLeft = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.016, 10, 20, Math.PI * 0.85),
      darkBrownMat
    );
    smileLeft.rotation.z = Math.PI + 0.2;
    smileLeft.position.set(-0.06, -0.13, 0.645);
    headGroup.add(smileLeft);

    const smileRight = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.016, 10, 20, Math.PI * 0.85),
      darkBrownMat
    );
    smileRight.rotation.z = Math.PI - 0.2;
    smileRight.position.set(0.06, -0.13, 0.645);
    headGroup.add(smileRight);

    // Rosy Cheek Blushes
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xf4978e,
      transparent: true,
      opacity: 0.38,
    });
    const leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
    leftBlush.position.set(-0.29, -0.11, 0.54);
    leftBlush.rotation.y = -0.35;
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), blushMat);
    rightBlush.position.set(0.29, -0.11, 0.54);
    rightBlush.rotation.y = 0.35;
    headGroup.add(rightBlush);

    // Glossy Eyes with white specular catchlights
    const eyesGroup = new THREE.Group();
    headGroup.add(eyesGroup);

    const createEye = (xSign: number) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(xSign * 0.22, 0.04, 0.53);

      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.072, 20, 20), eyeMat);
      eyeball.scale.set(1, 1.08, 0.7);
      eyeGroup.add(eyeball);

      const catchlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      catchlight.position.set(xSign * -0.02, 0.028, 0.052);
      eyeGroup.add(catchlight);

      const smallCatch = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      smallCatch.position.set(xSign * 0.022, -0.02, 0.05);
      eyeGroup.add(smallCatch);

      return eyeGroup;
    };

    const leftEye = createEye(-1);
    const rightEye = createEye(1);
    eyesGroup.add(leftEye, rightEye);

    // Sculpted Curved Alpaca Ears
    const createEar = (xSign: number) => {
      const earPivot = new THREE.Group();
      earPivot.position.set(xSign * 0.36, 0.45, 0.05);
      earPivot.rotation.z = xSign * -0.22;

      const outerEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.26, 12, 16), faceSkinMat);
      outerEar.position.set(0, 0.16, 0);
      outerEar.scale.set(0.85, 1.0, 0.55);
      outerEar.castShadow = true;
      earPivot.add(outerEar);

      const innerEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.19, 10, 14), innerEarMat);
      innerEar.position.set(0, 0.15, 0.045);
      innerEar.scale.set(0.8, 1.0, 0.35);
      earPivot.add(innerEar);

      return earPivot;
    };

    const leftEar = createEar(-1);
    const rightEar = createEar(1);
    headGroup.add(leftEar, rightEar);

    // --- 3B. THE COFFEE BAR COUNTER, ESPRESSO MACHINE, AND STEAMING MUG ---
    const barGroup = new THREE.Group();
    barGroup.position.set(0, -0.48, 0.55);
    dioramaGroup.add(barGroup);

    // Wood Countertop Slab
    const counterTopShape = createRoundedRectShape(3.8, 0.68, 0.14);
    const counterTopGeo = new THREE.ExtrudeGeometry(counterTopShape, {
      depth: 0.13,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    counterTopGeo.center();
    const counterTop = new THREE.Mesh(counterTopGeo, counterWoodMat);
    counterTop.rotation.x = Math.PI / 2;
    counterTop.position.set(0, 0.08, 0);
    counterTop.receiveShadow = true;
    counterTop.castShadow = true;
    barGroup.add(counterTop);

    // Dark Roast Counter Front Base
    const counterBase = new THREE.Mesh(new THREE.BoxGeometry(3.64, 0.28, 0.56), counterBaseMat);
    counterBase.position.set(0, -0.12, -0.02);
    counterBase.receiveShadow = true;
    counterBase.castShadow = true;
    barGroup.add(counterBase);

    // Decorative gold trim strip on counter front
    const counterTrim = new THREE.Mesh(
      new THREE.BoxGeometry(3.66, 0.035, 0.58),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.5 })
    );
    counterTrim.position.set(0, -0.02, -0.02);
    barGroup.add(counterTrim);

    // Left of Bar: Mini 3D Espresso Machine
    const espressoGroup = new THREE.Group();
    espressoGroup.position.set(-1.3, 0.15, -0.04);
    espressoGroup.rotation.y = 0.22;
    barGroup.add(espressoGroup);

    const machineBodyMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1,
      roughness: 0.28,
      metalness: 0.65,
    });
    const machineAccentMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.5,
      metalness: 0.2,
    });

    const machineBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.42), machineBodyMat);
    machineBase.position.set(0, 0.29, 0);
    machineBase.castShadow = true;
    espressoGroup.add(machineBase);

    const machineTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.46), machineAccentMat);
    machineTop.position.set(0, 0.61, 0);
    espressoGroup.add(machineTop);

    const gauge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 })
    );
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 0.44, 0.21);
    espressoGroup.add(gauge);

    const groupHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.065, 0.09, 16),
      machineAccentMat
    );
    groupHead.position.set(0, 0.26, 0.21);
    espressoGroup.add(groupHead);

    const portaHandle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.022, 0.16, 8, 8),
      darkBrownMat
    );
    portaHandle.rotation.x = Math.PI / 2;
    portaHandle.rotation.z = -0.35;
    portaHandle.position.set(0.07, 0.24, 0.31);
    espressoGroup.add(portaHandle);

    // Right of Bar: Ceramic Latte Cup + Saucer + Rising Steam Puffs
    const cupGroup = new THREE.Group();
    cupGroup.position.set(1.26, 0.15, 0.05);
    barGroup.add(cupGroup);

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
    });
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.035, 24), ceramicMat);
    saucer.position.set(0, 0.02, 0);
    cupGroup.add(saucer);

    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.22, 24), ceramicMat);
    cupBody.position.set(0, 0.13, 0);
    cupBody.castShadow = true;
    cupGroup.add(cupBody);

    const cupCoffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.135, 20),
      new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.4 })
    );
    cupCoffee.rotation.x = -Math.PI / 2;
    cupCoffee.position.set(0, 0.235, 0);
    cupGroup.add(cupCoffee);

    const cupHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.018, 10, 20, Math.PI),
      ceramicMat
    );
    cupHandle.rotation.z = -Math.PI / 2;
    cupHandle.position.set(0.15, 0.13, 0);
    cupGroup.add(cupHandle);

    // Rising Steam Puffs above the cup
    const steamPuffs: THREE.Mesh[] = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });
    for (let i = 0; i < 3; i++) {
      const sPuff = new THREE.Mesh(new THREE.SphereGeometry(0.05 - i * 0.007, 12, 12), steamMat.clone());
      sPuff.position.set(0, 0.32 + i * 0.13, 0);
      cupGroup.add(sPuff);
      steamPuffs.push(sPuff);
    }

    // --- 3C. ALPACA PAWS & THE MERCHANT SMARTPHONE + LASER SCANNER ---
    const leftPaw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), woolMat);
    leftPaw.scale.set(1.0, 0.78, 1.25);
    leftPaw.position.set(-0.54, 0.21, 0.15);
    leftPaw.castShadow = true;
    barGroup.add(leftPaw);

    // Right Arm & Smartphone Rig (lifts up and scans the card below when triggered!)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.54, 0.22, 0.14);
    barGroup.add(rightArmPivot);

    const rightPaw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 18), woolMat);
    rightPaw.scale.set(1.0, 0.85, 1.25);
    rightPaw.castShadow = true;
    rightArmPivot.add(rightPaw);

    // 3D Smartphone held by the alpaca's right paw
    // Back of the phone (+Z side) has the rear camera island facing forward/down toward the card;
    // Front screen (-Z side) faces back toward the barista alpaca!
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.08, 0.16, 0.18);
    phoneGroup.rotation.set(0.18, -0.22, 0.1);
    rightArmPivot.add(phoneGroup);

    const phoneBodyGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(0.42, 0.74, 0.065), {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
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

    // Smartphone Rear Backplate (+Z side facing viewer & card) with Camera Island + Gold Emblem
    const phoneBackCanvas = document.createElement('canvas');
    phoneBackCanvas.width = 128;
    phoneBackCanvas.height = 256;
    const pbCtx = phoneBackCanvas.getContext('2d')!;
    const drawPhoneBack = (activeScan: boolean) => {
      // Matte graphite back glass
      pbCtx.fillStyle = '#1c1917';
      roundRect2D(pbCtx, 0, 0, 128, 256, 20);
      pbCtx.fill();

      // Subtle metallic border
      pbCtx.strokeStyle = '#57534e';
      pbCtx.lineWidth = 4;
      roundRect2D(pbCtx, 2, 2, 124, 252, 18);
      pbCtx.stroke();

      // Glossy Camera Island (top-left of backplate)
      pbCtx.fillStyle = '#0c0a09';
      roundRect2D(pbCtx, 14, 14, 58, 82, 14);
      pbCtx.fill();
      pbCtx.strokeStyle = activeScan ? '#10b981' : '#44403c';
      pbCtx.lineWidth = 3;
      roundRect2D(pbCtx, 14, 14, 58, 82, 14);
      pbCtx.stroke();

      // Top Main Camera Lens Ring
      pbCtx.fillStyle = '#1f2937';
      pbCtx.beginPath();
      pbCtx.arc(34, 36, 13, 0, Math.PI * 2);
      pbCtx.fill();
      pbCtx.strokeStyle = '#9ca3af';
      pbCtx.lineWidth = 2.5;
      pbCtx.stroke();

      // Bottom Ultra-Wide Camera Lens Ring
      pbCtx.beginPath();
      pbCtx.arc(34, 72, 13, 0, Math.PI * 2);
      pbCtx.fill();
      pbCtx.stroke();

      // Scanner Laser / Flash LED inside camera island
      pbCtx.fillStyle = activeScan ? '#34d399' : '#fde68a';
      pbCtx.beginPath();
      pbCtx.arc(58, 54, 6, 0, Math.PI * 2);
      pbCtx.fill();

      // Alpacard Gold Star / Badge in center of phone back
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
      new THREE.PlaneGeometry(0.39, 0.7),
      new THREE.MeshStandardMaterial({
        map: phoneBackTex,
        roughness: 0.35,
        metalness: 0.4,
      })
    );
    phoneBackMesh.position.set(0, 0, 0.036);
    phoneGroup.add(phoneBackMesh);

    // 3D Raised Camera Island & Glowing Lens on the +Z side (faces the card when scanning!)
    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.025, 20),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.75,
      })
    );
    cameraLens.rotation.x = Math.PI / 2;
    cameraLens.position.set(-0.08, 0.19, 0.045);
    phoneGroup.add(cameraLens);

    // Smartphone Merchant App Screen on the -Z side (facing the alpaca's eyes!)
    const phoneScreenCanvas = document.createElement('canvas');
    phoneScreenCanvas.width = 128;
    phoneScreenCanvas.height = 256;
    const pCtx = phoneScreenCanvas.getContext('2d')!;
    const drawPhoneScreen = (activeScan: boolean) => {
      pCtx.fillStyle = '#0c0a09';
      pCtx.fillRect(0, 0, 128, 256);
      pCtx.fillStyle = '#3D2B1F';
      pCtx.fillRect(0, 0, 128, 42);
      pCtx.fillStyle = '#fbbf24';
      pCtx.font = 'bold 14px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.fillText('ALPACARD POS', 64, 27);

      pCtx.strokeStyle = activeScan ? '#10b981' : '#f59e0b';
      pCtx.lineWidth = 5;
      pCtx.strokeRect(20, 62, 88, 88);

      if (activeScan) {
        pCtx.fillStyle = 'rgba(16, 185, 129, 0.28)';
        pCtx.fillRect(22, 64, 84, 84);
        pCtx.fillStyle = '#10b981';
        pCtx.beginPath();
        pCtx.arc(64, 200, 24, 0, Math.PI * 2);
        pCtx.fill();
      }
      drawPhoneBack(activeScan);
      phoneBackTex.needsUpdate = true;
    };
    drawPhoneScreen(false);
    const phoneScreenTex = new THREE.CanvasTexture(phoneScreenCanvas);
    const phoneScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.37, 0.66),
      new THREE.MeshBasicMaterial({ map: phoneScreenTex })
    );
    phoneScreenMesh.rotation.y = Math.PI;
    phoneScreenMesh.position.set(0, 0, -0.036);
    phoneGroup.add(phoneScreenMesh);

    // Volumetric Laser Scanner Beam (Tip at 0,0,0; Base at z = +1.0 so lookAt() aims it straight down at the card!)
    const laserBeamGroup = new THREE.Group();
    scene.add(laserBeamGroup);
    laserBeamGroup.visible = false;

    const beamConeGeo = new THREE.ConeGeometry(1.65, 1.0, 32, 1, true);
    // Move apex (tip) of cone to (0, 0, 0) and base to (0, -1, 0)
    beamConeGeo.translate(0, -0.5, 0);
    // Rotate -90 deg around X so apex stays at (0,0,0) and open base is at (0, 0, +1) along +Z!
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
    cardPivot.position.set(0, -1.28, 0);
    scene.add(cardPivot);

    const cardWidth = 3.82;
    const cardHeight = 3.92;
    const cardDepth = 0.16;

    // 4A. High-DPI Dynamic Front Face Canvas Texture (matches the Tailwind card design)
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

      // Card White Surface Background
      fCtx.fillStyle = '#FFFFFF';
      roundRect2D(fCtx, 0, 0, W, H, 56);
      fCtx.fill();

      // Subtle border
      fCtx.strokeStyle = '#E7E5E4';
      fCtx.lineWidth = 8;
      roundRect2D(fCtx, 4, 4, W - 8, H - 8, 54);
      fCtx.stroke();

      // Header Dark Roast Box (#3D2B1F)
      const pad = 54;
      const headerY = 52;
      const headerH = 248;
      fCtx.fillStyle = '#3D2B1F';
      roundRect2D(fCtx, pad, headerY, W - pad * 2, headerH, 36);
      fCtx.fill();

      // Store Name (Uppercase tracking)
      fCtx.fillStyle = '#D6D3D1';
      fCtx.font = '600 24px system-ui, -apple-system, sans-serif';
      fCtx.textAlign = 'center';
      fCtx.fillText(p.storeName.toUpperCase(), W / 2, headerY + 68);

      // Card Title
      fCtx.fillStyle = '#FFFFFF';
      fCtx.font = '800 50px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.cardTitle, W / 2, headerY + 138);

      // Card Subtitle
      fCtx.fillStyle = '#E7E5E4';
      fCtx.font = '500 28px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.cardSubtitle, W / 2, headerY + 194);

      // Progress Label Row
      const progY = 368;
      fCtx.textAlign = 'left';
      fCtx.fillStyle = '#57534E';
      fCtx.font = '600 30px system-ui, -apple-system, sans-serif';
      fCtx.fillText(p.progressLabel, pad + 4, progY);

      fCtx.textAlign = 'right';
      fCtx.fillStyle = '#5C4028';
      fCtx.font = '800 32px system-ui, -apple-system, sans-serif';
      fCtx.fillText(`${curStamps} / ${p.maxStamps}`, W - pad - 4, progY);

      // Recessed Stamp Slot Wells
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

      // Bottom Status Box
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

    // 4B. Back of the 3D Card Texture (seen during 360° celebratory/reset flips!)
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

    // 4C. 3D Card Slab Mesh
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

    // 4D. 10 Physical 3D Stamp Tiles on the Card Face!
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

    const stampTileSize = 0.59;
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

    // 4E. Floating 3D Holographic QR Ring that rises off the card during scanning
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

    // 4F. 3D Burst Particles when a stamp punches into the card
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

    // Initial texture render
    drawFrontCardTexture();

    // ============================================================================
    // 5. POINTER INTERACTION (Allow curious users to tilt the 3D card after reveal)
    // ============================================================================
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      animRef.current.userPointerX = nx;
      animRef.current.userPointerY = ny;
      animRef.current.isPointerHoveringCard = ny < 0.25;
    };

    const handlePointerLeave = () => {
      animRef.current.isPointerHoveringCard = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('pointerleave', handlePointerLeave);

    // ============================================================================
    // 6. MAIN 60FPS ANIMATION LOOP
    // ============================================================================
    let reqId = 0;
    let prevTime = performance.now() / 1000;
    let stampBurstTriggeredForCurrentScan = false;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, now - prevTime);
      prevTime = now;

      const a = animRef.current;

      if (a.needTextureUpdate) {
        drawFrontCardTexture();
        a.needTextureUpdate = false;
      }

      // --- 6A. IDLE BARISTA ALPACA & COFFEE STEAM ANIMATIONS ---
      bodyGroup.position.y = Math.sin(now * 2.4) * 0.025;
      const targetHeadRotY = a.isScanning
        ? Math.sin((now - a.scanStartTime) * 6) * 0.08
        : a.userPointerX * 0.18 + Math.sin(now * 1.1) * 0.06;
      const targetHeadRotX = a.isScanning ? 0.28 : Math.sin(now * 1.6) * 0.03;

      headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * 0.12;
      headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.12;

      // Periodic blinking
      const blinkCycle = now % 3.8;
      const isBlinking = blinkCycle > 3.65;
      const targetEyeScaleY = isBlinking ? 0.08 : 1.0;
      leftEye.scale.y += (targetEyeScaleY - leftEye.scale.y) * 0.35;
      rightEye.scale.y += (targetEyeScaleY - rightEye.scale.y) * 0.35;

      // Ear twitches
      leftEar.rotation.z = 0.22 + Math.sin(now * 3.1) * 0.04;
      rightEar.rotation.z = -0.22 - Math.cos(now * 2.7) * 0.04;

      // Rising coffee steam puffs
      steamPuffs.forEach((puff, idx) => {
        const phase = (now * 0.55 + idx * 0.33) % 1;
        puff.position.y = 0.3 + phase * 0.4;
        puff.position.x = Math.sin(now * 2.5 + idx) * 0.035;
        const s = 0.6 + Math.sin(phase * Math.PI) * 0.6;
        puff.scale.setScalar(s);
        (puff.material as THREE.MeshBasicMaterial).opacity = Math.sin(phase * Math.PI) * 0.42;
      });

      // --- 6B. SCANNING SEQUENCE: BARISTA LIFTS PHONE + CARD BREAKS INTO 3D ---
      let targetCardRotX = 0;
      let targetCardRotY = 0;
      let targetCardRotZ = 0;
      let targetCardPosZ = 0;
      let targetCardPosY = -1.28;

      let targetArmPosY = 0.22;
      let targetArmPosZ = 0.14;
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

          // 1) Barista Alpaca raises the Merchant Smartphone over the bar & tilts its rear camera down at the card
          targetArmPosY = 0.22 + holdEnv * 0.44;
          targetArmPosZ = 0.14 + holdEnv * 0.5;
          targetArmRotX = holdEnv * 0.42;
          targetPhoneRotX = 0.18 + holdEnv * 0.58;
          targetPhoneRotY = -0.22 + holdEnv * 0.16;

          // 2) The Card reveals it is a 3D object! Tilts back in 3D perspective & lifts toward camera
          targetCardRotX = -0.54 * holdEnv;
          targetCardRotY = 0.32 * Math.cos(progress * Math.PI * 1.4) * holdEnv;
          targetCardRotZ = -0.06 * holdEnv;
          targetCardPosZ = 0.85 * holdEnv;
          targetCardPosY = -1.28 + 0.16 * holdEnv;

          // If this scan unlocks the 10/10 reward, do a full 360° celebratory Y-flip!
          if (a.isRewardCelebration && progress > 0.38) {
            const flipProg = THREE.MathUtils.smoothstep(progress, 0.38, 0.92);
            targetCardRotY += flipProg * Math.PI * 2;
            alpacaRoot.position.y = -0.15 + Math.abs(Math.sin(flipProg * Math.PI * 3)) * 0.18;
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

            const sweepY = -0.45 - Math.sin(scanSweep * Math.PI) * 1.75;
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
            drawPhoneScreen(true);
            phoneScreenTex.needsUpdate = true;
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
          alpacaRoot.position.y = -0.15;
          drawPhoneScreen(false);
          phoneScreenTex.needsUpdate = true;
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
        // Once the user discovers the card is 3D, hovering gently tilts it in 3D!
        targetCardRotY = a.userPointerX * 0.22;
        targetCardRotX = a.userPointerY * 0.18;
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
          Math.abs(cardPivot.rotation.x) + Math.abs(cardPivot.rotation.y) + cardPivot.position.z * 0.3;
        const baseZ = cardDepth / 2 + 0.02 + (isStamped ? Math.min(0.08, cardTiltAmount * 0.12) : 0);

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
      resizeObs?.disconnect();
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerleave', handlePointerLeave);
      renderer.dispose();
    };
  }, [maxStamps]);

  return (
    <div className="relative w-full max-w-full overflow-hidden select-none">
      <div
        ref={mountRef}
        className="w-full max-w-full overflow-hidden flex items-center justify-center"
      />
    </div>
  );
}

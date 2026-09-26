"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type StageProp = "clapper" | "reel" | "star" | "camera";

/**
 * A little film set in WebGL: clapperboard, film reel, award star and a
 * vintage camera floating inside a looping film-strip ribbon. Follows the
 * pointer, reacts to clicks (the clapper claps, everything else spins) and
 * stops rendering whenever it's off screen.
 */
export function Stage3D({
  className = "",
  withCamera = false,
  onPropClick,
}: {
  className?: string;
  /** add the vintage movie camera (busier scene, for big canvases) */
  withCamera?: boolean;
  onPropClick?: (prop: StageProp) => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onPropClick);

  useEffect(() => {
    clickRef.current = onPropClick;
  }, [onPropClick]);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL — the section just shows its background
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ——— lights ———
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 6);
    scene.add(key);
    const magenta = new THREE.PointLight(0xff4f7b, 30, 12);
    magenta.position.set(-3.5, -1, 2.5);
    scene.add(magenta);
    const volt = new THREE.PointLight(0xd7ff3a, 22, 12);
    volt.position.set(3.5, 2, 2);
    scene.add(volt);

    const rig = new THREE.Group(); // everything that follows the pointer
    scene.add(rig);

    const disposables: Array<{ dispose: () => void }> = [envTex, pmrem];
    const track = <T extends { dispose: () => void }>(x: T) => {
      disposables.push(x);
      return x;
    };

    const canvasTexture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      draw(c.getContext("2d")!);
      const t = track(new THREE.CanvasTexture(c));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };

    const stripes = canvasTexture(512, 80, (g) => {
      g.fillStyle = "#111";
      g.fillRect(0, 0, 512, 80);
      g.fillStyle = "#f4f4f0";
      for (let x = -80; x < 600; x += 96) {
        g.beginPath();
        g.moveTo(x, 80);
        g.lineTo(x + 48, 0);
        g.lineTo(x + 96, 0);
        g.lineTo(x + 48, 80);
        g.fill();
      }
    });

    const slate = canvasTexture(512, 360, (g) => {
      g.fillStyle = "#15161a";
      g.fillRect(0, 0, 512, 360);
      g.strokeStyle = "rgba(255,255,255,0.55)";
      g.lineWidth = 3;
      g.strokeRect(18, 18, 476, 324);
      g.beginPath();
      g.moveTo(18, 130);
      g.lineTo(494, 130);
      g.moveTo(18, 236);
      g.lineTo(494, 236);
      g.moveTo(256, 130);
      g.lineTo(256, 342);
      g.stroke();
      g.fillStyle = "#d7ff3a";
      g.font = "bold 64px sans-serif";
      g.fillText("KALEDIO", 40, 100);
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.font = "22px monospace";
      g.fillText("SCENE", 36, 162);
      g.fillText("TAKE", 274, 162);
      g.fillText("ROLL", 36, 268);
      g.fillText("DATE", 274, 268);
      g.font = "bold 56px sans-serif";
      g.fillText("1", 110, 220);
      g.fillText("1", 350, 220);
      g.font = "bold 40px sans-serif";
      g.fillText("A-01", 90, 322);
      g.fillText("TODAY", 310, 322);
    });

    const film = canvasTexture(1024, 128, (g) => {
      g.fillStyle = "#0c0c0f";
      g.fillRect(0, 0, 1024, 128);
      const frames = ["#ff4f7b", "#ffb13b", "#d7ff3a", "#7c5cff", "#3ddc97", "#ff7a45", "#4fc3ff", "#c94ad8"];
      frames.forEach((col, i) => {
        const x = i * 128 + 10;
        const grd = g.createLinearGradient(x, 24, x + 108, 104);
        grd.addColorStop(0, col);
        grd.addColorStop(1, "#1a1030");
        g.fillStyle = grd;
        g.fillRect(x, 26, 108, 76);
      });
      g.fillStyle = "#e9e6df";
      for (let x = 6; x < 1024; x += 32) {
        g.fillRect(x, 6, 16, 12);
        g.fillRect(x, 110, 16, 12);
      }
    });
    film.wrapS = THREE.RepeatWrapping;

    const mat = (params: THREE.MeshStandardMaterialParameters) => track(new THREE.MeshStandardMaterial(params));
    const black = mat({ color: 0x141418, roughness: 0.45, metalness: 0.2 });
    const chrome = mat({ color: 0xd9dde6, roughness: 0.18, metalness: 1 });
    const gold = mat({ color: 0xffc53d, roughness: 0.22, metalness: 1, emissive: 0x3a2400, emissiveIntensity: 0.4 });
    const voltMat = mat({ color: 0xd7ff3a, roughness: 0.35, metalness: 0.1, emissive: 0x516b00, emissiveIntensity: 0.35 });
    const reelFilm = mat({ color: 0x2a1a12, roughness: 0.6, metalness: 0.3 });

    type Floater = { obj: THREE.Object3D; base: THREE.Vector3; phase: number; spin: THREE.Vector3; boost: number };
    const floaters: Floater[] = [];
    const float = (obj: THREE.Object3D, kind: StageProp, spin: [number, number, number]) => {
      obj.userData.kind = kind;
      rig.add(obj);
      floaters.push({ obj, base: obj.position.clone(), phase: floaters.length * 1.7, spin: new THREE.Vector3(...spin), boost: 0 });
      return floaters[floaters.length - 1];
    };

    // ——— clapperboard ———
    const clapper = new THREE.Group();
    const boardGeo = track(new THREE.BoxGeometry(1.7, 1.2, 0.08));
    const slateMat = mat({ map: slate, roughness: 0.55 });
    const board = new THREE.Mesh(boardGeo, [black, black, black, black, slateMat, black]);
    clapper.add(board);
    const barGeo = track(new THREE.BoxGeometry(1.7, 0.24, 0.08));
    const stripeMat = mat({ map: stripes, roughness: 0.4 });
    const baseBar = new THREE.Mesh(barGeo, [black, black, black, black, stripeMat, black]);
    baseBar.position.y = 0.72;
    clapper.add(baseBar);
    const hinge = new THREE.Group();
    hinge.position.set(-0.85, 0.86, 0);
    const arm = new THREE.Mesh(barGeo, [black, black, black, black, stripeMat, black]);
    arm.position.set(0.85, 0.12, 0);
    hinge.add(arm);
    hinge.rotation.z = 0.42;
    clapper.add(hinge);
    clapper.position.set(-1.75, 0.15, 0.2);
    clapper.rotation.set(0.08, 0.38, -0.1);
    clapper.scale.setScalar(0.95);
    const clapperF = float(clapper, "clapper", [0, 0.12, 0]);

    // ——— film reel ———
    const reel = new THREE.Group();
    const plate = new THREE.Shape();
    plate.absarc(0, 0, 0.95, 0, Math.PI * 2, false);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.2, 0, Math.PI * 2, true);
      plate.holes.push(hole);
    }
    const hub = new THREE.Path();
    hub.absarc(0, 0, 0.09, 0, Math.PI * 2, true);
    plate.holes.push(hub);
    const plateGeo = track(
      new THREE.ExtrudeGeometry(plate, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 40 })
    );
    const front = new THREE.Mesh(plateGeo, chrome);
    front.position.z = 0.16;
    const back = new THREE.Mesh(plateGeo, chrome);
    back.position.z = -0.21;
    const wound = new THREE.Mesh(track(new THREE.CylinderGeometry(0.62, 0.62, 0.34, 48)), reelFilm);
    wound.rotation.x = Math.PI / 2;
    const axle = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24)), voltMat);
    axle.rotation.x = Math.PI / 2;
    reel.add(front, back, wound, axle);
    reel.position.set(1.8, 0.75, -0.4);
    reel.rotation.set(0.2, -0.5, 0);
    float(reel, "reel", [0, 0, -0.6]);

    // ——— award star ———
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 0.62 : 0.27;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    star.closePath();
    const starGeo = track(
      new THREE.ExtrudeGeometry(star, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 })
    );
    starGeo.center();
    const starMesh = new THREE.Mesh(starGeo, gold);
    starMesh.position.set(0.45, -1.2, 0.9);
    float(starMesh, "star", [0, 0.9, 0]);

    // ——— vintage camera ———
    if (withCamera) {
      const cam = new THREE.Group();
      const body = new THREE.Mesh(track(new RoundedBoxGeometry(1.25, 0.8, 0.62, 4, 0.08)), black);
      const band = new THREE.Mesh(track(new THREE.BoxGeometry(1.27, 0.12, 0.64)), voltMat);
      band.position.y = -0.18;
      const lens = new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 32)), black);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0.28, 0, 0.52);
      const glass = new THREE.Mesh(
        track(new THREE.CircleGeometry(0.19, 32)),
        mat({ color: 0x223355, roughness: 0.05, metalness: 1, emissive: 0x7c5cff, emissiveIntensity: 0.35 })
      );
      glass.position.set(0.28, 0, 0.78);
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(0.23, 0.035, 12, 40)), chrome);
      ring.position.set(0.28, 0, 0.77);
      cam.add(body, band, lens, glass, ring);
      const topReelGeo = track(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 32));
      const topReels: THREE.Mesh[] = [];
      [-0.3, 0.38].forEach((x) => {
        const r = new THREE.Mesh(topReelGeo, chrome);
        r.rotation.z = Math.PI / 2;
        r.position.set(x, 0.72, 0);
        cam.add(r);
        topReels.push(r);
      });
      cam.position.set(0.15, 1.45, -1.3);
      cam.rotation.set(0.1, -0.35, 0);
      cam.scale.setScalar(0.85);
      cam.userData.topReels = topReels;
      float(cam, "camera", [0, 0.15, 0]);
    }

    // ——— film ribbon looping through the set ———
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-3.4, 0.9, -1.4),
        new THREE.Vector3(-1.2, 2.0, 0.6),
        new THREE.Vector3(1.6, 1.8, -1.2),
        new THREE.Vector3(3.5, 0.1, 0.2),
        new THREE.Vector3(1.4, -1.9, 1.1),
        new THREE.Vector3(-1.6, -1.6, -0.6),
      ],
      true,
      "catmullrom",
      0.5
    );
    const SEG = 360;
    const width = 0.34;
    const pos = new Float32Array((SEG + 1) * 2 * 3);
    const uv = new Float32Array((SEG + 1) * 2 * 2);
    const idx: number[] = [];
    const up = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const p = curve.getPointAt(t % 1);
      const tan = curve.getTangentAt(t % 1);
      const twist = Math.sin(t * Math.PI * 4) * 0.9;
      up.set(Math.sin(twist), Math.cos(twist), 0.3).normalize();
      side.crossVectors(tan, up).normalize().multiplyScalar(width / 2);
      pos.set([p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z], i * 6);
      uv.set([t * 14, 1, t * 14, 0], i * 4);
      if (i < SEG) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const ribbonGeo = track(new THREE.BufferGeometry());
    ribbonGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    ribbonGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    ribbonGeo.setIndex(idx);
    ribbonGeo.computeVertexNormals();
    const ribbon = new THREE.Mesh(
      ribbonGeo,
      mat({ map: film, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.2, emissive: 0xffffff, emissiveMap: film, emissiveIntensity: 0.25 })
    );
    rig.add(ribbon);

    // ——— projector dust ———
    const DUST = 260;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4], i * 3);
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      track(new THREE.PointsMaterial({ color: 0xfff4d6, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }))
    );
    scene.add(dust);

    // ——— sizing ———
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep the whole set in frame on narrow canvases
      camera.position.z = 9 * Math.max(1, 1.45 / camera.aspect);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ——— interaction ———
    const pointer = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let clapT = -1;

    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(floaters.map((f) => f.obj), true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && !o.userData.kind) o = o.parent;
      return o ? floaters.find((f) => f.obj === o) ?? null : null;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      renderer.domElement.style.cursor = pick(e) ? "pointer" : "";
    };
    const onLeave = () => target.set(0, 0);
    const onClick = (e: PointerEvent) => {
      const f = pick(e);
      if (!f) return;
      const kind = f.obj.userData.kind as StageProp;
      if (kind === "clapper") clapT = 0;
      else f.boost = 14;
      clickRef.current?.(kind);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("click", onClick as EventListener);

    // ——— loop, only while visible ———
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(host);

    let autoClap = 3;
    function tick() {
      raf = 0;
      if (!visible || document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const t = elapsed;
      const motion = reduceMotion ? 0.15 : 1;

      pointer.lerp(target, 0.06);
      rig.rotation.y = pointer.x * 0.35;
      rig.rotation.x = pointer.y * 0.2;

      for (const f of floaters) {
        f.obj.position.y = f.base.y + Math.sin(t * 0.9 + f.phase) * 0.14 * motion;
        f.obj.position.x = f.base.x + Math.cos(t * 0.6 + f.phase) * 0.06 * motion;
        const k = (1 + f.boost) * dt * motion;
        f.obj.rotation.x += f.spin.x * k;
        f.obj.rotation.y += f.spin.y * k;
        f.obj.rotation.z += f.spin.z * k;
        f.boost *= 0.95;
        if (f.boost < 0.01) f.boost = 0;
        if (f.obj.userData.topReels) {
          for (const r of f.obj.userData.topReels as THREE.Mesh[]) r.rotation.x += dt * 2 * motion;
        }
      }
      // gentle sway back so clapper/star never drift too far off-angle
      clapperF.obj.rotation.y = 0.38 + Math.sin(t * 0.5) * 0.25;

      // clap: snap shut, hold, reopen
      if (!reduceMotion) {
        autoClap -= dt;
        if (autoClap <= 0 && clapT < 0) {
          clapT = 0;
          autoClap = 6 + Math.random() * 3;
        }
      }
      if (clapT >= 0) {
        clapT += dt;
        hinge.rotation.z = clapT < 0.12 ? 0.42 * (1 - clapT / 0.12) : clapT < 0.35 ? 0 : Math.min(0.42, (clapT - 0.35) * 1.1);
        if (clapT > 0.8) clapT = -1;
      }

      film.offset.x -= dt * 0.35 * motion;
      dust.rotation.y += dt * 0.02 * motion;
      dust.position.y = Math.sin(t * 0.2) * 0.15;
      magenta.intensity = 26 + Math.sin(t * 1.3) * 6;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    const onVis = () => {
      if (!document.hidden && visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    renderer.render(scene, camera); // first frame right away, even in a background tab
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("click", onClick as EventListener);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [withCamera]);

  return <div ref={mount} className={className} />;
}

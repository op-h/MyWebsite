// ============================================
// Cybersecurity Portfolio — Hussein Dheyaa (oph)
// Three.js + GSAP + Locomotive Scroll
// Mobile-optimized with adaptive quality
// ============================================

(function () {
    "use strict";

    // =============================
    // 0. Device Detection & Config
    // =============================
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
    const isLowEnd = isMobile && (navigator.hardwareConcurrency || 4) <= 4;
    const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    // Adaptive counts — reduce particles on mobile for smooth 60fps
    const CFG = {
        nodeCount:      isMobile ? 20 : 60,
        connectionDist: isMobile ? 3.0 : 3.5,
        matrixCount:    isMobile ? 150 : 500,
        hexFloorCount:  isMobile ? 250 : 800,
        dataCount:      isMobile ? 100 : 300,
        enablePulse:    !isLowEnd,
        enableMouseParallax: !isMobile
    };

    // =============================
    // 1. Locomotive Scroll
    // =============================
    const scrollContainer = document.querySelector('#main-container');

    const locoScroll = new LocomotiveScroll({
        el: scrollContainer,
        smooth: true,
        multiplier: isMobile ? 1.0 : 0.7,
        lerp: isMobile ? 0.08 : 0.04,
        touchMultiplier: 2.5,
        smartphone: { smooth: true, multiplier: 1.2 },
        tablet: { smooth: true, multiplier: 1.0 }
    });

    // =============================
    // 2. GSAP + ScrollTrigger Sync
    // =============================
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    locoScroll.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(scrollContainer, {
        scrollTop(value) {
            return arguments.length
                ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true })
                : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: scrollContainer.style.transform ? "transform" : "fixed"
    });

    // =============================
    // 3. Hero Intro Animations
    // =============================
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero .glass-card", { y: 60, opacity: 0, duration: 1 }, 0.2)
      .to("#hero-typing", { duration: 2.5, text: "./execute_portfolio.sh", ease: "none" }, 0.6)
      .from(".nickname", { y: 20, opacity: 0, duration: 0.6 }, 1)
      .from(".subtitle", { y: 20, opacity: 0, duration: 0.6 }, 1.15)
      .from(".college-info", { y: 20, opacity: 0, duration: 0.6 }, 1.3);

    // =============================
    // 4. Three.js Scene Setup
    // =============================
    const canvas = document.querySelector('#webgl-canvas');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, isMobile ? 0.045 : 0.035);

    const camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(dpr);

    // --- Mouse tracking for parallax (desktop only) ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    if (CFG.enableMouseParallax) {
        window.addEventListener('mousemove', (e) => {
            mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        });
    }

    // ===========================================
    // 5. CYBER OBJECTS
    // ===========================================

    // --- A. Network Topology (nodes + connections) ---
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    const nodePositions = [];
    const nodeGeo = new THREE.SphereGeometry(0.04, isMobile ? 6 : 8, isMobile ? 6 : 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 });

    for (let i = 0; i < CFG.nodeCount; i++) {
        const x = (Math.random() - 0.5) * 16;
        const y = (Math.random() - 0.5) * 12;
        const z = (Math.random() - 0.5) * 10 - 3;
        nodePositions.push(new THREE.Vector3(x, y, z));

        const n = new THREE.Mesh(nodeGeo, nodeMat.clone());
        n.position.set(x, y, z);
        networkGroup.add(n);
    }

    // Connect nearby nodes
    const lineMat = new THREE.LineBasicMaterial({
        color: 0x00ffcc, transparent: true, opacity: 0.06
    });
    for (let i = 0; i < CFG.nodeCount; i++) {
        for (let j = i + 1; j < CFG.nodeCount; j++) {
            if (nodePositions[i].distanceTo(nodePositions[j]) < CFG.connectionDist) {
                const lg = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
                networkGroup.add(new THREE.Line(lg, lineMat));
            }
        }
    }

    // --- B. Central Shield (Icosahedron layers) ---
    const shieldGroup = new THREE.Group();
    scene.add(shieldGroup);

    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.1
    });
    const shield = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.0, 1), shieldMat
    );
    shieldGroup.add(shield);

    const midMat = new THREE.MeshBasicMaterial({
        color: 0x0066ff, wireframe: true, transparent: true, opacity: 0.06
    });
    const midShield = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, isMobile ? 1 : 2), midMat
    );
    shieldGroup.add(midShield);

    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc, wireframe: false, transparent: true, opacity: 0.15
    });
    const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.6, 0), coreMat
    );
    shieldGroup.add(core);

    // --- C. Scanning Rings ---
    const segments = isMobile ? 64 : 128;

    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.2 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.015, 8, segments), ringMat1);
    ring1.rotation.x = Math.PI / 2;
    shieldGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x0055ff, transparent: true, opacity: 0.15 });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.01, 8, segments), ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.z = Math.PI / 5;
    shieldGroup.add(ring2);

    if (!isMobile) {
        const ringMat3 = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.1 });
        var ring3 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.008, 8, segments), ringMat3);
        ring3.rotation.x = Math.PI / 4;
        ring3.rotation.z = -Math.PI / 3;
        shieldGroup.add(ring3);
    }

    // --- D. Matrix Code Rain ---
    const matrixPos = new Float32Array(CFG.matrixCount * 3);
    const matrixSpeeds = new Float32Array(CFG.matrixCount);
    for (let i = 0; i < CFG.matrixCount; i++) {
        matrixPos[i * 3]     = (Math.random() - 0.5) * 20;
        matrixPos[i * 3 + 1] = Math.random() * 16 - 8;
        matrixPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 5;
        matrixSpeeds[i] = 0.01 + Math.random() * 0.03;
    }
    const matrixGeo = new THREE.BufferGeometry();
    matrixGeo.setAttribute('position', new THREE.BufferAttribute(matrixPos, 3));
    const matrixMat = new THREE.PointsMaterial({
        size: isMobile ? 0.04 : 0.03,
        color: 0x00ff66, transparent: true, opacity: 0.5
    });
    const matrixRain = new THREE.Points(matrixGeo, matrixMat);
    scene.add(matrixRain);

    // --- E. Hex Grid Floor ---
    const hexFloorPos = new Float32Array(CFG.hexFloorCount * 3);
    for (let i = 0; i < CFG.hexFloorCount; i++) {
        hexFloorPos[i * 3]     = (Math.random() - 0.5) * 24;
        hexFloorPos[i * 3 + 1] = -4 + Math.random() * 0.5;
        hexFloorPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
    }
    const hexFloorGeo = new THREE.BufferGeometry();
    hexFloorGeo.setAttribute('position', new THREE.BufferAttribute(hexFloorPos, 3));
    const hexFloorMat = new THREE.PointsMaterial({
        size: isMobile ? 0.03 : 0.02,
        color: 0x003366, transparent: true, opacity: 0.4
    });
    const hexFloor = new THREE.Points(hexFloorGeo, hexFloorMat);
    scene.add(hexFloor);

    // --- F. Data Stream Particles ---
    const dataPos = new Float32Array(CFG.dataCount * 3);
    const dataSpeeds = new Float32Array(CFG.dataCount);
    for (let i = 0; i < CFG.dataCount; i++) {
        dataPos[i * 3]     = (Math.random() - 0.5) * 14;
        dataPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
        dataPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
        dataSpeeds[i] = 0.005 + Math.random() * 0.01;
    }
    const dataGeo = new THREE.BufferGeometry();
    dataGeo.setAttribute('position', new THREE.BufferAttribute(dataPos, 3));
    const dataMat = new THREE.PointsMaterial({
        size: isMobile ? 0.03 : 0.025,
        color: 0x0088ff, transparent: true, opacity: 0.3
    });
    const dataParticles = new THREE.Points(dataGeo, dataMat);
    scene.add(dataParticles);

    // --- G. Threat Pulse Rings (desktop only or limited on mobile) ---
    const pulseRings = [];
    const pulseGroup = new THREE.Group();
    if (CFG.enablePulse) scene.add(pulseGroup);

    function createPulseRing() {
        const geo = new THREE.RingGeometry(0.1, 0.12, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff004c, transparent: true, opacity: 0.4, side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4 - 2
        );
        mesh.userData = { age: 0, maxAge: 80 + Math.random() * 60 };
        pulseGroup.add(mesh);
        pulseRings.push(mesh);
    }

    // =============================
    // 6. Scroll-Driven 3D Animations
    // =============================
    gsap.to(shieldGroup.rotation, {
        y: Math.PI * 2, x: Math.PI * 0.4, ease: "none",
        scrollTrigger: {
            trigger: "#soc-section", scroller: scrollContainer,
            start: "top bottom", end: "bottom top", scrub: 2
        }
    });

    gsap.to(shieldGroup.position, {
        x: 3, z: -2, ease: "none",
        scrollTrigger: {
            trigger: ".forensics", scroller: scrollContainer,
            start: "top bottom", end: "bottom top", scrub: 2
        }
    });

    gsap.to(shieldGroup.scale, {
        x: 0.5, y: 0.5, z: 0.5, ease: "none",
        scrollTrigger: {
            trigger: ".forensics", scroller: scrollContainer,
            start: "top bottom", end: "bottom top", scrub: 2
        }
    });

    gsap.to(networkGroup.rotation, {
        y: Math.PI * 0.3, ease: "none",
        scrollTrigger: {
            trigger: "#soc-section", scroller: scrollContainer,
            start: "top bottom", end: "bottom top", scrub: 3
        }
    });

    if (!isMobile) {
        gsap.to(camera.position, {
            x: -1, y: 0.5, ease: "none",
            scrollTrigger: {
                trigger: ".forensics", scroller: scrollContainer,
                start: "top bottom", end: "bottom top", scrub: 2
            }
        });
    }

    gsap.to(matrixMat, {
        opacity: 0.8, ease: "none",
        scrollTrigger: {
            trigger: ".links", scroller: scrollContainer,
            start: "top bottom", end: "top center", scrub: 1
        }
    });

    // =============================
    // 7. Section Reveal Animations
    // =============================
    gsap.from("#soc-section .glass-card", {
        y: 80, opacity: 0,
        scrollTrigger: {
            trigger: "#soc-section", scroller: scrollContainer,
            start: "top 85%", end: "top 45%", scrub: 1
        }
    });

    gsap.from(".forensics .glass-card", {
        y: 80, opacity: 0,
        scrollTrigger: {
            trigger: ".forensics", scroller: scrollContainer,
            start: "top 85%", end: "top 45%", scrub: 1
        }
    });

    gsap.from(".links .glass-card", {
        y: 80, opacity: 0,
        scrollTrigger: {
            trigger: ".links", scroller: scrollContainer,
            start: "top 85%", end: "top 50%", scrub: 1
        }
    });

    // =============================
    // 8. Render Loop
    // =============================
    const clock = new THREE.Clock();
    let pulseTimer = 0;
    let frameSkip = 0;

    function tick() {
        const t = clock.getElapsedTime();

        // --- Mouse parallax (desktop) ---
        if (CFG.enableMouseParallax) {
            mouse.x += (mouse.targetX - mouse.x) * 0.03;
            mouse.y += (mouse.targetY - mouse.y) * 0.03;
            shieldGroup.rotation.y += mouse.x * 0.002;
            shieldGroup.rotation.x += mouse.y * 0.001;
        }

        // --- Shield idle rotation ---
        shield.rotation.y += 0.001;
        shield.rotation.x += 0.0003;
        midShield.rotation.y -= 0.0015;
        midShield.rotation.z += 0.0005;
        core.rotation.y += 0.004;
        core.rotation.x += 0.002;

        // --- Scanning rings ---
        ring1.rotation.z = t * 0.22;
        ring2.rotation.z = -t * 0.15;
        ring2.rotation.y = t * 0.1;
        if (!isMobile && ring3) {
            ring3.rotation.z = t * 0.12;
            ring3.rotation.x = Math.PI / 4 + Math.sin(t * 0.2) * 0.1;
        }

        // --- Pulse opacity ---
        shieldMat.opacity = 0.08 + Math.sin(t * 1.0) * 0.03;
        coreMat.opacity = 0.12 + Math.sin(t * 2.0) * 0.05;
        ringMat1.opacity = 0.15 + Math.sin(t * 1.5) * 0.06;

        // --- Matrix code rain ---
        const mPos = matrixGeo.attributes.position.array;
        for (let i = 0; i < CFG.matrixCount; i++) {
            mPos[i * 3 + 1] -= matrixSpeeds[i];
            if (mPos[i * 3 + 1] < -8) {
                mPos[i * 3 + 1] = 8;
                mPos[i * 3] = (Math.random() - 0.5) * 20;
            }
        }
        matrixGeo.attributes.position.needsUpdate = true;

        // --- Data particles rise ---
        const dPos = dataGeo.attributes.position.array;
        for (let i = 0; i < CFG.dataCount; i++) {
            dPos[i * 3 + 1] += dataSpeeds[i];
            if (dPos[i * 3 + 1] > 7) {
                dPos[i * 3 + 1] = -7;
                dPos[i * 3] = (Math.random() - 0.5) * 14;
            }
        }
        dataGeo.attributes.position.needsUpdate = true;

        // --- Hex floor wave (every other frame on mobile) ---
        frameSkip++;
        if (!isMobile || frameSkip % 2 === 0) {
            const hPos = hexFloorGeo.attributes.position.array;
            for (let i = 0; i < CFG.hexFloorCount; i++) {
                hPos[i * 3 + 1] = -4 + Math.sin(t * 0.5 + hPos[i * 3] * 0.3) * 0.15;
            }
            hexFloorGeo.attributes.position.needsUpdate = true;
        }

        // --- Threat pulse rings ---
        if (CFG.enablePulse) {
            pulseTimer++;
            if (pulseTimer % 90 === 0 && pulseRings.length < (isMobile ? 3 : 8)) {
                createPulseRing();
            }
            for (let i = pulseRings.length - 1; i >= 0; i--) {
                const r = pulseRings[i];
                r.userData.age++;
                const progress = r.userData.age / r.userData.maxAge;
                r.scale.set(1 + progress * 12, 1 + progress * 12, 1);
                r.material.opacity = 0.35 * (1 - progress);
                if (r.userData.age >= r.userData.maxAge) {
                    pulseGroup.remove(r);
                    r.geometry.dispose();
                    r.material.dispose();
                    pulseRings.splice(i, 1);
                }
            }
        }

        // --- Network node pulse (skip on low-end) ---
        if (!isLowEnd) {
            networkGroup.children.forEach((child, idx) => {
                if (child.isMesh) {
                    child.material.opacity = 0.5 + Math.sin(t * 2 + idx * 0.5) * 0.3;
                }
            });
        }

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();

    // =============================
    // 9. Resize Handler
    // =============================
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            locoScroll.update();
        }, 150);
    });

    // =============================
    // 10. Final ScrollTrigger Refresh
    // =============================
    ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
    ScrollTrigger.refresh();

})();

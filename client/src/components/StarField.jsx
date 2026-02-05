import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const StarField = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Store ref value in a variable to avoid stale ref in cleanup
        const container = containerRef.current;
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Star particles
        const starCount = 2000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);

        const colorPalette = [
            new THREE.Color(0x3b82f6), // Blue
            new THREE.Color(0x8b5cf6), // Violet
            new THREE.Color(0xffffff), // White
            new THREE.Color(0x60a5fa), // Light blue
        ];

        for (let i = 0; i < starCount; i++) {
            // Position
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            
            starPositions[i * 3] = x;
            starPositions[i * 3 + 1] = y;
            starPositions[i * 3 + 2] = z;

            // Color
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            starColors[i * 3] = color.r;
            starColors[i * 3 + 1] = color.g;
            starColors[i * 3 + 2] = color.b;

            // Size
            starSizes[i] = Math.random() * 2;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Shooting stars
        const shootingStars = [];
        const shootingStarGeometry = new THREE.BufferGeometry();
        const shootingStarPositions = new Float32Array(2 * 3); // Start and end points
        shootingStarGeometry.setAttribute('position', new THREE.BufferAttribute(shootingStarPositions, 3));
        
        const shootingStarMaterial = new THREE.LineBasicMaterial({
            color: 0x60a5fa,
            transparent: true,
            opacity: 0
        });

        const shootingStarLine = new THREE.Line(shootingStarGeometry, shootingStarMaterial);
        scene.add(shootingStarLine);

        camera.position.z = 500;

        // Animation
        let animationId;
        let time = 0;
        let lastShootingStar = 0;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            time += 0.001;

            // Rotate stars slowly
            stars.rotation.y = time * 0.1;
            stars.rotation.x = time * 0.05;

            // Twinkle effect
            const sizes = starGeometry.attributes.size.array;
            for (let i = 0; i < starCount; i++) {
                if (Math.random() > 0.99) {
                    sizes[i] = Math.random() * 3;
                }
            }
            starGeometry.attributes.size.needsUpdate = true;

            // Shooting star
            if (time - lastShootingStar > 3 + Math.random() * 4) {
                lastShootingStar = time;
                const startX = (Math.random() - 0.5) * 1000;
                const startY = 300 + Math.random() * 200;
                const startZ = (Math.random() - 0.5) * 500;
                
                shootingStars.push({
                    x: startX,
                    y: startY,
                    z: startZ,
                    vx: (Math.random() - 0.5) * 200,
                    vy: -200 - Math.random() * 100,
                    vz: 0,
                    life: 1
                });
            }

            // Update shooting stars
            if (shootingStars.length > 0) {
                const star = shootingStars[0];
                star.x += star.vx * 0.016;
                star.y += star.vy * 0.016;
                star.life -= 0.02;

                if (star.life <= 0) {
                    shootingStars.shift();
                    shootingStarMaterial.opacity = 0;
                } else {
                    const positions = shootingStarGeometry.attributes.position.array;
                    positions[0] = star.x;
                    positions[1] = star.y;
                    positions[2] = star.z;
                    positions[3] = star.x - star.vx * 0.1;
                    positions[4] = star.y - star.vy * 0.1;
                    positions[5] = star.z;
                    shootingStarGeometry.attributes.position.needsUpdate = true;
                    shootingStarMaterial.opacity = star.life * 0.8;
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            starGeometry.dispose();
            starMaterial.dispose();
            shootingStarGeometry.dispose();
            shootingStarMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

export default StarField;

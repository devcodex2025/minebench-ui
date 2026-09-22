'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

function RotatingShape() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <mesh ref={meshRef}>
            <torusKnotGeometry args={[10, 3, 100, 16]} />
            <meshStandardMaterial
                color="#ffffff"
                wireframe
                transparent
                opacity={0.1}
                emissive="#ffffff"
                emissiveIntensity={0.1}
            />
        </mesh>
    );
}

export default function Scene3D() {
    const [hasWebGL, setHasWebGL] = useState(true);

    useEffect(() => {
        // Check for WebGL support
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                setHasWebGL(false);
            }
        } catch (e) {
            setHasWebGL(false);
        }
    }, []);

    // Fallback for browsers without GPU acceleration
    if (!hasWebGL) {
        return (
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 grayscale">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/20" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40 grayscale">
            <Canvas
                camera={{ position: [0, 0, 35], fov: 50 }}
                gl={{
                    antialias: false,
                    powerPreference: 'low-power',
                    failIfMajorPerformanceCaveat: false
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#000000', 0);
                }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <RotatingShape />
            </Canvas>
        </div>
    );
}

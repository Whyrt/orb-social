import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function NeuralSphere({ view, audioData, globalPlayer }) {
    const points = useRef();
    const { viewport } = useThree();
    const isMobile = viewport.width < 5;

    const modeLerp = useRef(0);
    const amplitudeLerp = useRef(0);

    // Меньше частиц для лучшей производительности
    const count = isMobile ? 5000 : 8000;
    const positions = useMemo(() => new Float32Array(count * 3), [count]);

    useFrame((state) => {
        if (!points.current) return;
        const time = state.clock.getElapsedTime();
        const pos = points.current.geometry.attributes.position;

        const hasSource = !!globalPlayer.src;
        modeLerp.current = THREE.MathUtils.lerp(modeLerp.current, hasSource ? 1 : 0, 0.08);

        const targetAmp = globalPlayer.isPlaying ? 1 : 0;
        amplitudeLerp.current = THREE.MathUtils.lerp(amplitudeLerp.current, targetAmp, 0.1);

        const numBars = 60;
        const ptsPerBar = Math.floor(count / numBars);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            const rS = 2.0 + Math.sin(time * 0.3 + i * 0.05) * 0.06;
            const xS = rS * Math.cos(theta) * Math.sin(phi);
            const yS = rS * Math.sin(theta) * Math.sin(phi);
            const zS = rS * Math.cos(phi);

            const barIdx = Math.floor(i / ptsPerBar);
            const ptInBarIdx = i % ptsPerBar;
            const normalizedY = (ptInBarIdx / ptsPerBar) - 0.5;
            const dataIdx = Math.floor((barIdx / numBars) * (audioData.length * 0.6));
            const rawFreq = audioData[dataIdx] || 0;
            let freqPower = Math.pow(rawFreq / 255, 2.5);
            freqPower *= amplitudeLerp.current * 1.0;

            const yW = normalizedY * freqPower * (isMobile ? 2.0 : 3.0);
            let xW = (barIdx / numBars - 0.5) * (viewport.width * 0.7);

            const noise = Math.sin(i * 132.5 + time * 15) * Math.cos(i * 32.1);
            const jitterX = noise * (freqPower * 0.5);
            const jitterZ = Math.sin(i * 50 + time * 5) * (freqPower * 1.2);
            xW += jitterX;
            const zW = jitterZ;

            pos.array[i3] = THREE.MathUtils.lerp(xS, xW, modeLerp.current);
            pos.array[i3 + 1] = THREE.MathUtils.lerp(yS, yW, modeLerp.current);
            pos.array[i3 + 2] = THREE.MathUtils.lerp(zS, zW, modeLerp.current);
        }

        pos.needsUpdate = true;

        points.current.rotation.y = THREE.MathUtils.lerp(time * 0.02, 0, modeLerp.current);
        points.current.rotation.x = THREE.MathUtils.lerp(time * 0.01, 0, modeLerp.current);
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={isMobile ? 0.006 : 0.005}
                color="#ffffff"
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}
export default NeuralSphere;

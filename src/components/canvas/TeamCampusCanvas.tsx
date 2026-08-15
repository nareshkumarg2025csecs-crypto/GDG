import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useTeamStore } from '@/store/teamStore';
import {
    TEAM_MEMBERS,
    TeamMember,
    Department,
    DEPARTMENT_COLORS,
    DEPARTMENT_ORDER
} from '@/data/team';

const CARD_WIDTH = 1.2;
const CARD_HEIGHT = 1.6;
const CARD_GAP = 0.3;

const BAY_POSITIONS: Record<Department, THREE.Vector3> = {
    Leads: new THREE.Vector3(0, 0, 0),
    TechOps: new THREE.Vector3(8, 0, -5),
    Design: new THREE.Vector3(16, 2, -3),
    Media: new THREE.Vector3(24, 0, 0),
    Logistics: new THREE.Vector3(32, 0, -5),
};

const CAMERA_POSITIONS: Record<Department, { position: THREE.Vector3; lookAt: THREE.Vector3 }> = {
    Leads: { position: new THREE.Vector3(0, 2, 8), lookAt: new THREE.Vector3(0, 0, 0) },
    TechOps: { position: new THREE.Vector3(8, 2, 3), lookAt: new THREE.Vector3(8, 0, -5) },
    Design: { position: new THREE.Vector3(16, 4, 5), lookAt: new THREE.Vector3(16, 2, -3) },
    Media: { position: new THREE.Vector3(24, 2, 8), lookAt: new THREE.Vector3(24, 0, 0) },
    Logistics: { position: new THREE.Vector3(32, 2, 3), lookAt: new THREE.Vector3(32, 0, -5) },
};

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
        : [1, 1, 1];
}

function calculateCardPositions(members: TeamMember[], bayPosition: THREE.Vector3): THREE.Vector3[] {
    const cols = Math.ceil(Math.sqrt(members.length));
    return members.map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return new THREE.Vector3(
            bayPosition.x + (col - (cols - 1) / 2) * (CARD_WIDTH + CARD_GAP),
            bayPosition.y + 0.5,
            bayPosition.z - row * (CARD_HEIGHT + CARD_GAP)
        );
    });
}

function TeamCards() {
    const { hoveredMemberId, setHoveredMemberId, filteredMembers, openModal } = useTeamStore();

    const cardData = useMemo(() => {
        const data: { member: TeamMember; position: THREE.Vector3; color: string }[] = [];
        DEPARTMENT_ORDER.forEach((dept) => {
            const deptMembers = TEAM_MEMBERS.filter(m => m.department === dept);
            const positions = calculateCardPositions(deptMembers, BAY_POSITIONS[dept]);
            deptMembers.forEach((member, i) => {
                data.push({ member, position: positions[i], color: DEPARTMENT_COLORS[member.department] });
            });
        });
        return data;
    }, []);

    const filteredIds = useMemo(() => new Set(filteredMembers.map(m => m.id)), [filteredMembers]);

    return (
        <>
            {cardData.map(({ member, position, color }) => {
                const isFiltered = filteredIds.has(member.id);
                const isHovered = hoveredMemberId === member.id;
                const rgb = hexToRgb(color);

                return (
                    <group key={member.id} position={position}>
                        <mesh
                            onPointerOver={() => setHoveredMemberId(member.id)}
                            onPointerOut={() => setHoveredMemberId(null)}
                            onClick={() => openModal(member)}
                        >
                            <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
                            <meshStandardMaterial
                                color={new THREE.Color(rgb[0], rgb[1], rgb[2])}
                                transparent
                                opacity={isFiltered ? (isHovered ? 1 : 0.8) : 0.2}
                                emissive={new THREE.Color(rgb[0], rgb[1], rgb[2])}
                                emissiveIntensity={isHovered ? 0.5 : 0.1}
                            />
                        </mesh>

                        {isHovered && (
                            <Html center position={[0, CARD_HEIGHT / 2 + 0.3, 0]} style={{ pointerEvents: 'none' }}>
                                <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-center whitespace-nowrap">
                                    <p className="text-white font-semibold text-sm">{member.name}</p>
                                    <p className="text-white/60 text-xs">{member.position}</p>
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </>
    );
}

function BayLabels() {
    return (
        <>
            {DEPARTMENT_ORDER.map((dept) => {
                const pos = BAY_POSITIONS[dept].clone();
                pos.y += 3;
                const color = DEPARTMENT_COLORS[dept];

                return (
                    <Html key={dept} position={pos} center>
                        <div
                            className="text-center px-4 py-2 rounded-full backdrop-blur-sm border"
                            style={{
                                backgroundColor: `${color}20`,
                                borderColor: `${color}40`,
                                color: color === '#FFFFFF' ? '#FFF' : color,
                            }}
                        >
                            <span className="font-bold text-lg">{dept}</span>
                        </div>
                    </Html>
                );
            })}
        </>
    );
}

function CameraController() {
    const { selectedDepartment, reducedMotion } = useTeamStore();
    const { camera } = useThree();

    useEffect(() => {
        if (!selectedDepartment || reducedMotion) return;

        const target = CAMERA_POSITIONS[selectedDepartment];
        gsap.to(camera.position, {
            x: target.position.x,
            y: target.position.y,
            z: target.position.z,
            duration: 1.5,
            ease: 'power2.inOut',
        });
    }, [selectedDepartment, camera, reducedMotion]);

    return <PerspectiveCamera makeDefault position={[0, 3, 15]} fov={60} />;
}

function FloorGrid() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, -0.5, 0]}>
            <planeGeometry args={[100, 50, 100, 50]} />
            <meshBasicMaterial color="#111112" wireframe transparent opacity={0.3} />
        </mesh>
    );
}

interface TeamCampusCanvasProps {
    className?: string;
}

export default function TeamCampusCanvas({ className }: TeamCampusCanvasProps) {
    const { webglEnabled } = useTeamStore();

    if (!webglEnabled) return null;

    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                dpr={[1, 2]}
            >
                <color attach="background" args={['#111112']} />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4285F4" />

                <CameraController />
                <FloorGrid />
                <TeamCards />
                <BayLabels />

                <fog attach="fog" args={['#111112', 30, 80]} />
            </Canvas>
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

// Node Component
const FlowNode = ({
    title,
    subtitle,
    children,
    className,
    width = 300,
    hasInput = true,
    hasOutput = true
}: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    className?: string;
    width?: number;
    hasInput?: boolean;
    hasOutput?: boolean;
}) => (
    <motion.div
        drag
        dragMomentum={false}
        className={`absolute bg-[#EAEAEA] rounded-3xl p-2 shadow-xl border border-white/50 backdrop-blur-sm ${className} cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform z-20`}
        style={{ width }}
    >
        {/* Header */}
        <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[9px] font-bold tracking-widest text-black/50 uppercase">
                {subtitle}
            </span>
            <span className="text-[9px] font-bold tracking-widest text-black uppercase">
                {title}
            </span>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-inner relative group">
            {children}

            {/* Handles */}
            {hasInput && (
                <div className="absolute top-1/2 -left-3 w-2.5 h-2.5 bg-white border-2 border-[#EAEAEA] rounded-full transform -translate-y-1/2 shadow-sm z-30" />
            )}
            {hasOutput && (
                <div className="absolute top-1/2 -right-3 w-2.5 h-2.5 bg-white border-2 border-[#EAEAEA] rounded-full transform -translate-y-1/2 shadow-sm z-30" />
            )}
        </div>
    </motion.div>
);

// Connection Component
const Connection = ({ start, end, control1, control2 }: { start: { x: number, y: number }, end: { x: number, y: number }, control1?: { x: number, y: number }, control2?: { x: number, y: number } }) => {
    // Default handles result in a simple S-curve if controls not provided
    const cp1 = control1 || { x: (start.x + end.x) / 2, y: start.y };
    const cp2 = control2 || { x: (start.x + end.x) / 2, y: end.y };

    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

    return (
        <path
            d={path}
            fill="none"
            stroke="#D4D4D4"
            strokeWidth="1.5"
            className="drop-shadow-sm pointer-events-none"
        />
    );
};

export function FlowVisual() {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="w-full relative z-0 mt-8 mb-20 px-4">
            {/* Main Container - Glassmorph */}
            <div
                ref={containerRef}
                className="relative w-full max-w-[1600px] mx-auto h-[700px] bg-gradient-to-b from-[#EAEAEA] to-[#CBD8CF] rounded-[40px] border border-white/60 shadow-2xl backdrop-blur-xl overflow-hidden"
            >

                {/* SVG Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* Rodin -> Stable Diffusion */}
                    <Connection
                        start={{ x: 300, y: 150 }}
                        end={{ x: 420, y: 300 }}
                        control1={{ x: 360, y: 150 }}
                        control2={{ x: 360, y: 300 }}
                    />

                    {/* Color Ref -> Stable Diffusion */}
                    <Connection
                        start={{ x: 300, y: 580 }}
                        end={{ x: 420, y: 400 }}
                        control1={{ x: 360, y: 580 }}
                        control2={{ x: 350, y: 400 }}
                    />

                    {/* Stable Diffusion -> Text Node */}
                    <Connection
                        start={{ x: 740, y: 350 }}
                        end={{ x: 860, y: 280 }}
                    />

                    {/* Text Node -> Minimax */}
                    <Connection
                        start={{ x: 1140, y: 280 }}
                        end={{ x: 1220, y: 350 }}
                    />

                    {/* Flux -> Minimax (Curve up) */}
                    <Connection
                        start={{ x: 1080, y: 650 }}
                        end={{ x: 1220, y: 500 }}
                        control1={{ x: 1150, y: 650 }}
                        control2={{ x: 1150, y: 500 }}
                    />
                </svg>

                {/* --- Left Column Nodes --- */}

                {/* 1. RODIN 2.0 (Top Left) */}
                <FlowNode
                    title="RODIN 2.0"
                    subtitle="3D"
                    className="top-[60px] left-[40px]"
                    width={260}
                    hasInput={false}
                >
                    <div className="h-[240px] bg-gray-300 relative overflow-hidden">
                        {/* Placeholder for 3D model */}
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-400 opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 transform rotate-12">🧊</div>
                        <Image
                            src="/rodin-placeholder.png"
                            alt="Rodin"
                            fill
                            className="object-cover opacity-0" // Using opacity 0 as we don't have the image, fallback to gradient
                        />
                    </div>
                </FlowNode>

                {/* 2. COLOR REFERENCE (Bottom Left) */}
                <FlowNode
                    title="REFERENCE"
                    subtitle="COLOR"
                    className="top-[500px] left-[40px]"
                    width={260}
                    hasInput={false}
                >
                    <div className="h-[140px] w-full bg-gradient-to-r from-[#1a1c2c] via-[#4a3b52] to-[#f2cfb3] relative overflow-hidden rounded-xl">
                        {/* Abstract wave mimic */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                </FlowNode>


                {/* --- Center Nodes --- */}

                {/* 3. STABLE DIFFUSION (Center Main) */}
                <FlowNode
                    title="STABLE DIFFUSION"
                    subtitle="IMAGE"
                    className="top-[80px] left-[420px] z-20"
                    width={320}
                >
                    <div className="h-[440px] bg-gray-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30" />
                        <div className="w-full h-full flex items-center justify-center text-6xl opacity-10">👤</div>
                    </div>
                </FlowNode>

                {/* 4. TEXT NODE (Center Right Top) */}
                <FlowNode
                    title=""
                    subtitle="TEXT"
                    className="top-[200px] left-[860px]"
                    width={280}
                >
                    <div className="p-4 bg-white min-h-[140px] flex items-center shadow-sm">
                        <p className="text-[11px] leading-relaxed text-gray-500 font-mono tracking-tight text-left">
                            a Great-Tailed Grackle bird is flying from the background and seating on the model's shoulder slowly and barely moves. the model looks at the camera. then bird flies away. cinematic.
                        </p>
                    </div>
                </FlowNode>

                {/* 5. FLUX PRO 1.1 (Center Right Bottom) */}
                <FlowNode
                    title="FLUX PRO 1.1"
                    subtitle="IMAGE"
                    className="top-[500px] left-[860px]"
                    width={220}
                >
                    <div className="h-[280px] bg-gray-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="w-full h-full flex items-center justify-center text-4xl">🐦‍⬛</div>
                    </div>
                </FlowNode>


                {/* --- Right Column Nodes --- */}

                {/* 6. MINIMAX VIDEO (Far Right) */}
                <FlowNode
                    title="MINIMAX VIDEO"
                    subtitle="VIDEO"
                    className="top-[60px] left-[1200px]"
                    width={340}
                    hasOutput={false}
                >
                    <div className="h-[500px] bg-gray-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 to-blue-200/40" />
                        <div className="w-full h-full flex items-center justify-center text-7xl opacity-10">🎥</div>
                    </div>
                </FlowNode>

            </div>
        </div>
    );
}

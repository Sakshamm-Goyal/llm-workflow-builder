'use client';

import React from 'react';
import {
    MousePointer2,
    Hand,
    Undo2,
    Redo2,
    ChevronDown
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

export default function FloatingToolbar() {
    const { zoomIn, zoomOut, getZoom } = useReactFlow();
    const [zoomLevel, setZoomLevel] = React.useState(100);

    // Update zoom level indicator
    React.useEffect(() => {
        const interval = setInterval(() => {
            setZoomLevel(Math.round(getZoom() * 100));
        }, 100);
        return () => clearInterval(interval);
    }, [getZoom]);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg p-1 shadow-xl z-50">
            {/* Tool Selection */}
            <div className="flex bg-[#0E0E10] rounded-md p-0.5">
                <button className="p-2 bg-[#E1E476] text-black rounded-sm transition-colors hover:brightness-95">
                    <MousePointer2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Hand className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-4 bg-[#2C2C2E]" />

            {/* History Controls */}
            <div className="flex gap-0.5">
                <button className="p-2 text-gray-400 hover:text-white rounded hover:bg-[#2C2C2E] transition-colors" title="Undo">
                    <Undo2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-white rounded hover:bg-[#2C2C2E] transition-colors" title="Redo">
                    <Redo2 className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-4 bg-[#2C2C2E]" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
                <button
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-200 hover:text-white rounded hover:bg-[#2C2C2E] transition-colors min-w-[60px] justify-center"
                    onClick={() => zoomIn()}
                >
                    {zoomLevel}%
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
            </div>
        </div>
    );
}

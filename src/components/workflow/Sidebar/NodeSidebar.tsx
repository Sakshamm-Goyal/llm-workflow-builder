'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Type, Download, Upload, Eye, FileDown, Image, Video, Crop, Wand2 } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow-store';

// Define the 6 nodes needed for your workflow
const QUICK_ACCESS_NODES = [
    { type: 'text', label: 'Prompt', icon: Type },
    { type: 'uploadImage', label: 'Import', icon: Download },
    { type: 'uploadVideo', label: 'Export', icon: Upload },
    { type: 'llm', label: 'Preview', icon: Eye },
    { type: 'uploadImage', label: 'Import Model', icon: FileDown },
    { type: 'llm', label: 'Import LoRA', icon: FileDown },
];

const TOOLBOX_NODES = [
    { type: 'llm', label: 'LLM', icon: Wand2, category: 'Processing' },
    { type: 'text', label: 'Text Input', icon: Type, category: 'Input' },
    { type: 'uploadImage', label: 'Image Upload', icon: Image, category: 'Input' },
    { type: 'uploadVideo', label: 'Video Upload', icon: Video, category: 'Input' },
    { type: 'cropImage', label: 'Crop Image', icon: Crop, category: 'Editing' },
    { type: 'extractFrame', label: 'Extract Frame', icon: FileDown, category: 'Processing' },
];

interface NodeCardProps {
    type: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const NodeCard = ({ type, label, icon: Icon }: NodeCardProps) => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors min-h-[80px]"
            onDragStart={(event) => onDragStart(event, type)}
            draggable
        >
            <Icon className="w-5 h-5 text-gray-700" />
            <span className="text-[11px] text-center font-medium text-gray-800 leading-tight">
                {label}
            </span>
        </div>
    );
};

interface NodeSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onRename?: () => void;
}

export default function NodeSidebar({ isOpen, onClose, onRename }: NodeSidebarProps) {
    const workflowName = useWorkflowStore((state) => state.workflowName);
    const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
    const [localName, setLocalName] = useState(workflowName);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLocalName(workflowName);
    }, [workflowName]);

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setWorkflowName(localName);
            (e.target as HTMLInputElement).blur();
            onRename?.();
        }
    };

    const handleNameBlur = () => {
        if (localName !== workflowName) {
            setWorkflowName(localName);
            onRename?.();
        }
    };

    if (!isOpen) return null;

    const filteredQuickAccess = QUICK_ACCESS_NODES.filter(node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredToolbox = TOOLBOX_NODES.filter(node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-[220px] bg-[#151517] flex flex-col h-full z-20 border-r border-[#2C2C2E]">
            {/* Project Name Header */}
            <div className="px-4 py-3 border-b border-[#2C2C2E]">
                <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleNameBlur}
                    className="w-full bg-transparent text-white font-medium text-sm focus:outline-none hover:bg-[#1C1C1E] px-2 py-1.5 rounded-lg transition-colors"
                    placeholder="untitled"
                />
            </div>

            {/* Search Header */}
            <div className="p-4 border-b border-[#2C2C2E]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-[11px] font-medium">
                    <span className="text-white">From</span>
                    <span className="text-[#E1E476] border-b border-[#E1E476] pb-0.5">Input</span>
                    <span className="text-gray-500">to</span>
                    <span className="text-gray-400 border-b border-gray-600 pb-0.5">Output</span>
                </div>
            </div>

            {/* Node Grid */}
            <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                {/* Quick Access Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white mb-3 px-1">Quick access</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {filteredQuickAccess.map((node, index) => (
                            <NodeCard
                                key={`quick-${index}`}
                                type={node.type}
                                label={node.label}
                                icon={node.icon}
                            />
                        ))}
                    </div>
                </div>

                {/* Toolbox Section */}
                <div>
                    <h3 className="text-sm font-semibold text-white mb-2 px-1">Toolbox</h3>
                    <p className="text-[10px] text-gray-500 mb-3 px-1">Editing</p>
                    <div className="grid grid-cols-2 gap-2">
                        {filteredToolbox.map((node, index) => (
                            <NodeCard
                                key={`toolbox-${index}`}
                                type={node.type}
                                label={node.label}
                                icon={node.icon}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

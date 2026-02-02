'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Crop, MoreHorizontal, Loader2 } from 'lucide-react';
import { CropImageNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';
import { NodeContextMenu } from '../ui/NodeContextMenu';
import { RenameModal } from '../ui/RenameModal';

function CropImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as CropImageNodeData;
    const { updateNodeData, deleteNode } = useWorkflowStore();
    const edges = useWorkflowStore((state) => state.edges);
    const { getNode } = useReactFlow();

    const isExecuting = nodeData.status === 'running';

    // Local State for Menu/Rename
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

    // Actions
    const handleDuplicate = () => {
        // Placeholder for duplication logic
        setIsMenuOpen(false);
    };

    const handleRename = (newName: string) => {
        updateNodeData(id, { label: newName });
        setIsRenameModalOpen(false);
    };

    const handleLock = () => {
        updateNodeData(id, { isLocked: !nodeData.isLocked });
        setIsMenuOpen(false);
    };

    const handleDelete = () => {
        deleteNode(id);
        setIsMenuOpen(false);
    };

    // Check which inputs are connected
    const hasImageConnection = edges.some(
        e => e.target === id && e.targetHandle === 'image_url'
    );

    const isParamConnected = (handleId: string) =>
        edges.some(e => e.target === id && e.targetHandle === handleId);

    return (
        <>
            <div
                className={`
                    group relative rounded-2xl min-w-[300px] shadow-2xl transition-all duration-200
                    ${selected ? 'bg-[#2B2B2F] ring-2 ring-inset ring-[#333337]' : 'bg-[#212126]'}
                    ${isExecuting ? 'ring-2 ring-[#C084FC]/50' : ''}
                    ${nodeData.status === 'error' ? 'ring-2 ring-red-500' : ''}
                `}
            >
                {/* Input Handles - Styled cleanly on the left */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
                    {/* Image Input */}
                    <div className="relative group/handle">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="image_url"
                            className={`!w-3 !h-3 !bg-[#2B2B2F] !border-[2px] !border-[#C084FC] transition-transform duration-200 hover:scale-125`}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 opacity-0 group-hover/handle:opacity-100 transition-opacity bg-black/80 px-1 rounded whitespace-nowrap pointer-events-none">
                            Image Source
                        </span>
                    </div>

                    {/* Params Inputs */}
                    {['x_percent', 'y_percent', 'width_percent', 'height_percent'].map((param) => (
                        <div key={param} className="relative group/handle">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={param}
                                className={`!w-3 !h-3 !bg-[#2B2B2F] !border-[2px] !border-blue-400 transition-transform duration-200 hover:scale-125`}
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 opacity-0 group-hover/handle:opacity-100 transition-opacity bg-black/80 px-1 rounded whitespace-nowrap pointer-events-none">
                                {param.replace('_percent', '').toUpperCase()} %
                            </span>
                        </div>
                    ))}
                </div>


                {/* Header */}
                <div className="flex items-center justify-between px-4.5 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                        <Crop className="w-4 h-4 text-gray-400" />
                        <span
                            className="font-normal text-gray-200 text-[16px]"
                            style={{ fontFamily: 'var(--font-dm-sans)' }}
                        >
                            {nodeData.label || 'Crop Image'}
                        </span>
                    </div>

                    <div className="relative">
                        <button
                            className="text-gray-500 hover:text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {isExecuting && <Loader2 className="w-4 h-4 text-[#C084FC] animate-spin absolute right-8 top-0.5" />}

                        {/* Context Menu */}
                        <NodeContextMenu
                            isOpen={isMenuOpen}
                            position={{ x: -10, y: -2 }}
                            onClose={() => setIsMenuOpen(false)}
                            onDuplicate={handleDuplicate}
                            onRename={() => {
                                setIsMenuOpen(false);
                                setIsRenameModalOpen(true);
                            }}
                            onLock={handleLock}
                            onDelete={handleDelete}
                            isLocked={nodeData.isLocked}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-4.5 pb-4 space-y-3">
                    {/* Status Indicator for Image */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Input:</span>
                        {hasImageConnection ? (
                            <span className="text-[#C084FC]">Connected</span>
                        ) : (
                            <span className="text-gray-600 italic">Waiting for image...</span>
                        )}
                    </div>

                    {/* Crop Parameters Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'xPercent', label: 'X %', handle: 'x_percent' },
                            { id: 'yPercent', label: 'Y %', handle: 'y_percent' },
                            { id: 'widthPercent', label: 'W %', handle: 'width_percent' },
                            { id: 'heightPercent', label: 'H %', handle: 'height_percent' }
                        ].map((field) => (
                            <div key={field.id} className="relative">
                                <label className="block text-[10px] text-gray-500 mb-1 ml-1">
                                    {field.label}
                                </label>
                                <input
                                    type="number"
                                    value={(nodeData as any)[field.id] ?? 0}
                                    onChange={(e) => updateNodeData(id, { [field.id]: Number(e.target.value) })}
                                    min={0}
                                    max={100}
                                    disabled={isExecuting || isParamConnected(field.handle) || nodeData.isLocked}
                                    className={`
                                        w-full bg-[#353539] rounded-lg px-3 py-2 text-sm text-gray-200 
                                        focus:outline-none focus:ring-1 focus:ring-[#55555A]
                                        ${isParamConnected(field.handle) ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Cropped Image Preview */}
                    {nodeData.croppedUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-[#353539]">
                            <img
                                src={nodeData.croppedUrl}
                                alt="Cropped result"
                                className="w-full h-32 object-cover"
                            />
                        </div>
                    )}

                    {/* Error Display */}
                    {nodeData.error && (
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <p className="text-xs text-red-400">{nodeData.error}</p>
                        </div>
                    )}
                </div>

                {/* Handle Container - Floating Output */}
                <div
                    className={`
                        absolute top-[60px] -right-4 w-8 h-8 rounded-full flex items-center justify-center
                        transition-colors duration-200 pointer-events-auto
                        ${selected ? 'bg-[#2B2B2F]' : 'bg-[#212126]'}
                    `}
                >
                    <div className="relative z-10 flex items-center justify-center">
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="output"
                            className={`!w-4 !h-4 !bg-[#2B2B2F] !border-[3.3px] !border-[#F59E0B] transition-transform duration-200 hover:scale-110 flex items-center justify-center`}
                        />
                    </div>
                </div>
            </div>

            <RenameModal
                isOpen={isRenameModalOpen}
                initialValue={nodeData.label || 'Crop Image'}
                onClose={() => setIsRenameModalOpen(false)}
                onRename={handleRename}
            />
        </>
    );
}

export const CropImageNode = memo(CropImageNodeComponent);

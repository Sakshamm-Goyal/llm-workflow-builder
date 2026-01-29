'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Crop, Loader2 } from 'lucide-react';
import { CropImageNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';

function CropImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as CropImageNodeData;
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const edges = useWorkflowStore((state) => state.edges);
    const isExecuting = nodeData.status === 'running';

    // Check which inputs are connected
    const hasImageConnection = edges.some(
        e => e.target === id && e.targetHandle === 'image_url'
    );

    const isParamConnected = (handleId: string) =>
        edges.some(e => e.target === id && e.targetHandle === handleId);

    return (
        <div
            className={`
        bg-gray-900 border-2 rounded-xl shadow-lg min-w-[280px]
        ${selected ? 'border-purple-500' : 'border-gray-700'}
        ${isExecuting ? 'animate-pulse ring-2 ring-purple-500/50' : ''}
        ${nodeData.status === 'error' ? 'border-red-500' : ''}
        ${nodeData.status === 'success' ? 'border-green-500' : ''}
      `}
        >
            {/* Input Handles */}
            <Handle
                type="target"
                position={Position.Left}
                id="image_url"
                style={{ top: '15%' }}
                className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !ring-2 !ring-purple-300"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="x_percent"
                style={{ top: '35%' }}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="y_percent"
                style={{ top: '50%' }}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="width_percent"
                style={{ top: '65%' }}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="height_percent"
                style={{ top: '80%' }}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-amber-600/10 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Crop className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-white text-sm">Crop Image</span>
                </div>
                {isExecuting && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Image input indicator */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Image</span>
                    <span className="text-red-400">*</span>
                    {hasImageConnection ? (
                        <span className="text-purple-400">• Connected</span>
                    ) : (
                        <span className="text-gray-500">• Not connected</span>
                    )}
                </div>

                {/* Crop Parameters */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            X %
                            {isParamConnected('x_percent') && <span className="text-purple-400">•</span>}
                        </label>
                        <input
                            type="number"
                            value={nodeData.xPercent ?? 0}
                            onChange={(e) => updateNodeData(id, { xPercent: Number(e.target.value) })}
                            min={0}
                            max={100}
                            className={`
                w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                ${isParamConnected('x_percent') ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                            disabled={isExecuting || isParamConnected('x_percent')}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            Y %
                            {isParamConnected('y_percent') && <span className="text-purple-400">•</span>}
                        </label>
                        <input
                            type="number"
                            value={nodeData.yPercent ?? 0}
                            onChange={(e) => updateNodeData(id, { yPercent: Number(e.target.value) })}
                            min={0}
                            max={100}
                            className={`
                w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                ${isParamConnected('y_percent') ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                            disabled={isExecuting || isParamConnected('y_percent')}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            Width %
                            {isParamConnected('width_percent') && <span className="text-purple-400">•</span>}
                        </label>
                        <input
                            type="number"
                            value={nodeData.widthPercent ?? 100}
                            onChange={(e) => updateNodeData(id, { widthPercent: Number(e.target.value) })}
                            min={0}
                            max={100}
                            className={`
                w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                ${isParamConnected('width_percent') ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                            disabled={isExecuting || isParamConnected('width_percent')}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            Height %
                            {isParamConnected('height_percent') && <span className="text-purple-400">•</span>}
                        </label>
                        <input
                            type="number"
                            value={nodeData.heightPercent ?? 100}
                            onChange={(e) => updateNodeData(id, { heightPercent: Number(e.target.value) })}
                            min={0}
                            max={100}
                            className={`
                w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                ${isParamConnected('height_percent') ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                            disabled={isExecuting || isParamConnected('height_percent')}
                        />
                    </div>
                </div>

                {/* Cropped Image Preview */}
                {nodeData.croppedUrl && (
                    <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2">Result:</p>
                        <img
                            src={nodeData.croppedUrl}
                            alt="Cropped result"
                            className="w-full h-32 object-cover rounded-lg"
                        />
                    </div>
                )}

                {/* Error Display */}
                {nodeData.error && (
                    <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-700">
                        <p className="text-sm text-red-400">{nodeData.error}</p>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
            />
        </div>
    );
}

export const CropImageNode = memo(CropImageNodeComponent);

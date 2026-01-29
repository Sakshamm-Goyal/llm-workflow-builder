'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Film, Loader2 } from 'lucide-react';
import { ExtractFrameNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';

function ExtractFrameNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as ExtractFrameNodeData;
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const edges = useWorkflowStore((state) => state.edges);
    const isExecuting = nodeData.status === 'running';

    // Check which inputs are connected
    const hasVideoConnection = edges.some(
        e => e.target === id && e.targetHandle === 'video_url'
    );
    const hasTimestampConnection = edges.some(
        e => e.target === id && e.targetHandle === 'timestamp'
    );

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
                id="video_url"
                style={{ top: '35%' }}
                className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white !ring-2 !ring-pink-300"
            />
            <Handle
                type="target"
                position={Position.Left}
                id="timestamp"
                style={{ top: '65%' }}
                className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-red-600/10 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-white text-sm">Extract Frame</span>
                </div>
                {isExecuting && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Video input indicator */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Video</span>
                    <span className="text-red-400">*</span>
                    {hasVideoConnection ? (
                        <span className="text-purple-400">• Connected</span>
                    ) : (
                        <span className="text-gray-500">• Not connected</span>
                    )}
                </div>

                {/* Timestamp */}
                <div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        Timestamp
                        {hasTimestampConnection && (
                            <span className="text-purple-400">• Connected</span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={nodeData.timestamp || '0'}
                        onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
                        placeholder="e.g., 10 or 50%"
                        className={`
              w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500
              ${hasTimestampConnection ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                        disabled={isExecuting || hasTimestampConnection}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Seconds (e.g., 10) or percentage (e.g., 50%)
                    </p>
                </div>

                {/* Extracted Frame Preview */}
                {nodeData.frameUrl && (
                    <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2">Extracted Frame:</p>
                        <img
                            src={nodeData.frameUrl}
                            alt="Extracted frame"
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
                className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
            />
        </div>
    );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);

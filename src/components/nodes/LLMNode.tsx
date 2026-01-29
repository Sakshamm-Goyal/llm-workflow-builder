'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Loader2, MoreHorizontal, Play } from 'lucide-react';
import { LLMNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';

const MODELS = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

function LLMNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as LLMNodeData;
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const setNodeStatus = useWorkflowStore((state) => state.setNodeStatus);
    const edges = useWorkflowStore((state) => state.edges);
    const isExecuting = nodeData.status === 'running';

    // Check which inputs are connected
    const hasSystemPromptConnection = edges.some(
        e => e.target === id && e.targetHandle === 'system_prompt'
    );
    const hasUserMessageConnection = edges.some(
        e => e.target === id && e.targetHandle === 'user_message'
    );
    const hasImagesConnection = edges.some(
        e => e.target === id && e.targetHandle === 'images'
    );

    const handleRunNode = async (e: React.MouseEvent) => {
        e.stopPropagation();
        // Trigger run for just this node
        // In a real app, this would call the execute API for just this node
        console.log('Run node:', id);
    };

    return (
        <div
            className={`
                bg-[#1C1C1E] rounded-2xl border min-w-[320px] max-w-[400px] shadow-xl transition-all
                ${selected ? 'border-[#E1E476]' : 'border-[#2C2C2E]'}
                ${isExecuting ? 'ring-2 ring-[#E1E476]/50' : ''}
                ${nodeData.status === 'error' ? 'border-red-500' : ''}
            `}
        >
            {/* Input Handles - Specific colors based on type */}
            <Handle
                type="target"
                position={Position.Left}
                id="system_prompt"
                style={{ top: '30%' }}
                className="!w-3 !h-3 !bg-[#A855F7] !border-2 !border-[#1C1C1E]" // Purple
            />
            <Handle
                type="target"
                position={Position.Left}
                id="user_message"
                style={{ top: '50%' }}
                className="!w-3 !h-3 !bg-[#A855F7] !border-2 !border-[#1C1C1E]" // Purple
            />
            <Handle
                type="target"
                position={Position.Left}
                id="images"
                style={{ top: '70%' }}
                className="!w-3 !h-3 !bg-[#EC4899] !border-2 !border-[#1C1C1E]" // Pink for images
            />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                        AI
                    </div>
                    <span className="font-medium text-gray-200 text-sm">{nodeData.label || 'LLM Generation'}</span>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Model Selector */}
                <div>
                    <select
                        value={nodeData.model || 'gemini-2.0-flash-exp'}
                        onChange={(e) => updateNodeData(id, { model: e.target.value })}
                        className="w-full bg-[#0E0E10] border border-[#2C2C2E] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-gray-500 appearance-none"
                        disabled={isExecuting}
                    >
                        {MODELS.map((model) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                </div>

                {/* Response Area (if exists) */}
                {nodeData.response ? (
                    <div className="p-3 bg-[#0E0E10] rounded-lg border border-[#2C2C2E] max-h-40 overflow-y-auto">
                        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {nodeData.response}
                        </p>
                    </div>
                ) : (
                    /* Prompt Inputs (only show if no response yet) */
                    <>
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={nodeData.userMessage || ''}
                                    onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
                                    placeholder="Enter your prompt here..."
                                    className="w-full bg-[#0E0E10] border border-[#2C2C2E] rounded-lg p-3 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 min-h-[80px]"
                                    disabled={isExecuting || hasUserMessageConnection}
                                />
                                {hasUserMessageConnection && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
                                        <span>Linked</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Status/Error */}
                {isExecuting && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating...</span>
                    </div>
                )}
                {nodeData.status === 'error' && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                        {nodeData.error}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 border-t border-[#2C2C2E] flex justify-end">
                <button
                    onClick={handleRunNode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#2C2C2E] text-white text-[10px] font-medium rounded-lg transition-all active:scale-95"
                >
                    <Play className="w-3 h-3 fill-current" />
                    Run Model
                </button>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                className="!w-3 !h-3 !bg-[#10B981] !border-2 !border-[#1C1C1E]" // Green
            />
        </div>
    );
}

export const LLMNode = memo(LLMNodeComponent);


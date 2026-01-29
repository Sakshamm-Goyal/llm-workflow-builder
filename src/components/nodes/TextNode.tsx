'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Type, MoreHorizontal } from 'lucide-react';
import { TextNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';

function TextNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as TextNodeData;
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const isExecuting = nodeData.status === 'running';

    return (
        <div
            className={`
                bg-[#1C1C1E] rounded-2xl border min-w-[320px] max-w-[400px] shadow-xl transition-all
                ${selected ? 'border-[#E1E476]' : 'border-[#2C2C2E]'}
                ${isExecuting ? 'ring-2 ring-[#E1E476]/50' : ''}
                ${nodeData.status === 'error' ? 'border-red-500' : ''}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold">
                        Tx
                    </div>
                    <span className="font-medium text-gray-200 text-sm">Text Input</span>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <textarea
                    value={nodeData.text || ''}
                    onChange={(e) => updateNodeData(id, { text: e.target.value, output: e.target.value })}
                    placeholder="Enter your text here..."
                    className="w-full bg-[#0E0E10] border border-[#2C2C2E] rounded-lg p-3 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 min-h-[120px]"
                    rows={4}
                    disabled={isExecuting}
                />
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

export const TextNode = memo(TextNodeComponent);

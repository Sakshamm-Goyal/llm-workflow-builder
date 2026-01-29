'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Image, Upload, X, MoreHorizontal } from 'lucide-react';
import { UploadImageNodeData } from '@/types/nodes';
import { useWorkflowStore } from '@/stores/workflow-store';
import { useDropzone } from 'react-dropzone';

function UploadImageNodeComponent({ id, data, selected }: NodeProps) {
    const nodeData = data as UploadImageNodeData;
    const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
    const isExecuting = nodeData.status === 'running';

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        // For now, create a local URL (Transloadit integration will be added later)
        const imageUrl = URL.createObjectURL(file);

        updateNodeData(id, {
            imageUrl,
            fileName: file.name,
            output: imageUrl,
            status: 'success',
        });
    }, [id, updateNodeData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        },
        maxFiles: 1,
        disabled: isExecuting,
    });

    const clearImage = () => {
        updateNodeData(id, {
            imageUrl: undefined,
            fileName: undefined,
            output: undefined,
            status: 'idle',
        });
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-[10px] font-bold">
                        Im
                    </div>
                    <span className="font-medium text-gray-200 text-sm">Upload Image</span>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {nodeData.imageUrl ? (
                    <div className="relative group">
                        <img
                            src={nodeData.imageUrl}
                            alt={nodeData.fileName || 'Uploaded image'}
                            className="w-full h-40 object-cover rounded-lg border border-[#2C2C2E]"
                        />
                        <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-400 mt-2 truncate">{nodeData.fileName}</p>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={`
                            border border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#0E0E10]
                            ${isDragActive ? 'border-pink-500 bg-pink-500/5' : 'border-[#2C2C2E] hover:border-gray-500'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-3">
                            <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                            {isDragActive ? 'Drop image here' : 'Click or drop image'}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">JPG, PNG, WebP</p>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                className="!w-3 !h-3 !bg-[#EC4899] !border-2 !border-[#1C1C1E]" // Pink
            />
        </div>
    );
}

export const UploadImageNode = memo(UploadImageNodeComponent);

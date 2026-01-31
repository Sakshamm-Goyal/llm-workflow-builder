import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Edit2, Lock, Trash2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface NodeContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onClose: () => void;
    onDuplicate: () => void;
    onRename: () => void;
    onLock: () => void;
    onDelete: () => void;
    isLocked?: boolean;
}

export function NodeContextMenu({
    isOpen,
    position,
    onClose,
    onDuplicate,
    onRename,
    onLock,
    onDelete,
    isLocked
}: NodeContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute z-50 w-32 bg-[#1C1C1E] border border-[#2B2B2F] rounded-sm shadow-2xl p-0.5 flex flex-col gap-0"
                style={{
                    top: position.y,
                    left: position.x
                }}
            >
                <MenuItem
                    icon={Copy}
                    label="Duplicate"
                    shortcut="ctrl+d"
                    onClick={onDuplicate}
                />
                <MenuItem
                    icon={Edit2}
                    label="Rename"
                    onClick={onRename}
                />
                <MenuItem
                    icon={Lock}
                    label={isLocked ? "Unlock" : "Lock"}
                    onClick={onLock}
                />
                <div className="h-[1px] bg-[#2B2B2F] my-0.5 mx-1" />
                <MenuItem
                    icon={Trash2}
                    label="Delete"
                    shortcut="delete / backspace"
                    onClick={onDelete}
                    variant="danger"
                />
            </motion.div>
        </AnimatePresence>
    );
}

interface MenuItemProps {
    icon: any;
    label: string;
    shortcut?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

function MenuItem({ icon: Icon, label, shortcut, onClick, variant = 'default' }: MenuItemProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`
                w-full flex items-center justify-between px-1 py-0.5 rounded-s text-[7px] transition-colors
                ${variant === 'danger'
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-gray-300 hover:bg-[#2B2B2F] hover:text-white'}
            `}
        >
            <span className="flex items-center gap-2.5">
                {/* <Icon className="w-4 h-4 opacity-70" />  User images don't show icons, just text. I will keep icons hidden or remove them if needed. 
                   Actually looking at the image: 
                   Text "Duplicate" ... "ctrl+d"
                   No visible icons in the provided screenshot!
                   I will remove the icons to match the design EXACTLY.
                */}
                {label}
            </span>
            {shortcut && (
                <span className="text-[7px] text-gray-500 font-medium font-sans">{shortcut}</span>
            )}
        </button>
    );
}

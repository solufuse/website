
import React from 'react';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import type { FileInfo, FileTreeNode } from '@/types';

interface FileNodeProps {
    node: FileTreeNode;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    isDropTarget: boolean;
    onClick: (node: FileInfo, e: React.MouseEvent) => void;
    onContextMenu: (node: FileInfo, e: React.MouseEvent) => void;
    onDragStart: (node: FileInfo, e: React.DragEvent) => void;
    onDragOver: (node: FileInfo, e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (node: FileInfo, e: React.DragEvent) => void;
}

const FileNode: React.FC<FileNodeProps> = React.memo(({
    node,
    level,
    isSelected,
    isExpanded,
    isDropTarget,
    onClick,
    onContextMenu,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
}) => {
    const isFolder = node.type === 'folder';

    let selectionClass = isSelected ? 'bg-primary/20' : 'hover:bg-muted';
    if (isDropTarget) {
        selectionClass = 'bg-blue-500/50'; // Highlight drop target
    }

    return (
        <div
            draggable
            className={`flex items-center p-1 rounded-md cursor-pointer ${selectionClass}`}
            style={{ paddingLeft: `${level * 24 + 4}px` }}
            onClick={(e) => onClick(node, e)}
            onContextMenu={(e) => onContextMenu(node, e)}
            onDragStart={(e) => onDragStart(node, e)}
            onDragOver={(e) => onDragOver(node, e)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(node, e)}
        >
            {isFolder ? (
                <>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
                    <Folder className="h-5 w-5 mr-2 text-yellow-500" />
                </>
            ) : (
                <File className="h-5 w-5 mr-2 ml-6 text-gray-400" />
            )}
            <span className="truncate text-sm">{node.filename}</span>
        </div>
    );
});

export default FileNode;

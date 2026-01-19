
import React from 'react';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import type { FileInfo, FileTreeNode } from '@/types';

interface FileNodeProps {
    node: FileTreeNode;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    onClick: (node: FileInfo, e: React.MouseEvent) => void;
    onContextMenu: (node: FileInfo, e: React.MouseEvent) => void;
}

const FileNode: React.FC<FileNodeProps> = React.memo(({
    node,
    level,
    isSelected,
    isExpanded,
    onClick,
    onContextMenu,
}) => {
    const isFolder = node.type === 'folder';

    const selectionClass = isSelected ? 'bg-primary/20' : 'hover:bg-muted';

    return (
        <div
            className={`flex items-center p-1 rounded-md cursor-pointer ${selectionClass}`}
            style={{ paddingLeft: `${level * 24 + 4}px` }}
            onClick={(e) => onClick(node, e)}
            onContextMenu={(e) => onContextMenu(node, e)}
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
                // Indent files to align with folder content
                <File className="h-5 w-5 mr-2 ml-6 text-gray-400" />
            )}
            <span className="truncate text-sm">{node.filename}</span>
        </div>
    );
});

export default FileNode;

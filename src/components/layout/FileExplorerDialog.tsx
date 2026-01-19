
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listFiles, deleteItems, renameItem, downloadItems } from '@/api/files';
import type { FileInfo, FileTreeNode } from '@/types';
import type { ProjectDetail } from '@/types/types_projects';
import { buildFileTree } from '@/utils/fileTree'; 
import FileNode from './FileNode';
import FileContextMenu from './FileContextMenu';

interface FileExplorerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentProject: ProjectDetail | null;
}

const backgroundFileInfo: FileInfo = {
    path: '.',
    filename: '',
    type: 'folder',
    size: 0,
    uploaded_at: '',
    content_type: ''
};

const FileExplorerDialog: React.FC<FileExplorerDialogProps> = ({ isOpen, onClose, projectId, currentProject }) => {
    const [allItems, setAllItems] = useState<FileInfo[]>([]);
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['.']));

    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number, y: number }, file: FileInfo | null }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        file: null,
    });

    const fetchAllFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all files from the root recursively
            const fileList = await listFiles('.', { projectId, recursive: true });
            setAllItems(fileList);
            const tree = buildFileTree(fileList);
            setFileTree(tree);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load files.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchAllFiles();
        }
    }, [isOpen, projectId, fetchAllFiles]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedPaths(new Set());
            setExpandedFolders(new Set(['.']));
            setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, file: null });
        }
    }, [isOpen]);

    // When allItems updates, rebuild the tree
    useEffect(() => {
        const tree = buildFileTree(allItems);
        setFileTree(tree);
    }, [allItems]);

    const handleItemClick = (item: FileInfo, e: React.MouseEvent) => {
        const isSelected = selectedPaths.has(item.path);
        if (e.ctrlKey) {
            const newSelection = new Set(selectedPaths);
            isSelected ? newSelection.delete(item.path) : newSelection.add(item.path);
            setSelectedPaths(newSelection);
        } else {
            setSelectedPaths(new Set([item.path]));
        }

        if (item.type === 'folder') {
            const newExpanded = new Set(expandedFolders);
            expandedFolders.has(item.path) ? newExpanded.delete(item.path) : newExpanded.add(item.path);
            setExpandedFolders(newExpanded);
        }
    };

    const handleContextMenu = (file: FileInfo, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedPaths.has(file.path) && file.path !== '.') {
            setSelectedPaths(new Set([file.path]));
        }
        setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, file });
    };
    
    const handlers = {
        handleNewFile: (path: string) => alert(`New file in: ${path}`),
        handleNewFolder: (path: string) => alert(`New folder in: ${path}`),
        handleBulkDownload: async () => {
            if (selectedPaths.size > 0) {
               await downloadItems(Array.from(selectedPaths), { projectId });
            }
        },
        handleSingleDownload: async (file: FileInfo) => {
            await downloadItems([file.path], { projectId });
        },
        handleBulkDelete: async () => {
            if (selectedPaths.size === 0) return;
            if (confirm(`Are you sure you want to delete ${selectedPaths.size} item(s)?`)) {
                await deleteItems(Array.from(selectedPaths), { projectId });
                fetchAllFiles(); // Refresh the entire tree
                setSelectedPaths(new Set());
            }
        },
        handleRename: async (file: FileInfo) => {
            const newName = prompt("Enter new name:", file.filename);
            if (newName && newName !== file.filename) {
                const newPath = file.path.substring(0, file.path.lastIndexOf('/') + 1) + newName;
                await renameItem(file.path, newPath, { projectId });
                fetchAllFiles(); // Refresh
            }
        },
        handleRefresh: () => fetchAllFiles(),
    };

    const renderTree = (nodes: FileTreeNode[], level = 0) => {
        return nodes.map(node => (
            <React.Fragment key={node.path}>
                <FileNode 
                    node={node} 
                    level={level} 
                    isSelected={selectedPaths.has(node.path)}
                    isExpanded={expandedFolders.has(node.path)}
                    onClick={handleItemClick}
                    onContextMenu={handleContextMenu}
                />
                {expandedFolders.has(node.path) && node.children.length > 0 &&
                    renderTree(node.children, level + 1)
                }
            </React.Fragment>
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>File Explorer</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(backgroundFileInfo, e)}>
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-destructive">Error: {error}</p>}
                    {!loading && !error && renderTree(fileTree)}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
            <FileContextMenu
                isOpen={contextMenu.isOpen}
                onOpenChange={(isOpen) => setContextMenu({ ...contextMenu, isOpen })}
                position={contextMenu.position}
                file={contextMenu.file}
                selectedPaths={selectedPaths}
                currentProject={currentProject}
                projectId={projectId}
                handlers={handlers}
            />
        </Dialog>
    );
};

export default FileExplorerDialog;

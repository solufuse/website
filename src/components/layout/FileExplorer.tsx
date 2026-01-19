
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { listFiles, deleteItems, renameItem, downloadItems, uploadFiles } from '@/api/files';
import type { FileInfo, FileTreeNode } from '@/types';
import type { ProjectDetail } from '@/types/types_projects';
import { buildFileTree } from '@/utils/fileTree'; 
import FileNode from './FileNode';
import FileContextMenu from './FileContextMenu';
import { X, Upload } from 'lucide-react'; // Import Upload icon
import { DropZone } from './DropZone';

interface FileExplorerProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentProject: ProjectDetail | null;
    className?: string;
    refreshTrigger?: any;
}

const backgroundFileInfo: FileInfo = {
    path: '.',
    filename: '',
    type: 'folder',
    size: 0,
    uploaded_at: '',
    content_type: ''
};

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, onClose, projectId, currentProject, className, refreshTrigger }) => {
    const [allItems, setAllItems] = useState<FileInfo[]>([]);
    const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['.']));
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number, y: number }, file: FileInfo | null }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        file: null,
    });

    const fetchAllFiles = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
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
    }, [isOpen, projectId, fetchAllFiles, refreshTrigger]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedPaths(new Set());
            setExpandedFolders(new Set(['.']));
            setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, file: null });
        }
    }, [isOpen]);

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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && projectId) {
            setIsUploading(true);
            setError(null);
            try {
                await uploadFiles(Array.from(files), { projectId });
                await fetchAllFiles();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to upload files.');
            } finally {
                setIsUploading(false);
            }
        }
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
                fetchAllFiles();
                setSelectedPaths(new Set());
            }
        },
        handleRename: async (file: FileInfo) => {
            const newName = prompt("Enter new name:", file.filename);
            if (newName && newName !== file.filename) {
                const newPath = file.path.substring(0, file.path.lastIndexOf('/') + 1) + newName;
                await renameItem(file.path, newPath, { projectId });
                fetchAllFiles();
            }
        },
        handleRefresh: () => fetchAllFiles(),
        handleUpload: () => fileInputRef.current?.click()
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsDraggingFile(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);

        const files = e.dataTransfer.files;
        if (files.length > 0 && projectId) {
            setIsUploading(true);
            setError(null);
            try {
                await uploadFiles(Array.from(files), { projectId });
                await fetchAllFiles();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to upload files.');
            } finally {
                setIsUploading(false);
            }
        }
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
        <div 
            className={`relative h-full bg-background border-l transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${className}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <DropZone isDraggingFile={isDraggingFile} />
            <div className="flex justify-between items-center p-2 border-b">
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                <Button variant="ghost" size="icon" onClick={handlers.handleUpload} title="Upload Files">
                    <Upload className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">File Explorer</h3>
                <Button variant="ghost" size="icon" onClick={onClose} title="Close Panel">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2" onContextMenu={(e) => handleContextMenu(backgroundFileInfo, e)}>
                {loading && <p className="text-center">Loading file list...</p>}
                {isUploading && <p className="text-center">Uploading files...</p>}
                {error && <p className="text-destructive p-2">Error: {error}</p>}
                {!loading && !error && !isUploading && renderTree(fileTree)}
            </div>
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
        </div>
    );
};

export default FileExplorer;

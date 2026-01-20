
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResizableBox, ResizableBoxProps } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { Button } from "@/components/ui/button";
import { listFiles, deleteItems, renameItem, downloadItems, uploadFiles, moveItem } from '@/api/files';
import type { FileInfo, FileTreeNode } from '@/types';
import type { ProjectDetail } from '@/types/types_projects';
import { buildFileTree } from '@/utils/fileTree'; 
import FileNode from './FileNode';
import FileContextMenu from './FileContextMenu';
import { X, Upload, RefreshCw } from 'lucide-react';
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
    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<FileInfo | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const [width, setWidth] = useState(() => {
        if (typeof window === 'undefined') return 400;
        const savedWidth = localStorage.getItem('fileExplorerWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 400;
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const resizeStartWidthRef = useRef<number>(0);

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
        const rootNode: FileTreeNode = {
            ...backgroundFileInfo,
            filename: currentProject?.name || 'Project Root',
            children: tree,
        };
        setFileTree([rootNode]);
    }, [allItems, currentProject]);

    const onResizeStart: ResizableBoxProps['onResizeStart'] = () => {
        resizeStartWidthRef.current = width;
    };

    const onResize: ResizableBoxProps['onResize'] = (_e, data) => {
        const proposedWidth = data.size.width;
        const initialWidth = resizeStartWidthRef.current;
        const newWidth = 2 * initialWidth - proposedWidth;

        if (newWidth >= 250 && newWidth <= 1200) { // Keep constraints
            setWidth(newWidth);
        }
    };

    const onResizeStop: ResizableBoxProps['onResizeStop'] = (_e, data) => {
        const proposedWidth = data.size.width;
        const initialWidth = resizeStartWidthRef.current;
        let finalWidth = 2 * initialWidth - proposedWidth;

        // Clamp the final value to be safe
        if (finalWidth < 250) finalWidth = 250;
        if (finalWidth > 1200) finalWidth = 1200;

        setWidth(finalWidth);
        localStorage.setItem('fileExplorerWidth', String(finalWidth));
    };

    const handleItemClick = (item: FileInfo, e: React.MouseEvent) => {
        const isSelected = selectedPaths.has(item.path);
        if (e.ctrlKey || e.metaKey) {
            const newSelection = new Set(selectedPaths);
            isSelected ? newSelection.delete(item.path) : newSelection.add(item.path);
            setSelectedPaths(newSelection);
        } else {
            setSelectedPaths(new Set([item.path]));
        }

        if (item.type === 'folder') {
            const newExpanded = new Set(expandedFolders);
            if (expandedFolders.has(item.path)) {
                newExpanded.delete(item.path);
            } else {
                newExpanded.add(item.path);
            }
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

    const handleDragStart = (item: FileInfo, e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent, item?: FileInfo) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isExternal = e.dataTransfer.types.includes('Files');
        if (isExternal) {
            setIsDragging(true);
        }

        if (draggedItem && item && item.type === 'folder' && item.path !== draggedItem.path && !item.path.startsWith(draggedItem.path + '/')) {
            setDropTarget(item.path);
        } else if (item && item.type !== 'folder') {
            setDropTarget(null);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDropTarget(null);
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent, targetItem: FileInfo) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);
        setIsDragging(false);
        
        if (e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0 && projectId) {
                setIsUploading(true);
                setError(null);
                try {
                    const uploadPath = targetItem.type === 'folder' ? targetItem.path : '.';
                    await uploadFiles(files, { projectId });

                    if (uploadPath !== '.') {
                        await Promise.all(files.map(file => 
                            moveItem(file.name, uploadPath, { projectId })
                        ));
                    }
                    await fetchAllFiles();
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to upload and move files.');
                } finally {
                    setIsUploading(false);
                }
            }
            return;
        }
    
        const internalDraggedItem = JSON.parse(e.dataTransfer.getData('application/json') || 'null');
        if (internalDraggedItem) {
            if (!targetItem || internalDraggedItem.path === targetItem.path || targetItem.type !== 'folder' || targetItem.path.startsWith(internalDraggedItem.path + '/')) {
                setDraggedItem(null);
                return;
            }
    
            try {
                setLoading(true);
                await moveItem(internalDraggedItem.path, targetItem.path, { projectId });
                setExpandedFolders(prev => new Set(prev).add(targetItem.path));
                await fetchAllFiles();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to move item.');
            } finally {
                setLoading(false);
                setDraggedItem(null);
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
                    isDropTarget={dropTarget === node.path}
                    onClick={handleItemClick}
                    onContextMenu={handleContextMenu}
                    onDragStart={(node, e) => handleDragStart(node, e)}
                    onDragOver={(node, e) => handleDragOver(e, node)}
                    onDragLeave={(e) => handleDragLeave(e)}
                    onDrop={(node, e) => handleDrop(e, node)}
                />
                {expandedFolders.has(node.path) && node.children.length > 0 &&
                    renderTree(node.children, level + 1)
                }
            </React.Fragment>
        ));
    };

    if (!isOpen) return null;

    return (
        <ResizableBox
            width={width}
            height={Infinity}
            axis="x"
            resizeHandles={['w']} // Use the west handle
            minConstraints={[250, Infinity]}
            maxConstraints={[1200, Infinity]}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeStop={onResizeStop}
            handle={<div className="absolute top-0 -left-1 w-2 h-full cursor-col-resize group z-10"><div className="w-full h-full bg-transparent group-hover:bg-primary/20 transition-colors duration-200"></div></div>}
            className={`relative flex flex-col h-full bg-background border-l ${className}`}
        >
            <div 
                className="flex flex-col h-full"
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, backgroundFileInfo)}
            >
                <DropZone isDraggingFile={isDragging} />
                <div className="flex justify-between items-center p-2 border-b">
                    <div className="flex items-center flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={handlers.handleUpload} title="Upload Files">
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handlers.handleRefresh} title="Refresh Files">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    <h3 className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap mx-2">File Explorer</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} title="Close Panel" className="flex-shrink-0">
                        <X className="h-4 w-4" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                </div>
                <div className="flex-1 overflow-y-auto p-2" 
                    onContextMenu={(e) => handleContextMenu(backgroundFileInfo, e)}
                    onDragOver={(e) => handleDragOver(e, backgroundFileInfo)}
                    onDrop={(e) => handleDrop(e, backgroundFileInfo)}
                >
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
        </ResizableBox>
    );
};

export default FileExplorer;

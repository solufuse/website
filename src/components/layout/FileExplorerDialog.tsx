
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listFiles, deleteItems, renameItem, downloadItems } from '@/api/files';
import { Folder, File, ArrowLeft } from 'lucide-react';
import type { FileInfo } from '@/types';
import type { ProjectDetail } from '@/types/types_projects';
import FileContextMenu from './FileContextMenu'; // Import the new context menu

interface FileExplorerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentProject: ProjectDetail | null;
}

// Dummy FileInfo for the background context menu
const backgroundFileInfo: FileInfo = {
    path: '.',
    filename: '',
    type: 'folder',
    size: 0,
    uploaded_at: '',
    content_type: ''
};

const FileExplorerDialog: React.FC<FileExplorerDialogProps> = ({ isOpen, onClose, projectId, currentProject }) => {
    const [items, setItems] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState('.');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number, y: number }, file: FileInfo | null }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        file: null,
    });

    const fetchFiles = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const fileList = await listFiles(path, { projectId });
            setItems(fileList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load files.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchFiles(currentPath);
        }
    }, [isOpen, projectId, currentPath, fetchFiles]);

    // Reset state when closing the dialog
    useEffect(() => {
        if (!isOpen) {
            setCurrentPath('.');
            setSelectedPaths(new Set());
            setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, file: null });
        }
    }, [isOpen]);

    const handleItemClick = (item: FileInfo, e: React.MouseEvent) => {
        // Handle selection logic
        const isSelected = selectedPaths.has(item.path);
        if (e.ctrlKey) {
            const newSelection = new Set(selectedPaths);
            if (isSelected) {
                newSelection.delete(item.path);
            } else {
                newSelection.add(item.path);
            }
            setSelectedPaths(newSelection);
        } else if (e.shiftKey) {
            // Implement shift-click selection if desired
        } else {
            if (item.type === 'folder') {
                setCurrentPath(item.path);
                setSelectedPaths(new Set()); // Clear selection when navigating
            } else {
                // Handle single file click (e.g., open for viewing)
                setSelectedPaths(new Set([item.path]));
            }
        }
    };

    const handleBackClick = () => {
        if (currentPath === '.') return;
        const newPath = currentPath.split('/').slice(0, -1).join('/') || '.';
        setCurrentPath(newPath);
        setSelectedPaths(new Set());
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileInfo) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent parent context menu from opening
        setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, file });
    };

    // --- Context Menu Handlers ---
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
            if (selectedPaths.size > 0) {
                if (confirm(`Are you sure you want to delete ${selectedPaths.size} items?`)) {
                    await deleteItems(Array.from(selectedPaths), { projectId });
                    fetchFiles(currentPath);
                    setSelectedPaths(new Set());
                }
            }
        },
        handleRename: async (file: FileInfo) => {
            const newName = prompt("Enter new name:", file.filename);
            if (newName && newName !== file.filename) {
                const newPath = file.path.substring(0, file.path.lastIndexOf('/') + 1) + newName;
                await renameItem(file.path, newPath, { projectId });
                fetchFiles(currentPath);
            }
        },
        handleRefresh: () => fetchFiles(currentPath),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {currentPath !== '.' && (
                            <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        File Explorer: {currentPath}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(e, backgroundFileInfo)}>
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-destructive">Error: {error}</p>}
                    {!loading && !error && (
                        <ul className="space-y-1">
                            {items.map((item, index) => (
                                <li key={index} 
                                    className={`flex items-center p-2 rounded-md cursor-pointer ${selectedPaths.has(item.path) ? 'bg-primary/20' : 'hover:bg-muted'}`}
                                    onClick={(e) => handleItemClick(item, e)}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                >
                                    {item.type === 'folder' ? <Folder className="h-5 w-5 mr-3" /> : <File className="h-5 w-5 mr-3" />}
                                    <span>{item.filename}</span>
                                </li>
                            ))}
                        </ul>
                    )}
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

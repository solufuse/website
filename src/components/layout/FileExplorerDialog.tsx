
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listFiles } from '@/api/files';
import { Folder, File, ArrowLeft } from 'lucide-react';
import type { FileInfo } from '@/types';

interface FileExplorerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

const FileExplorerDialog: React.FC<FileExplorerDialogProps> = ({ isOpen, onClose, projectId }) => {
    const [items, setItems] = useState<FileInfo[]>([]);
    const [currentPath, setCurrentPath] = useState('.');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && projectId) {
            fetchFiles(currentPath);
        }
    }, [isOpen, projectId, currentPath]);

    const fetchFiles = async (path: string) => {
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
    };

    const handleItemClick = (item: FileInfo) => {
        if (item.type === 'folder') {
            setCurrentPath(item.path);
        }
        // Vous pouvez ajouter une logique pour les fichiers ici, par exemple, afficher le contenu
    };

    const handleBackClick = () => {
        if (currentPath === '.') return;
        const newPath = currentPath.split('/').slice(0, -1).join('/') || '.';
        setCurrentPath(newPath);
    };

    // Réinitialiser le chemin lorsque la boîte de dialogue est fermée
    useEffect(() => {
        if (!isOpen) {
            setCurrentPath('.');
        }
    }, [isOpen]);

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
                <div className="flex-1 overflow-y-auto">
                    {loading && <p>Loading...</p>}
                    {error && <p className="text-destructive">Error: {error}</p>}
                    {!loading && !error && (
                        <ul className="space-y-1">
                            {items.map((item, index) => (
                                <li key={index} 
                                    className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                                    onClick={() => handleItemClick(item)}>
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
        </Dialog>
    );
};

export default FileExplorerDialog;

import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { FileInfo } from '@/types';
import type { ProjectDetail } from '@/types/types_projects';

// Adjusted type to allow for separators
type MenuItemDef = {
    label?: string; // Optional for separators
    action?: () => void; // Optional for separators
    separator?: boolean;
    danger?: boolean;
    shortcut?: string;
};

// Generates the list of menu items based on the context
const getContextMenuItems = (
    file: FileInfo,
    selectedPaths: Set<string>,
    currentProject: ProjectDetail | null,
    projectId: string | undefined,
    handlers: ContextMenuProps['handlers']
): MenuItemDef[] => {
    const canWrite = !!projectId || !currentProject;
    const selectionSize = selectedPaths.size;

    // Context menu for the root directory background
    if (file.path === '.') {
        return canWrite
            ? [
                { label: 'New File', action: () => handlers.handleNewFile('.') },
                { label: 'New Folder', action: () => handlers.handleNewFolder('.') },
                { label: 'Refresh', action: handlers.handleRefresh, shortcut: 'F5' },
              ]
            : [{ label: 'Refresh', action: handlers.handleRefresh, shortcut: 'F5' }];
    }

    // --- Multi-selection Menu ---
    if (selectionSize > 1 && selectedPaths.has(file.path)) {
        const items: MenuItemDef[] = [];
        items.push({ label: `Download ${selectionSize} items`, action: handlers.handleBulkDownload });
        if (canWrite) {
            items.push({ separator: true });
            items.push({ label: `Delete ${selectionSize} items`, action: handlers.handleBulkDelete, danger: true, shortcut: 'Del' });
        }
        return items;
    }

    // --- Single-selection Menu ---
    const items: MenuItemDef[] = [];

    // For folders
    if (file.type === 'folder' && canWrite) {
        items.push({ label: 'New File', action: () => handlers.handleNewFile(file.path) });
        items.push({ label: 'New Folder', action: () => handlers.handleNewFolder(file.path) });
        items.push({ separator: true });
    }

    // For all items
    items.push({ label: 'Copy Filename', action: () => navigator.clipboard.writeText(file.filename) });
    items.push({ label: 'Copy Path', action: () => navigator.clipboard.writeText(file.path) });

    if (canWrite) {
        items.push({ label: 'Rename', action: () => handlers.handleRename(file), shortcut: 'F2' });
    }

    items.push({ label: 'Download', action: () => handlers.handleSingleDownload(file) });

    if (canWrite) {
        items.push({ separator: true });
        items.push({ label: 'Delete', action: () => handlers.handleBulkDelete(), danger: true, shortcut: 'Del' });
    }

    items.push({ separator: true });
    items.push({ label: 'Refresh', action: handlers.handleRefresh, shortcut: 'F5' });

    return items;
};


type ContextMenuProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    position: { x: number; y: number };
    file: FileInfo | null;
    selectedPaths: Set<string>;
    currentProject: ProjectDetail | null;
    projectId: string | undefined;
    handlers: {
        handleNewFile: (path: string) => void;
        handleNewFolder: (path: string) => void;
        handleBulkDownload: () => void;
        handleSingleDownload: (file: FileInfo) => void;
        handleBulkDelete: () => void;
        handleRename: (file: FileInfo) => void;
        handleRefresh: () => void;
    };
};

const FileContextMenu: React.FC<ContextMenuProps> = ({ isOpen, onOpenChange, position, file, ...props }) => {
    if (!file) return null;

    const menuItems = getContextMenuItems(file, props.selectedPaths, props.currentProject, props.projectId, props.handlers);

    const handleSelect = (action?: () => void) => {
        if(action) action();
        onOpenChange(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
            <DropdownMenuContent
                style={{ position: 'fixed', top: position.y, left: position.x }}
                onClick={(e) => e.stopPropagation()}
                // Prevent focus from being stolen from the dialog, allowing shortcuts to work
                onFocusOutside={(e) => e.preventDefault()}
            >
                {menuItems.map((item, index) => {
                    if (item.separator) {
                        return <DropdownMenuSeparator key={index} />;
                    }
                    return (
                        <DropdownMenuItem
                            key={index}
                            onClick={() => handleSelect(item.action)}
                            disabled={!item.action}
                            className={item.danger ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : ""}
                        >
                            {item.label}
                            {item.shortcut && <span className="ml-auto pl-4 text-xs tracking-widest text-muted-foreground">{item.shortcut}</span>}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FileContextMenu;

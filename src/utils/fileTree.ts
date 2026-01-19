
import type { FileInfo, FileTreeNode } from '@/types';

/**
 * Builds a file tree from a flat list of file information.
 * 
 * This function organizes a flat array of file paths into a hierarchical tree structure.
 * It creates a virtual root and correctly places each file and folder in its respective
 * parent, creating parent folder nodes if they don't exist.
 *
 * @param files - An array of FileInfo objects, each representing a file or folder.
 * @returns An array of FileTreeNode objects representing the root-level items.
 */
export function buildFileTree(files: FileInfo[]): FileTreeNode[] {
    const nodeMap = new Map<string, FileTreeNode>();
    const virtualRoot: FileTreeNode = { 
        path: '.', 
        filename: '.', 
        type: 'folder', 
        children: [],
        size: 0,
        uploaded_at: '',
        content_type: ''
    };
    nodeMap.set('.', virtualRoot);

    // First pass: create all nodes and place them in the map
    for (const file of files) {
        // Ensure a node for the file exists
        if (!nodeMap.has(file.path)) {
            nodeMap.set(file.path, { ...file, children: [] });
        }

        const parts = file.path.split('/');
        let currentPath = '';

        // Create parent directories if they don't exist
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!nodeMap.has(currentPath)) {
                const folderNode: FileTreeNode = {
                    path: currentPath,
                    filename: part,
                    type: 'folder',
                    children: [],
                    size: 0,
                    uploaded_at: '',
                    content_type: ''
                };
                nodeMap.set(currentPath, folderNode);
            }
        }
    }

    // Second pass: link children to their parents
    for (const node of nodeMap.values()) {
        if (node.path === '.') continue;

        const parentPath = node.path.substring(0, node.path.lastIndexOf('/')) || '.';
        const parentNode = nodeMap.get(parentPath);

        if (parentNode && parentNode.children.every(child => child.path !== node.path)) {
            parentNode.children.push(node);
        }
    }
    
    // Sort nodes alphabetically, with folders first
    const sortNodes = (nodes: FileTreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.filename.localeCompare(b.filename);
        });
        // Recursively sort children
        nodes.forEach(node => {
            if (node.children.length > 0) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(virtualRoot.children);
    return virtualRoot.children;
}

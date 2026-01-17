
import { FileInfo } from '../types';

export interface FileTreeNode extends FileInfo {
  children: FileTreeNode[];
  content?: string;
  isDirty?: boolean;
}

export function buildFileTree(files: FileInfo[]): FileTreeNode[] {
    const nodeMap = new Map<string, FileTreeNode>();
    const virtualRoot: FileTreeNode = {
        filename: '', path: '', type: 'folder', children: [],
        size: 0, uploaded_at: '', content_type: 'directory'
    };
    nodeMap.set('', virtualRoot);

    const sortedFiles = [...files].sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    for (const file of sortedFiles) {
        const parts = file.path.split('/');
        let parentNode = virtualRoot;

        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            
            let directoryNode = nodeMap.get(currentPath);
            
            if (!directoryNode) {
                directoryNode = {
                    filename: part,
                    path: currentPath,
                    type: 'folder',
                    children: [],
                    size: 0, uploaded_at: '', content_type: 'directory',
                };
                nodeMap.set(currentPath, directoryNode);
                parentNode.children.push(directoryNode);
            }
            parentNode = directoryNode;
        }

        const fileNode: FileTreeNode = { ...file, children: [] };
        
        const existingNode = nodeMap.get(file.path);
        if (existingNode) {
            Object.assign(existingNode, fileNode);
        } else {
            nodeMap.set(file.path, fileNode);
            parentNode.children.push(fileNode);
        }
    }
    
    const sortNodes = (nodes: FileTreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.filename.localeCompare(b.filename);
        });
        nodes.forEach(node => {
            if (node.children.length > 0) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(virtualRoot.children);
    return virtualRoot.children;
}

import React from 'react';
import { Icons } from '@/components/icons';

interface DropZoneProps {
    isDraggingFile: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ isDraggingFile }) => {
    if (!isDraggingFile) {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-primary/10 flex flex-col justify-center items-center pointer-events-none z-10">
            <Icons.Download className="w-10 h-10 text-primary mb-4"/>
            <p className="text-primary font-semibold">Drop files to upload</p>
        </div>
    );
};

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectorProps {
    model: string;
    onModelChange: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, onModelChange }) => {
    return (
        <div className="flex items-center gap-2">
            <span>Model:</span>
            <Select onValueChange={onModelChange} defaultValue={model}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default ModelSelector;

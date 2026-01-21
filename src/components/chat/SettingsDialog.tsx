
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiKey, saveApiKey, getModelName, saveModelName } from '@/utils/apiKeyManager';
import { ModeToggle } from './ModeToggle';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  useEffect(() => {
    if (isOpen) {
      const storedKey = getApiKey();
      if (storedKey) {
        setApiKeyInput(storedKey);
      }
      const storedModel = getModelName();
      if (storedModel) {
        setSelectedModel(storedModel);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiKey(apiKeyInput);
    saveModelName(selectedModel);
    alert('Settings saved!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div>
            <label htmlFor="api-key" className="text-sm font-medium">
              Gemini API Key
            </label>
            <Input
              id="api-key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your API key"
              type="password"
              className="mt-2"
            />
            <p className='text-xs text-muted-foreground mt-2'>You can get your API key from <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className='underline'>https://aistudio.google.com/api-keys</a>.</p>
          </div>

          <div>
            <label htmlFor="ai-model" className="text-sm font-medium">
              AI Model
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="ai-model" className="mt-2">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-3-pro-preview">gemini-3-pro-preview</SelectItem>
                <SelectItem value="gemini-3-flash-preview">gemini-3-flash-preview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ModeToggle />
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;

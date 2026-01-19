
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiKey, saveApiKey } from '@/utils/apiKeyManager'; // Import the new functions
import { ModeToggle } from './ModeToggle';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedKey = getApiKey(); // Use the getter to load the key
      if (storedKey) {
        setApiKeyInput(storedKey);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiKey(apiKeyInput); // Use the setter to save the key
    alert('API Key saved!');
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


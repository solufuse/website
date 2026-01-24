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
import { updateUserApiKey } from '@/api/users'; 
import { useAuthContext } from '@/context/authcontext'; 
import { ModeToggle } from './ModeToggle';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// A list of available AI models.
const AVAILABLE_MODELS = [
    "gemini-3-pro-preview", 
    "gemini-3-flash-preview",
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const { user, refreshUser, updatePreferredModel } = useAuthContext();
  // Initialize model from user context or fall back to a default
  const [selectedModel, setSelectedModel] = useState(user?.preferred_model || AVAILABLE_MODELS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const apiKeyIsSet = user?.api_key_set || false;

  // When the dialog opens or the user context changes, update the selected model.
  useEffect(() => {
    if (isOpen) {
        setStatusMessage(null); 
        setApiKeyInput('');
        // Set the model from the user's profile if available
        setSelectedModel(user?.preferred_model || AVAILABLE_MODELS[1]);
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    let closeDialog = true;

    try {
        // This will hold promises for all the async operations.
        const updatePromises: Promise<any>[] = [];

        // 1. Update API key if a new one is entered.
        if (apiKeyInput.trim()) {
            updatePromises.push(updateUserApiKey(apiKeyInput.trim()));
        }

        // 2. Update preferred model if it has changed from what's in the context.
        if (selectedModel !== user?.preferred_model) {
            updatePromises.push(updatePreferredModel(selectedModel));
        }

        // If there are no updates to perform, just show a success message.
        if (updatePromises.length === 0) {
            setStatusMessage("No changes to save.");
            setTimeout(() => onClose(), 1500);
            return;
        }

        await Promise.all(updatePromises);
        
        setStatusMessage("Settings updated successfully!");
        
        // Refresh user context to get the latest state from the backend.
        await refreshUser();

    } catch (error) {
        closeDialog = false;
        console.error("Failed to save settings:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setStatusMessage(`Error: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        if (closeDialog) {
            setTimeout(() => onClose(), 1500);
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings here. Your API key is stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div>
            <label htmlFor="api-key" className="text-sm font-medium flex items-center">
              Gemini API Key
              {apiKeyIsSet && <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full bg-green-100 text-green-800">Key is Set</span>}
            </label>
            <Input
              id="api-key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={apiKeyIsSet ? "Enter a new key to update" : "Enter your API key"}
              type="password"
              className="mt-2"
            />
            <p className='text-xs text-muted-foreground mt-2'>Get your API key from <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className='underline'>Google AI Studio</a>.</p>
          </div>

          <div>
            <label htmlFor="ai-model" className="text-sm font-medium">Default AI Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="ai-model" className="mt-2">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground mt-2'>This is the default model for new chats.</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ModeToggle />
          </div>

          {statusMessage && (
            <p className={`text-sm ${statusMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {statusMessage}
            </p>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;

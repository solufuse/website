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
import { getModelName, saveModelName } from '@/utils/apiKeyManager';
import { updateUserApiKey } from '@/api/users'; 
import { useAuthContext } from '@/context/authcontext'; 
import { ModeToggle } from './ModeToggle';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { user, refreshUser } = useAuthContext();

  const apiKeyIsSet = user?.api_key_set || false;

  useEffect(() => {
    if (isOpen) {
        setStatusMessage(null); // Reset message on open
        setApiKeyInput(''); // Clear input on open for security
        const storedModel = getModelName();
        if (storedModel) {
            setSelectedModel(storedModel);
        }
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    let keyUpdateSuccess = true;

    if (apiKeyInput) {
        try {
            const response = await updateUserApiKey(apiKeyInput);
            console.log('API key update response:', response);
            // The user object will be updated via the AuthContext, so we just need to trigger a refresh.
        } catch (error) {
            keyUpdateSuccess = false;
            console.error("Failed to save API key:", error);
            if (error instanceof Error) {
                setStatusMessage(`Error: ${error.message}`);
            } else {
                setStatusMessage("An unknown error occurred while saving the API key.");
            }
        }
    }

    // Always save the model locally
    saveModelName(selectedModel);

    setIsLoading(false);

    if (keyUpdateSuccess) {
        setStatusMessage(apiKeyInput ? "API Key has been securely saved." : "Model has been saved.");
        // Refresh user data to get the latest `api_key_set` status
        await refreshUser();
        // Optionally close the dialog on success after a short delay
        setTimeout(() => {
            onClose();
        }, 1500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your application settings here. Your API key is stored securely and is never exposed to the client.
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

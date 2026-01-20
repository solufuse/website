
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createProject } from '@/api/projects';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProjectId: string) => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Reset state when the dialog is closed or opened
    if (isOpen) {
      setProjectId('');
      setProjectName('');
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Project ID validation
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(projectId)) {
      newErrors.projectId = 'ID must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens.';
    }

    // Project Name validation
    if (projectName.trim().length < 1 || projectName.trim().length > 20) {
      newErrors.projectName = 'Name must be between 1 and 20 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProject = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const newProject = await createProject({ 
        id: projectId, 
        name: projectName.trim(), 
        description: '' 
      });
      onProjectCreated(newProject.id);
      onClose();
    } catch (err) {
      const apiError = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrors({ general: `Failed to create project: ${apiError}` });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="projectId"
            placeholder="Project ID (e.g., my-awesome-project)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isLoading}
          />
          {errors.projectId && <p className="text-sm text-red-500">{errors.projectId}</p>}
          
          <Input
            id="projectName"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isLoading}
          />
          {errors.projectName && <p className="text-sm text-red-500">{errors.projectName}</p>}

          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;

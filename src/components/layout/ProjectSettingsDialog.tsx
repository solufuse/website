
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectDetail } from '@/types/types_projects';

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onProjectDeleted: () => void;
}

const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
  isOpen,
  onClose,
  project,
  onProjectDeleted,
}) => {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteProject = async () => {
    if (confirmation !== project.name) {
      setError('Project name does not match.');
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      // Here you would call your API to delete the project
      // For example: await deleteProject(project.id);
      console.log(`Deleting project ${project.name}`);
      onProjectDeleted();
      onClose();
    } catch (err) {
      setError('Failed to delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>
            To delete the project, please type its name below to confirm.
          </p>
          <Input
            id="projectName"
            placeholder="Project name"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={isDeleting}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteProject}
            disabled={isDeleting || confirmation !== project.name}
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettingsDialog;

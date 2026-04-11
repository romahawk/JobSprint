import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import type { Application } from "../types";
import { ExternalLink, Trash2 } from "lucide-react";

interface ApplicationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  application: Application | null;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}

export function ApplicationDetailsModal({
  open,
  onClose,
  application,
  onEdit,
  onDelete,
}: ApplicationDetailsModalProps) {
  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{application.company}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {application.company} — {application.role} will be removed.
                    You will have 7 seconds to undo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    onClick={() => { onDelete(application.id); onClose(); }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Role
            </h4>
            <p className="text-base text-neutral-900 dark:text-neutral-100">
              {application.role}
            </p>
          </div>

          {application.location && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Location
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100">
                {application.location}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Type
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100 capitalize">
                {application.type}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Priority
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100 capitalize">
                {application.priority}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Status
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100 capitalize">
                {application.status.replace("_", " ")}
              </p>
            </div>
          </div>

          {application.salary && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Salary Range
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100">
                {application.salary}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Date Applied
            </h4>
            <p className="text-base text-neutral-900 dark:text-neutral-100">
              {new Date(application.dateApplied).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {application.referral && (
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Referral
              </span>
            </div>
          )}

          {application.jobLink && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Job Link
              </h4>
              <a
                href={application.jobLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Job Posting
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {application.notes && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Notes
              </h4>
              <p className="text-base text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                {application.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(application)}>Edit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

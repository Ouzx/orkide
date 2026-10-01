import { m } from "@orkide/i18n/messages";
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
} from "@orkide/ui/components/alert-dialog";
import { Button } from "@orkide/ui/components/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { useAdmin } from "../context.tsx";

/** Icon button that asks for confirmation before running `onConfirm`. */
export const ConfirmDelete = ({
  name,
  onConfirm,
  disabled = false,
}: {
  readonly name: string;
  readonly onConfirm: () => void;
  readonly disabled?: boolean;
}) => {
  const { options } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={disabled}
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${m.admin_delete({}, options)} — ${name}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.admin_delete_confirm_title({ name }, options)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {m.admin_delete_confirm_body({}, options)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.admin_cancel({}, options)}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {m.admin_delete({}, options)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

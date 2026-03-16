import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Application, PipelineStatus } from "../types";
import { PipelineColumn } from "./PipelineColumn";
import { STATUS_LABELS, STATUS_ORDER } from "../utils";

interface PipelineBoardProps {
  applications: Application[];
  onUpdateStatus: (id: string, status: PipelineStatus) => void;
  onCardClick: (app: Application) => void;
}

export function PipelineBoard({
  applications,
  onUpdateStatus,
  onCardClick,
}: PipelineBoardProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
        {STATUS_ORDER.map((status) => (
          <PipelineColumn
            key={status}
            status={status as PipelineStatus}
            title={STATUS_LABELS[status]}
            applications={applications.filter((app) => app.status === status)}
            onUpdateStatus={onUpdateStatus}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DndProvider>
  );
}

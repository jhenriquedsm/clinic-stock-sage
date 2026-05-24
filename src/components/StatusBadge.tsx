import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  type StatusValidade,
  type StatusEstoque,
  STATUS_VALIDADE_LABEL,
  STATUS_ESTOQUE_LABEL,
} from "@/lib/medicamento-utils";

const VAL_STYLES: Record<StatusValidade, string> = {
  vencido: "bg-destructive text-destructive-foreground hover:bg-destructive",
  vence_7: "bg-destructive/15 text-destructive border border-destructive/30",
  vence_30: "bg-warning/20 text-warning-foreground border border-warning/40",
  ok: "bg-success/15 text-success border border-success/30",
};

const VAL_ICONS: Record<StatusValidade, React.ElementType> = {
  vencido: XCircle,
  vence_7: AlertTriangle,
  vence_30: Clock,
  ok: CheckCircle2,
};

export function ValidadeBadge({ status }: { status: StatusValidade }) {
  const Icon = VAL_ICONS[status];
  return (
    <Badge variant="secondary" className={`gap-1 font-medium ${VAL_STYLES[status]}`}>
      <Icon className="h-3 w-3" />
      {STATUS_VALIDADE_LABEL[status]}
    </Badge>
  );
}

const EST_STYLES: Record<StatusEstoque, string> = {
  zerado: "bg-destructive text-destructive-foreground",
  baixo: "bg-warning/20 text-warning-foreground border border-warning/40",
  normal: "bg-success/15 text-success border border-success/30",
};

export function EstoqueBadge({ status }: { status: StatusEstoque }) {
  return (
    <Badge variant="secondary" className={`font-medium ${EST_STYLES[status]}`}>
      {STATUS_ESTOQUE_LABEL[status]}
    </Badge>
  );
}

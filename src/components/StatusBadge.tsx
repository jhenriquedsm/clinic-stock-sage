import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  type StatusValidade,
  type StatusEstoque,
  STATUS_VALIDADE_LABEL,
  STATUS_ESTOQUE_LABEL,
} from "@/lib/medicamento-utils";

const VAL_STYLES: Record<StatusValidade, string> = {
  vencido: "bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/20",
  vence_7: "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15",
  vence_30: "bg-warning/15 text-warning border border-warning/25 hover:bg-warning/20",
  ok: "bg-success/15 text-success border border-success/25 hover:bg-success/20",
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
    <Badge variant="secondary" className={`gap-1 font-semibold ${VAL_STYLES[status]}`}>
      <Icon className="h-3 w-3" />
      {STATUS_VALIDADE_LABEL[status]}
    </Badge>
  );
}

const EST_STYLES: Record<StatusEstoque, string> = {
  zerado: "bg-destructive/15 text-destructive border border-destructive/25",
  baixo: "bg-warning/15 text-warning border border-warning/25",
  normal: "bg-success/15 text-success border border-success/25",
};

export function EstoqueBadge({ status }: { status: StatusEstoque }) {
  return (
    <Badge variant="secondary" className={`font-semibold ${EST_STYLES[status]}`}>
      {STATUS_ESTOQUE_LABEL[status]}
    </Badge>
  );
}

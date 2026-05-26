import { differenceInDays, parseISO } from "date-fns";

export type StatusValidade = "vencido" | "vence_7" | "vence_30" | "ok";
export type StatusEstoque = "zerado" | "baixo" | "normal";

export function getStatusValidade(dataValidade: string): StatusValidade {
  const dias = differenceInDays(parseISO(dataValidade), new Date());
  if (dias < 0) return "vencido";
  if (dias <= 7) return "vence_7";
  if (dias <= 30) return "vence_30";
  return "ok";
}

export function getStatusEstoque(atual: number, minima: number): StatusEstoque {
  if (atual <= 0) return "zerado";
  if (atual < minima) return "baixo";
  return "normal";
}

export const STATUS_VALIDADE_LABEL: Record<StatusValidade, string> = {
  vencido: "Vencido",
  vence_7: "Vence em 7 dias",
  vence_30: "Vence em 30 dias",
  ok: "Válido",
};

export const STATUS_ESTOQUE_LABEL: Record<StatusEstoque, string> = {
  zerado: "Sem estoque",
  baixo: "Estoque baixo",
  normal: "Normal",
};

export const CATEGORIAS = [
  "Antibiótico",
  "Analgésico",
  "Anti-inflamatório",
  "Antialérgico",
  "Antipirético",
  "Antidiabético / Anti-obesidade",
  "Hormônio",
  "Vitamina",
  "Vacina",
  "Anestésico",
  "Soro",
  "Outro",
];

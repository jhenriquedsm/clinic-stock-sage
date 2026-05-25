import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStatusValidade } from "@/lib/medicamento-utils";
import { ValidadeBadge } from "@/components/StatusBadge";
import { format, parseISO, differenceInDays } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Medicamento = Tables<"medicamentos">;
type MovimentacaoComNome = Tables<"movimentacoes"> & {
  medicamentos: { nome: string; numero_lote: string } | null;
};

export const Route = createFileRoute("/_app/relatorios")({ component: RelatoriosPage });

function csvDownload(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function RelatoriosPage() {
  const { data: meds = [] } = useQuery({
    queryKey: ["medicamentos"],
    queryFn: async (): Promise<Medicamento[]> => {
      const { data, error } = await supabase.from("medicamentos").select("*").order("data_validade");
      if (error) throw error;
      return data;
    },
  });

  const { data: movs = [] } = useQuery({
    queryKey: ["movimentacoes"],
    queryFn: async (): Promise<MovimentacaoComNome[]> => {
      const { data, error } = await supabase.from("movimentacoes").select("*, medicamentos(nome, numero_lote)").order("data_movimentacao", { ascending: false }).limit(500);
      if (error) throw error;
      return data as MovimentacaoComNome[];
    },
  });

  const vencidos = useMemo(() => meds.filter((m) => getStatusValidade(m.data_validade) === "vencido"), [meds]);
  const grupos = useMemo(() => {
    const g7: Medicamento[] = [], g15: Medicamento[] = [], g30: Medicamento[] = [];
    meds.forEach((m) => {
      const d = differenceInDays(parseISO(m.data_validade), new Date());
      if (d >= 0 && d <= 7) g7.push(m);
      else if (d > 7 && d <= 15) g15.push(m);
      else if (d > 15 && d <= 30) g30.push(m);
    });
    return { g7, g15, g30 };
  }, [meds]);
  const estoqueBaixo = useMemo(() => meds.filter((m) => m.quantidade_atual <= m.quantidade_minima), [meds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Relatórios de estoque e validade</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Imprimir</Button>
      </div>

      <RelatorioSection
        title={`Medicamentos Vencidos (${vencidos.length})`}
        rows={vencidos}
        onExport={() => csvDownload("vencidos.csv", vencidos.map((m) => ({ nome: m.nome, lote: m.numero_lote, validade: m.data_validade, quantidade: m.quantidade_atual })))}
      />
      <RelatorioSection title={`Vencendo em 7 dias (${grupos.g7.length})`} rows={grupos.g7}
        onExport={() => csvDownload("vence-7-dias.csv", grupos.g7.map((m) => ({ nome: m.nome, lote: m.numero_lote, validade: m.data_validade, quantidade: m.quantidade_atual })))} />
      <RelatorioSection title={`Vencendo em 8-15 dias (${grupos.g15.length})`} rows={grupos.g15}
        onExport={() => csvDownload("vence-15-dias.csv", grupos.g15.map((m) => ({ nome: m.nome, lote: m.numero_lote, validade: m.data_validade, quantidade: m.quantidade_atual })))} />
      <RelatorioSection title={`Vencendo em 16-30 dias (${grupos.g30.length})`} rows={grupos.g30}
        onExport={() => csvDownload("vence-30-dias.csv", grupos.g30.map((m) => ({ nome: m.nome, lote: m.numero_lote, validade: m.data_validade, quantidade: m.quantidade_atual })))} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Estoque Abaixo do Mínimo ({estoqueBaixo.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => csvDownload("estoque-baixo.csv", estoqueBaixo.map((m) => ({ nome: m.nome, lote: m.numero_lote, atual: m.quantidade_atual, minimo: m.quantidade_minima })))}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          {estoqueBaixo.length === 0 ? <p className="text-sm text-muted-foreground py-4">Nenhum.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Medicamento</TableHead><TableHead>Lote</TableHead><TableHead className="text-right">Atual</TableHead><TableHead className="text-right">Mínimo</TableHead></TableRow></TableHeader>
              <TableBody>
                {estoqueBaixo.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{m.numero_lote}</TableCell>
                    <TableCell className="text-right">{m.quantidade_atual}</TableCell>
                    <TableCell className="text-right">{m.quantidade_minima}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico de Movimentações (últimas 500)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => csvDownload("movimentacoes.csv", movs.map((m: any) => ({ data: m.data_movimentacao, medicamento: m.medicamentos?.nome, tipo: m.tipo, quantidade: m.quantidade, motivo: m.motivo, responsavel: m.responsavel })))}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Medicamento</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
            <TableBody>
              {movs.slice(0, 50).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{format(parseISO(m.data_movimentacao), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>{m.medicamentos?.nome ?? "—"}</TableCell>
                  <TableCell><span className={`text-xs font-medium px-2 py-0.5 rounded ${m.tipo === "entrada" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{m.tipo}</span></TableCell>
                  <TableCell className="text-right">{m.quantidade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.motivo ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RelatorioSection({ title, rows, onExport }: { title: string; rows: Medicamento[]; onExport: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={onExport} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground py-4">Nenhum medicamento nesta faixa.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Lote</TableHead><TableHead>Validade</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="font-mono text-xs">{m.numero_lote}</TableCell>
                  <TableCell>{format(parseISO(m.data_validade), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-right">{m.quantidade_atual}</TableCell>
                  <TableCell><ValidadeBadge status={getStatusValidade(m.data_validade)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

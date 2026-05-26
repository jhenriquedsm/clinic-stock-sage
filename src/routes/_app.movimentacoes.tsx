import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type MedicamentoResumo = Pick<Tables<"medicamentos">, "id" | "nome" | "numero_lote" | "quantidade_atual">;
type MovimentacaoComNome = Tables<"movimentacoes"> & {
  medicamentos: { nome: string; numero_lote: string } | null;
};

export const Route = createFileRoute("/_app/movimentacoes")({ component: MovimentacoesPage });

function MovimentacoesPage() {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [medId, setMedId] = useState("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const [filterMed, setFilterMed] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");

  const { data: meds = [] } = useQuery({
    queryKey: ["medicamentos"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<MedicamentoResumo[]> => {
      const { data, error } = await supabase.from("medicamentos").select("id, nome, numero_lote, quantidade_atual").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: movs = [] } = useQuery({
    queryKey: ["movimentacoes"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<MovimentacaoComNome[]> => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*, medicamentos(nome, numero_lote)")
        .order("data_movimentacao", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as MovimentacaoComNome[];
    },
  });

  const filteredMovs = useMemo(() => movs.filter((m) => {
    if (filterMed !== "all" && m.medicamento_id !== filterMed) return false;
    if (filterTipo !== "all" && m.tipo !== filterTipo) return false;
    return true;
  }), [movs, filterMed, filterTipo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!medId) { toast.error("Selecione um medicamento"); return; }
    if (quantidade < 1) { toast.error("Quantidade inválida"); return; }
    setSaving(true);

    const { error } = await supabase.rpc("registrar_movimentacao", {
      p_medicamento_id: medId,
      p_tipo: tipo,
      p_quantidade: quantidade,
      p_motivo: motivo || null,
      p_responsavel: responsavel || null,
      p_observacoes: obs || null,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }

    toast.success(`${tipo === "entrada" ? "Entrada" : "Saída"} registrada`);
    setMedId(""); setQuantidade(1); setMotivo(""); setResponsavel(""); setObs("");
    qc.invalidateQueries({ queryKey: ["movimentacoes"] });
    qc.invalidateQueries({ queryKey: ["medicamentos"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Registre entradas e saídas de medicamentos</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Nova movimentação</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={tipo === "entrada" ? "default" : "outline"} onClick={() => setTipo("entrada")} className="gap-2">
                  <ArrowDownCircle className="h-4 w-4" /> Entrada
                </Button>
                <Button type="button" variant={tipo === "saida" ? "default" : "outline"} onClick={() => setTipo("saida")} className="gap-2">
                  <ArrowUpCircle className="h-4 w-4" /> Saída
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Medicamento *</Label>
              <Select value={medId} onValueChange={setMedId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {meds.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} — Lote {m.numero_lote} (estoque: {m.quantidade_atual})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade *</Label>
              <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={tipo === "entrada" ? "Compra, doação…" : "Uso paciente, descarte, vencimento…"} />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Registrando…" : "Registrar movimentação"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={filterMed} onValueChange={setFilterMed}>
              <SelectTrigger><SelectValue placeholder="Medicamento" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Todos os medicamentos</SelectItem>
                {meds.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem movimentações.</TableCell></TableRow>
                ) : filteredMovs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(parseISO(m.data_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{m.medicamentos?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${m.tipo === "entrada" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.quantidade}</TableCell>
                    <TableCell className="text-sm">{m.motivo ?? "—"}</TableCell>
                    <TableCell className="text-sm">{m.responsavel ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

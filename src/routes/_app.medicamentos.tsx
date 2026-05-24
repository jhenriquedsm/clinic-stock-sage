import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStatusValidade, getStatusEstoque, CATEGORIAS } from "@/lib/medicamento-utils";
import { ValidadeBadge, EstoqueBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { MedicamentoFormDialog } from "@/components/MedicamentoFormDialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/medicamentos")({ component: MedicamentosPage });

const PAGE_SIZE = 10;

function MedicamentosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterVal, setFilterVal] = useState<string>("all");
  const [filterEst, setFilterEst] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: meds = [], isLoading } = useQuery({
    queryKey: ["medicamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicamentos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return meds.filter((m) => {
      if (s && !`${m.nome} ${m.principio_ativo ?? ""} ${m.numero_lote}`.toLowerCase().includes(s)) return false;
      if (filterCat !== "all" && m.categoria !== filterCat) return false;
      if (filterVal !== "all" && getStatusValidade(m.data_validade) !== filterVal) return false;
      if (filterEst !== "all" && getStatusEstoque(m.quantidade_atual, m.quantidade_minima) !== filterEst) return false;
      return true;
    });
  }, [meds, search, filterCat, filterVal, filterEst]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("medicamentos").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("Medicamento excluído"); qc.invalidateQueries({ queryKey: ["medicamentos"] }); }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medicamentos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} medicamento(s)</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpenForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Medicamento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar nome, lote, princípio ativo…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filterCat} onValueChange={(v) => { setFilterCat(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterVal} onValueChange={(v) => { setFilterVal(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Validade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as validades</SelectItem>
                <SelectItem value="ok">Válido</SelectItem>
                <SelectItem value="vence_30">Vence em 30 dias</SelectItem>
                <SelectItem value="vence_7">Vence em 7 dias</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEst} onValueChange={(v) => { setFilterEst(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Estoque" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estoques</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="zerado">Zerado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
                ) : pageItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum medicamento encontrado.</TableCell></TableRow>
                ) : pageItems.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.nome}</div>
                      {m.concentracao && <div className="text-xs text-muted-foreground">{m.concentracao} • {m.apresentacao}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.numero_lote}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.categoria ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{m.quantidade_atual}</TableCell>
                    <TableCell>{format(parseISO(m.data_validade), "dd/MM/yyyy")}</TableCell>
                    <TableCell><ValidadeBadge status={getStatusValidade(m.data_validade)} /></TableCell>
                    <TableCell><EstoqueBadge status={getStatusEstoque(m.quantidade_atual, m.quantidade_minima)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpenForm(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MedicamentoFormDialog open={openForm} onOpenChange={setOpenForm} medicamento={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir medicamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todas as movimentações relacionadas também serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

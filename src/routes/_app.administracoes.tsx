import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, Syringe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdministracaoFormDialog } from "@/components/AdministracaoFormDialog";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_app/administracoes")({ component: AdministracoesPage });

const PAGE_SIZE = 10;

type AdministracaoRow = Tables<"administracoes"> & {
  medicamentos: Pick<Tables<"medicamentos">, "nome" | "concentracao"> | null;
};

function AdministracoesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: administracoes = [], isLoading } = useQuery({
    queryKey: ["administracoes"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("administracoes")
        .select("*, medicamentos(nome, concentracao)")
        .order("data_administracao", { ascending: false });
      if (error) throw error;
      return data as AdministracaoRow[];
    },
  });

  const { data: medicamentos = [] } = useQuery({
    queryKey: ["medicamentos"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("medicamentos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return administracoes;
    return administracoes.filter((a) =>
      a.paciente_nome.toLowerCase().includes(s) ||
      (a.medicamentos?.nome ?? "").toLowerCase().includes(s)
    );
  }, [administracoes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("administracoes").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Registro removido. O estoque não foi restaurado automaticamente.");
      qc.invalidateQueries({ queryKey: ["administracoes"] });
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administrações</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} registro(s)</p>
        </div>
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Administração
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar paciente ou medicamento…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dose Aplicada</TableHead>
                  <TableHead>Via</TableHead>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</TableCell>
                  </TableRow>
                ) : pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Syringe className="h-8 w-8 opacity-30" />
                        <span>Nenhuma administração registrada.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pageItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.paciente_nome}</TableCell>
                    <TableCell>
                      <div>{a.medicamentos?.nome ?? "—"}</div>
                      {a.medicamentos?.concentracao && (
                        <div className="text-xs text-muted-foreground">{a.medicamentos.concentracao}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {Number(a.dose_aplicada).toLocaleString("pt-BR")} {a.unidade_dose}
                      <div className="text-xs text-muted-foreground">
                        {a.unidades_consumidas} unid. deduzida{a.unidades_consumidas !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.via_administracao ?? "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {format(parseISO(a.data_administracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.responsavel ?? "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Excluir registro de administração" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      <AdministracaoFormDialog open={openForm} onOpenChange={setOpenForm} medicamentos={medicamentos} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de administração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove apenas o registro clínico. O estoque <strong>não será restaurado automaticamente</strong> — se necessário, adicione a devolução manualmente em Movimentações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

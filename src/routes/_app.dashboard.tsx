import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, AlertTriangle, Clock, XCircle, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStatusValidade, getStatusEstoque } from "@/lib/medicamento-utils";
import { ValidadeBadge, EstoqueBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Medicamento = Tables<"medicamentos">;
type MovimentacaoComNome = Tables<"movimentacoes"> & {
  medicamentos: { nome: string } | null;
};

export const Route = createFileRoute("/_app/dashboard")({ component: DashboardPage });

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

function DashboardPage() {
  const { data: meds = [] } = useQuery({
    queryKey: ["medicamentos"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<Medicamento[]> => {
      const { data, error } = await supabase.from("medicamentos").select("*").order("data_validade");
      if (error) throw error;
      return data;
    },
  });

  const { data: movs = [] } = useQuery({
    queryKey: ["movimentacoes", "recent"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<MovimentacaoComNome[]> => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*, medicamentos(nome)")
        .order("data_movimentacao", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as MovimentacaoComNome[];
    },
  });

  const stats = {
    total: meds.length,
    criticos: meds.filter((m) => m.quantidade_atual < m.quantidade_minima).length,
    vencendo: meds.filter((m) => {
      const s = getStatusValidade(m.data_validade);
      return s === "vence_7" || s === "vence_30";
    }).length,
    vencidos: meds.filter((m) => getStatusValidade(m.data_validade) === "vencido").length,
  };

  const alertasValidade = meds
    .filter((m) => ["vencido", "vence_7", "vence_30"].includes(getStatusValidade(m.data_validade)))
    .slice(0, 8);

  const estoqueBaixo = meds.filter((m) => m.quantidade_atual < m.quantidade_minima);

  const porCategoria = Object.entries(
    meds.reduce<Record<string, number>>((acc, m) => {
      const c = m.categoria || "Outro";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Visão geral do laboratório</h1>
          <p className="mt-1 text-sm text-muted-foreground">{todayCap} · Acompanhe seus medicamentos e vencimentos</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Pill} label="Medicamentos cadastrados" value={stats.total} tone="primary" />
        <StatCard icon={TrendingDown} label="Estoque crítico" value={stats.criticos} tone="warning" />
        <StatCard icon={Clock} label="Vencem em até 30 dias" value={stats.vencendo} tone="warning" />
        <StatCard icon={XCircle} label="Medicamentos vencidos" value={stats.vencidos} tone={stats.vencidos > 0 ? "danger" : "success"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Atenção aos próximos vencimentos
            </CardTitle>
            <Link to="/medicamentos" className="text-xs font-bold text-primary hover:underline">Ver todos →</Link>
          </CardHeader>
          <CardContent>
            {alertasValidade.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum alerta de vencimento. </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertasValidade.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{m.numero_lote}</TableCell>
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

        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {porCategoria.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {porCategoria.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Estoque abaixo do mínimo</CardTitle></CardHeader>
          <CardContent>
            {estoqueBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Todos os medicamentos com estoque adequado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoqueBaixo.slice(0, 6).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell className="text-right">{m.quantidade_atual}</TableCell>
                      <TableCell className="text-right">{m.quantidade_minima}</TableCell>
                      <TableCell><EstoqueBadge status={getStatusEstoque(m.quantidade_atual, m.quantidade_minima)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-bold">Últimas movimentações</CardTitle></CardHeader>
          <CardContent>
            {movs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma movimentação registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movs.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(parseISO(m.data_movimentacao), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{m.medicamentos?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${m.tipo === "entrada" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {m.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{m.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: "primary" | "warning" | "danger" | "success" }) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    success: "bg-success/15 text-success",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-[17px]">
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-[29px] font-extrabold leading-none tracking-tighter">{value}</p>
        </div>
        <div className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] ${toneClass}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </CardContent>
    </Card>
  );
}

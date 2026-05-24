import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CATEGORIAS } from "@/lib/medicamento-utils";

export const Route = createFileRoute("/_app/configuracoes")({ component: ConfigPage });

function ConfigPage() {
  const qc = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ["alertas_configuracao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alertas_configuracao").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [dias, setDias] = useState(30);
  const [minimo, setMinimo] = useState(10);
  const [saving, setSaving] = useState(false);
  const [novaCat, setNovaCat] = useState("");
  const [categoriasLocal, setCategoriasLocal] = useState<string[]>(CATEGORIAS);

  useEffect(() => {
    if (config) {
      setDias(config.dias_aviso_vencimento);
      setMinimo(config.quantidade_minima_global);
    }
  }, [config]);

  async function salvar() {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase.from("alertas_configuracao").update({
      dias_aviso_vencimento: dias,
      quantidade_minima_global: minimo,
    }).eq("id", config.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["alertas_configuracao"] }); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Ajuste alertas e categorias do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas</CardTitle>
          <CardDescription>Defina os limites globais para alertas do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Dias para aviso de vencimento</Label>
              <Input type="number" min={1} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Medicamentos serão alertados quando vencerem nos próximos {dias} dias.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade mínima global</Label>
              <Input type="number" min={0} value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Sugestão padrão de estoque mínimo para novos cadastros.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar configurações"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias de Medicamentos</CardTitle>
          <CardDescription>Categorias disponíveis ao cadastrar um medicamento (apenas nesta sessão)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categoriasLocal.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 pr-1">
                {c}
                <button onClick={() => setCategoriasLocal((arr) => arr.filter((x) => x !== c))} className="hover:bg-destructive/20 rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nova categoria" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} />
            <Button variant="outline" onClick={() => {
              const v = novaCat.trim();
              if (!v) return;
              if (categoriasLocal.includes(v)) { toast.error("Categoria já existe"); return; }
              setCategoriasLocal((arr) => [...arr, v]);
              setNovaCat("");
            }}>Adicionar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

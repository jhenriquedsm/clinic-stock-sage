import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIAS } from "@/lib/medicamento-utils";
import { differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, Snowflake, ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/integrations/supabase/types";

const schema = z.object({
  nome: z.string().min(1, "Obrigatório").max(200),
  principio_ativo: z.string().max(200).optional().or(z.literal("")),
  fabricante: z.string().max(200).optional().or(z.literal("")),
  numero_lote: z.string().min(1, "Obrigatório").max(100),
  categoria: z.string().max(100).optional().or(z.literal("")),
  apresentacao: z.string().max(100).optional().or(z.literal("")),
  concentracao: z.string().max(100).optional().or(z.literal("")),
  quantidade_atual: z.coerce.number().int().min(0),
  quantidade_minima: z.coerce.number().int().min(0),
  data_fabricacao: z.string().optional().or(z.literal("")),
  data_validade: z.string().min(1, "Obrigatório"),
  localizacao: z.string().max(200).optional().or(z.literal("")),
  observacoes: z.string().max(1000).optional().or(z.literal("")),
  controlado: z.boolean(),
  requer_refrigeracao: z.boolean(),
}).refine(
  (data) => {
    if (!data.data_fabricacao) return true;
    return new Date(data.data_fabricacao) <= new Date(data.data_validade);
  },
  { message: "Data de fabricação não pode ser posterior à validade", path: ["data_fabricacao"] }
);

export type MedicamentoFormValues = z.infer<typeof schema>;

export function MedicamentoFormDialog({
  open, onOpenChange, medicamento,
}: { open: boolean; onOpenChange: (o: boolean) => void; medicamento?: Tables<"medicamentos"> | null }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const form = useForm<MedicamentoFormValues>({
    resolver: zodResolver(schema),
    values: medicamento ? {
      nome: medicamento.nome,
      principio_ativo: medicamento.principio_ativo ?? "",
      fabricante: medicamento.fabricante ?? "",
      numero_lote: medicamento.numero_lote,
      categoria: medicamento.categoria ?? "",
      apresentacao: medicamento.apresentacao ?? "",
      concentracao: medicamento.concentracao ?? "",
      quantidade_atual: medicamento.quantidade_atual,
      quantidade_minima: medicamento.quantidade_minima,
      data_fabricacao: medicamento.data_fabricacao ?? "",
      data_validade: medicamento.data_validade,
      localizacao: medicamento.localizacao ?? "",
      observacoes: medicamento.observacoes ?? "",
      controlado: medicamento.controlado,
      requer_refrigeracao: medicamento.requer_refrigeracao,
    } : {
      nome: "", principio_ativo: "", fabricante: "", numero_lote: "", categoria: "",
      apresentacao: "", concentracao: "", quantidade_atual: 0, quantidade_minima: 10,
      data_fabricacao: "", data_validade: "", localizacao: "", observacoes: "",
      controlado: false, requer_refrigeracao: false,
    },
  });

  const dataVal = form.watch("data_validade");
  const proximoVencimento = dataVal && differenceInDays(parseISO(dataVal), new Date()) <= 30;

  async function onSubmit(values: MedicamentoFormValues) {
    setSaving(true);
    const payload = {
      ...values,
      principio_ativo: values.principio_ativo || null,
      fabricante: values.fabricante || null,
      categoria: values.categoria || null,
      apresentacao: values.apresentacao || null,
      concentracao: values.concentracao || null,
      data_fabricacao: values.data_fabricacao || null,
      localizacao: values.localizacao || null,
      observacoes: values.observacoes || null,
      controlado: values.controlado,
      requer_refrigeracao: values.requer_refrigeracao,
    };
    const { error } = medicamento
      ? await supabase.from("medicamentos").update(payload).eq("id", medicamento.id)
      : await supabase.from("medicamentos").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(medicamento ? "Medicamento atualizado" : "Medicamento cadastrado");
    qc.invalidateQueries({ queryKey: ["medicamentos"] });
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{medicamento ? "Editar Medicamento" : "Novo Medicamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome *" error={form.formState.errors.nome?.message}>
              <Input {...form.register("nome")} />
            </Field>
            <Field label="Princípio Ativo">
              <Input {...form.register("principio_ativo")} />
            </Field>
            <Field label="Fabricante">
              <Input {...form.register("fabricante")} />
            </Field>
            <Field label="Número do Lote *" error={form.formState.errors.numero_lote?.message}>
              <Input {...form.register("numero_lote")} />
            </Field>
            <Field label="Categoria">
              <Select value={form.watch("categoria") || ""} onValueChange={(v) => form.setValue("categoria", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Apresentação">
              <Input {...form.register("apresentacao")} placeholder="Comprimido, ampola…" />
            </Field>
            <Field label="Concentração">
              <Input {...form.register("concentracao")} placeholder="500mg, 10mg/ml…" />
            </Field>
            <Field label="Localização">
              <Input {...form.register("localizacao")} placeholder="Prateleira A2" />
            </Field>
            <Field label="Quantidade Atual *">
              <Input type="number" min={0} {...form.register("quantidade_atual")} />
            </Field>
            <Field label="Quantidade Mínima">
              <Input type="number" min={0} {...form.register("quantidade_minima")} />
            </Field>
            <Field label="Data de Fabricação">
              <Input type="date" {...form.register("data_fabricacao")} />
            </Field>
            <Field label="Data de Validade *" error={form.formState.errors.data_validade?.message}>
              <Input type="date" {...form.register("data_validade")} className={proximoVencimento ? "border-warning ring-2 ring-warning/30" : ""} />
              {proximoVencimento && (
                <p className="text-xs text-warning-foreground flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" /> Vence em breve
                </p>
              )}
            </Field>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                id="controlado"
                checked={form.watch("controlado")}
                onCheckedChange={(v) => form.setValue("controlado", !!v)}
              />
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Medicamento controlado (Lista C)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                id="requer_refrigeracao"
                checked={form.watch("requer_refrigeracao")}
                onCheckedChange={(v) => form.setValue("requer_refrigeracao", !!v)}
              />
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Snowflake className="h-4 w-4 text-sky-500" />
                Requer refrigeração (2–8°C)
              </span>
            </label>
          </div>

          <Field label="Observações">
            <Textarea rows={3} {...form.register("observacoes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

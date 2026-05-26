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
import { VIAS_ADMINISTRACAO, UNIDADES_DOSE } from "@/lib/medicamento-utils";
import type { Tables } from "@/integrations/supabase/types";

const schema = z.object({
  medicamento_id: z.string().min(1, "Obrigatório"),
  paciente_nome: z.string().min(1, "Obrigatório").max(200),
  dose_aplicada: z.coerce.number().positive("Deve ser maior que zero"),
  unidade_dose: z.string().min(1, "Obrigatório"),
  unidades_consumidas: z.coerce.number().int().min(1, "Mínimo 1"),
  data_administracao: z.string().min(1, "Obrigatório"),
  responsavel: z.string().max(200).optional().or(z.literal("")),
  via_administracao: z.string().optional().or(z.literal("")),
  observacoes: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function AdministracaoFormDialog({
  open,
  onOpenChange,
  medicamentos,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  medicamentos: Tables<"medicamentos">[];
}) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const now = new Date();
  now.setSeconds(0, 0);
  const defaultDatetime = now.toISOString().slice(0, 16);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      medicamento_id: "",
      paciente_nome: "",
      dose_aplicada: 1,
      unidade_dose: "mL",
      unidades_consumidas: 1,
      data_administracao: defaultDatetime,
      responsavel: "",
      via_administracao: "",
      observacoes: "",
    },
  });

  const selectedMedId = form.watch("medicamento_id");
  const selectedMed = medicamentos.find((m) => m.id === selectedMedId);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const { error } = await supabase.rpc("registrar_administracao", {
      p_medicamento_id: values.medicamento_id,
      p_paciente_nome: values.paciente_nome,
      p_dose_aplicada: values.dose_aplicada,
      p_unidade_dose: values.unidade_dose,
      p_unidades_consumidas: values.unidades_consumidas,
      p_data_administracao: new Date(values.data_administracao).toISOString(),
      p_responsavel: values.responsavel || null,
      p_via_administracao: values.via_administracao || null,
      p_observacoes: values.observacoes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Administração registrada");
    qc.invalidateQueries({ queryKey: ["administracoes"] });
    qc.invalidateQueries({ queryKey: ["medicamentos"] });
    onOpenChange(false);
    form.reset({ ...form.formState.defaultValues, data_administracao: defaultDatetime });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Administração</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm">Medicamento *</Label>
              <Select
                value={form.watch("medicamento_id")}
                onValueChange={(v) => form.setValue("medicamento_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o medicamento" />
                </SelectTrigger>
                <SelectContent>
                  {medicamentos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span>{m.nome}</span>
                      {m.concentracao && <span className="text-muted-foreground ml-1">— {m.concentracao}</span>}
                      <span className="text-muted-foreground ml-1">(estoque: {m.quantidade_atual})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMed && selectedMed.quantidade_atual === 0 && (
                <p className="text-xs text-destructive">Estoque zerado — não é possível registrar administração.</p>
              )}
              {form.formState.errors.medicamento_id && (
                <p className="text-xs text-destructive">{form.formState.errors.medicamento_id.message}</p>
              )}
            </div>

            <Field label="Paciente *" error={form.formState.errors.paciente_nome?.message}>
              <Input {...form.register("paciente_nome")} placeholder="Nome completo do paciente" />
            </Field>

            <Field label="Data e Hora da Administração *" error={form.formState.errors.data_administracao?.message}>
              <Input type="datetime-local" {...form.register("data_administracao")} />
            </Field>

            <Field label="Dose Aplicada *" error={form.formState.errors.dose_aplicada?.message}>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                {...form.register("dose_aplicada")}
                placeholder="Ex: 0.5"
              />
            </Field>

            <Field label="Unidade da Dose *" error={form.formState.errors.unidade_dose?.message}>
              <Select
                value={form.watch("unidade_dose")}
                onValueChange={(v) => form.setValue("unidade_dose", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES_DOSE.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Unidades deduzidas do estoque *"
              error={form.formState.errors.unidades_consumidas?.message}
              hint="Quantas unidades (ampolas, canetas…) foram consumidas"
            >
              <Input
                type="number"
                min="1"
                step="1"
                {...form.register("unidades_consumidas")}
              />
            </Field>

            <Field label="Via de Administração">
              <Select
                value={form.watch("via_administracao") || ""}
                onValueChange={(v) => form.setValue("via_administracao", v)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {VIAS_ADMINISTRACAO.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Responsável pela Aplicação" className="col-span-2">
              <Select
                value={form.watch("responsavel") || ""}
                onValueChange={(v) => form.setValue("responsavel", v)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMANDA">AMANDA</SelectItem>
                  <SelectItem value="CAROL">CAROL</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Observações">
            <Textarea rows={3} {...form.register("observacoes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              type="submit"
              disabled={saving || (!!selectedMed && selectedMed.quantidade_atual === 0)}
            >
              {saving ? "Registrando…" : "Registrar Administração"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, children, error, hint, className,
}: {
  label: string; children: React.ReactNode; error?: string; hint?: string; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

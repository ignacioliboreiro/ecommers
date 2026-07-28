"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VariantFormValue {
  id?: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  lowStockAlert: number;
  attributes: Record<string, string>;
}

export const EMPTY_VARIANT: VariantFormValue = {
  sku: "",
  priceCents: 0,
  compareAtCents: null,
  stock: 0,
  lowStockAlert: 5,
  attributes: {},
};

interface VariantEditorProps {
  variants: VariantFormValue[];
  onChange: (variants: VariantFormValue[]) => void;
}

export function VariantEditor({ variants, onChange }: VariantEditorProps) {
  function updateVariant(index: number, patch: Partial<VariantFormValue>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function updateAttribute(index: number, key: string, value: string) {
    const variant = variants[index];
    updateVariant(index, { attributes: { ...variant.attributes, [key]: value } });
  }

  function addAttribute(index: number) {
    updateVariant(index, { attributes: { ...variants[index].attributes, "": "" } });
  }

  function renameAttributeKey(index: number, oldKey: string, newKey: string) {
    const { [oldKey]: value, ...rest } = variants[index].attributes;
    updateVariant(index, { attributes: { ...rest, [newKey]: value ?? "" } });
  }

  function removeAttribute(index: number, key: string) {
    const { [key]: _removed, ...rest } = variants[index].attributes;
    updateVariant(index, { attributes: rest });
  }

  function addVariant() {
    onChange([...variants, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Variante {index + 1}</span>
            {variants.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeVariant(index)}
                aria-label={`Eliminar variante ${index + 1}`}
              >
                <Trash2 aria-hidden />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`sku-${index}`}>SKU</Label>
              <Input
                id={`sku-${index}`}
                value={variant.sku}
                onChange={(e) => updateVariant(index, { sku: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`price-${index}`}>Precio (centavos)</Label>
              <Input
                id={`price-${index}`}
                type="number"
                min={1}
                value={variant.priceCents || ""}
                onChange={(e) => updateVariant(index, { priceCents: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`compare-${index}`}>Precio anterior (opcional)</Label>
              <Input
                id={`compare-${index}`}
                type="number"
                min={0}
                value={variant.compareAtCents ?? ""}
                onChange={(e) =>
                  updateVariant(index, {
                    compareAtCents: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`stock-${index}`}>Stock inicial</Label>
              <Input
                id={`stock-${index}`}
                type="number"
                min={0}
                value={variant.stock}
                onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Atributos (ej: color, talle)</Label>
            {Object.entries(variant.attributes).map(([key, value], attrIndex) => (
              <div key={attrIndex} className="flex items-center gap-2">
                <Input
                  aria-label={`Clave del atributo ${attrIndex + 1}`}
                  placeholder="Clave (ej: color)"
                  value={key}
                  onChange={(e) => renameAttributeKey(index, key, e.target.value)}
                  className="max-w-[160px]"
                />
                <Input
                  aria-label={`Valor del atributo ${attrIndex + 1}`}
                  placeholder="Valor (ej: Rojo)"
                  value={value}
                  onChange={(e) => updateAttribute(index, key, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeAttribute(index, key)}
                  aria-label="Eliminar atributo"
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => addAttribute(index)}
            >
              <Plus data-icon="inline-start" aria-hidden />
              Agregar atributo
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addVariant} className="w-fit">
        <Plus data-icon="inline-start" aria-hidden />
        Agregar variante
      </Button>
    </div>
  );
}

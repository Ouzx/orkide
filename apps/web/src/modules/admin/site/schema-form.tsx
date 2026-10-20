import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/kit/button";
import { Checkbox } from "@orkide/ui/kit/checkbox";
import { Input } from "@orkide/ui/kit/input";
import { Label } from "@orkide/ui/kit/label";
import { Textarea } from "@orkide/ui/kit/textarea";
import type { SiteKey } from "@orkide/validators/site";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { createContext, use, useMemo, useState } from "react";
import type { ComponentType } from "react";

import { FieldError } from "../components/document-form.tsx";
import type { FieldIssues } from "../components/document-form.tsx";
import { useAdmin } from "../context.tsx";
import { fieldLabel, optionLabel } from "./labels.ts";

/**
 * A form built from a section's JSON Schema (draft 2020-12, as Zod 4 emits it from
 * `@orkide/validators/site`): the admin needs no Zod, and the API validates what it saves.
 * Only the shapes the sections use are handled: objects, lists, fixed-length lists, text,
 * numbers, switches and choices.
 */
export interface Schema {
  readonly type?: string;
  readonly properties?: Readonly<Record<string, Schema>>;
  readonly required?: readonly string[];
  readonly items?: Schema;
  readonly prefixItems?: readonly Schema[];
  readonly enum?: readonly string[];
  readonly maxLength?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly minimum?: number;
  readonly maximum?: number;
}

export type Value =
  | string
  | number
  | boolean
  | readonly Value[]
  | { readonly [key: string]: Value }
  | undefined;

type Path = readonly (string | number)[];

interface FieldProps {
  readonly schema: Schema;
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  readonly path: Path;
  readonly label: string;
}

interface Form {
  readonly section: SiteKey;
  readonly issues: FieldIssues;
  /** The field for any schema; nested fields render through it (objects hold fields, …). */
  readonly Field: ComponentType<FieldProps>;
}

/** A native `<select>` in the same well as the `Input` primitive. */
const selectClass = "o-input";

const FormContext = createContext<Form | null>(null);

const useForm = (): Form => {
  const form = use(FormContext);
  if (!form) {
    throw new Error("Schema fields render inside SchemaForm");
  }
  return form;
};

const isRecord = (value: Value): value is Readonly<Record<string, Value>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const idOf = (section: SiteKey, path: Path): string =>
  ["site", section, ...path].join("-");

/** A new, empty value for `schema`: what "Add" puts in a list. */
export const blankOf = (schema: Schema): Value => {
  if (schema.enum) {
    return schema.enum[0];
  }
  switch (schema.type) {
    case "object": {
      // Optional fields start absent.
      const required = new Set(schema.required);
      const blank: Record<string, Value> = {};
      for (const [name, child] of Object.entries(schema.properties ?? {})) {
        if (required.has(name)) {
          blank[name] = blankOf(child);
        }
      }
      return blank;
    }
    case "array": {
      return schema.prefixItems ? schema.prefixItems.map(blankOf) : [];
    }
    case "boolean": {
      return false;
    }
    case "integer":
    case "number": {
      return schema.minimum ?? 0;
    }
    default: {
      return "";
    }
  }
};

const Issue = ({ path }: { readonly path: Path }) => (
  <FieldError message={useForm().issues.get(path.join("."))} />
);

const TextField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { section, issues } = useForm();
  const id = idOf(section, path);
  const text = typeof value === "string" ? value : "";
  const invalid = issues.has(path.join(".")) ? true : undefined;
  // Paragraphs get room; lines stay single.
  const long = (schema.maxLength ?? 0) > 200;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {long ? (
        <Textarea
          id={id}
          value={text}
          maxLength={schema.maxLength}
          rows={3}
          aria-invalid={invalid}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        />
      ) : (
        <Input
          id={id}
          value={text}
          maxLength={schema.maxLength}
          aria-invalid={invalid}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        />
      )}
      <Issue path={path} />
    </div>
  );
};

const NumberField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { section } = useForm();
  const id = idOf(section, path);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        className="w-32"
        value={typeof value === "number" ? value : 0}
        min={schema.minimum}
        max={schema.maximum}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber || 0);
        }}
      />
      <Issue path={path} />
    </div>
  );
};

const BooleanField = ({ value, onChange, path, label }: FieldProps) => {
  const { section } = useForm();
  const id = idOf(section, path);
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={value === true}
        onCheckedChange={(checked) => {
          onChange(checked);
        }}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

const ChoiceField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { section } = useForm();
  const { options } = useAdmin();
  const id = idOf(section, path);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={selectClass}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      >
        {schema.enum?.map((choice) => (
          <option key={choice} value={choice}>
            {optionLabel(choice, options)}
          </option>
        ))}
      </select>
    </div>
  );
};

const ObjectField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { Field, section } = useForm();
  const { options } = useAdmin();
  const record = isRecord(value) ? value : {};
  const body = (
    <div className="grid gap-4">
      {Object.entries(schema.properties ?? {}).map(([name, child]) => (
        <Field
          key={name}
          schema={child}
          value={record[name]}
          path={[...path, name]}
          label={fieldLabel(section, name, options)}
          onChange={(next) => {
            onChange({ ...record, [name]: next });
          }}
        />
      ))}
    </div>
  );
  // The section itself has no frame; nested groups get one.
  return path.length === 0 ? (
    body
  ) : (
    <fieldset className="space-y-4 rounded-xl border p-3 sm:p-4">
      <legend className="o-label px-1">{label}</legend>
      {body}
    </fieldset>
  );
};

let lastKey = 0;
const newKey = (): string => {
  lastKey += 1;
  return `item-${lastKey}`;
};

/** A list the admin can grow, shrink and reorder within the schema's bounds. */
const ListField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { Field } = useForm();
  const { options } = useAdmin();
  const items = Array.isArray(value) ? value : [];
  // Items have no id of their own: each gets a key that follows it when the list changes.
  const [keys, setKeys] = useState<readonly string[]>([]);
  const ids = items.map(
    (_, index) => keys[index] ?? `${path.join(".")}~${index}`
  );
  const item = schema.items ?? {};
  const canAdd = items.length < (schema.maxItems ?? Infinity);
  const canRemove = items.length > (schema.minItems ?? 0);
  const update = (next: readonly Value[], nextIds: readonly string[]) => {
    setKeys(nextIds);
    onChange(next);
  };
  const move = (from: number, to: number): void => {
    const next = [...items];
    const nextIds = [...ids];
    next.splice(to, 0, ...next.splice(from, 1));
    nextIds.splice(to, 0, ...nextIds.splice(from, 1));
    update(next, nextIds);
  };
  return (
    <fieldset className="space-y-3 rounded-xl border p-3 sm:p-4">
      <legend className="o-label px-1">{label}</legend>
      <Issue path={path} />
      {items.map((entry, index) => {
        const name = m.admin_site_item({ label, n: index + 1 }, options);
        return (
          <div key={ids[index]} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Field
                schema={item}
                value={entry}
                path={[...path, index]}
                label={name}
                onChange={(next) => {
                  onChange(
                    items.map((each, at) => (at === index ? next : each))
                  );
                }}
              />
            </div>
            {/* A column on phones, so the item keeps the width. */}
            <div className="flex shrink-0 flex-col gap-1 pt-6 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                aria-label={`${m.admin_site_move_up({}, options)} — ${name}`}
                onClick={() => {
                  move(index, index - 1);
                }}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === items.length - 1}
                aria-label={`${m.admin_site_move_down({}, options)} — ${name}`}
                onClick={() => {
                  move(index, index + 1);
                }}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canRemove}
                aria-label={`${m.admin_remove({}, options)} — ${name}`}
                onClick={() => {
                  update(
                    items.filter((_, at) => at !== index),
                    ids.filter((_, at) => at !== index)
                  );
                }}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canAdd}
        onClick={() => {
          update([...items, blankOf(item)], [...ids, newKey()]);
        }}
      >
        <Plus aria-hidden="true" />
        {m.admin_site_add({}, options)}
      </Button>
    </fieldset>
  );
};

/** A list of fixed length (a pair of title lines, a set of three words). */
const TupleField = ({ schema, value, onChange, path, label }: FieldProps) => {
  const { Field } = useForm();
  const { options } = useAdmin();
  const items = Array.isArray(value) ? value : [];
  return (
    <fieldset className="space-y-3 rounded-xl border p-3 sm:p-4">
      <legend className="o-label px-1">{label}</legend>
      {schema.prefixItems?.map((child, index) => {
        // A fixed position is the item itself.
        const position = `${path.join(".")}#${index}`;
        return (
          <Field
            key={position}
            schema={child}
            value={items[index]}
            path={[...path, index]}
            label={m.admin_site_item({ label, n: index + 1 }, options)}
            onChange={(next) => {
              const copy = [...items];
              copy[index] = next;
              onChange(copy);
            }}
          />
        );
      })}
    </fieldset>
  );
};

const SchemaField = (props: FieldProps) => {
  const { schema } = props;
  if (schema.enum) {
    return <ChoiceField {...props} />;
  }
  switch (schema.type) {
    case "object": {
      return <ObjectField {...props} />;
    }
    case "array": {
      return schema.prefixItems ? (
        <TupleField {...props} />
      ) : (
        <ListField {...props} />
      );
    }
    case "boolean": {
      return <BooleanField {...props} />;
    }
    case "integer":
    case "number": {
      return <NumberField {...props} />;
    }
    default: {
      return <TextField {...props} />;
    }
  }
};

/** The whole section: an object at the root of the schema. */
export const SchemaForm = ({
  section,
  issues,
  ...field
}: Omit<Form, "Field"> & Omit<FieldProps, "path" | "label">) => {
  const form = useMemo(
    () => ({ Field: SchemaField, issues, section }),
    [issues, section]
  );
  return (
    <FormContext value={form}>
      <SchemaField {...field} path={[]} label="" />
    </FormContext>
  );
};

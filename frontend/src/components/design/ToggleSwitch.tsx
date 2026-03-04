"use client";

export interface ToggleSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
}

/**
 * Toggle switch styled like plan/edit toggles. Use with react-hook-form: <ToggleSwitch id={name} {...register(name)} />
 */
export function ToggleSwitch({ id, className, ...rest }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" id={id} className="peer sr-only" {...rest} />
      <div className="relative peer h-6 w-11 rounded-full border border-border bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/30" />
    </label>
  );
}

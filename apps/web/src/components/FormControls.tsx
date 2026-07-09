export function InputField({ label, help, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string }) {
  return <div><label className="field-label">{label}{required && <span className="ml-1 text-danger">*</span>}</label><input {...props} required={required} className={`input-field ${props.className ?? ""}`} />{help && <p className="field-help">{help}</p>}</div>;
}
export function SelectField({ label, options, required, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<{ label: string; value: string }> }) {
  return <div><label className="field-label">{label}{required && <span className="ml-1 text-danger">*</span>}</label><select {...props} required={required} className={`select-field ${props.className ?? ""}`}>{options.map((o) => <option key={`${o.value}-${o.label}`} value={o.value}>{o.label}</option>)}</select></div>;
}
export function TextAreaField({ label, required, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <div><label className="field-label">{label}{required && <span className="ml-1 text-danger">*</span>}</label><textarea {...props} required={required} className={`textarea-field ${props.className ?? ""}`} /></div>;
}

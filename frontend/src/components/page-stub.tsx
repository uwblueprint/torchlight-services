import Link from "next/link";
import type { ReactNode } from "react";
import { passportCategories } from "@/lib/passport-categories";

type StubField = {
  label: string;
  placeholder?: string;
  type?: "text" | "search" | "date" | "number" | "file" | "select" | "textarea";
  options?: string[];
};

type StubSection = {
  title: string;
  description?: string;
  kind?: "metrics" | "table" | "form" | "checklist" | "categories" | "links";
  columns?: string[];
  fields?: StubField[];
  items?: string[];
  links?: { label: string; href: string }[];
  action?: string;
  emptyMessage?: string;
  callout?: string;
};

type PageStubProps = {
  audience: "Passport Worker" | "Torchlight Admin" | "Shared";
  title: string;
  description: string;
  developerTasks: string[];
  sections: StubSection[];
  children?: ReactNode;
};

function SectionContent({ section }: { section: StubSection }) {
  if (section.kind === "metrics") {
    return <div className="stub-metrics">{(section.items ?? []).map((item) => <div className="stub-metric" key={item}><span>{item}</span><strong>—</strong><small>Data source not connected</small></div>)}</div>;
  }

  if (section.kind === "table") {
    return <div className="stub-table-wrap"><table className="stub-table"><thead><tr>{(section.columns ?? []).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr><td colSpan={section.columns?.length ?? 1}>{section.emptyMessage ?? "No records connected. Implement the data source and empty/loading/error states."}</td></tr></tbody></table></div>;
  }

  if (section.kind === "form") {
    return <>
      <fieldset className="stub-fieldset" disabled>
        <div className="stub-fields">{(section.fields ?? []).map((field) => <label key={field.label}>{field.label}{field.type === "textarea" ? <textarea placeholder={field.placeholder ?? "Implement this field"} /> : field.type === "select" ? <select defaultValue=""><option value="">Select {field.label.toLowerCase()}</option>{(field.options ?? []).map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type ?? "text"} placeholder={field.placeholder ?? "Implement this field"} />}</label>)}</div>
        <button className="stub-button" type="button" disabled>{section.action ?? "Action not wired"}</button>
      </fieldset>
      {section.callout && <p className="stub-callout">{section.callout}</p>}
    </>;
  }

  if (section.kind === "checklist") {
    return <ul className="stub-checklist">{(section.items ?? []).map((item) => <li key={item}><span aria-hidden="true" />{item}</li>)}</ul>;
  }

  if (section.kind === "categories") {
    return <div className="stub-category-list">{passportCategories.map((category) => <details className="stub-category" key={category.id}><summary><span className="stub-category-number">{category.id}</span><span>{category.name}</span><span className="stub-category-extra">{category.subcategories ? `${category.subcategories.length} subcategories` : ""}</span></summary>{category.subcategories && <ul>{category.subcategories.map((subcategory) => <li key={subcategory}>{subcategory}</li>)}</ul>}</details>)}</div>;
  }

  if (section.kind === "links") {
    return <ul className="stub-links">{(section.links ?? []).map((link) => <li key={link.href}><Link href={link.href}>{link.label}<span aria-hidden="true">→</span></Link></li>)}</ul>;
  }

  return <div className="stub-empty">{section.emptyMessage ?? "Reserved for implementation."}</div>;
}

export function PageStub({ audience, title, description, developerTasks, sections, children }: PageStubProps) {
  return <main className="stub-page">
    <header className="stub-page-header">
      <div><p className="stub-eyebrow">{audience} · page stub</p><h1>{title}</h1><p className="stub-description">{description}</p></div>
      <span className="stub-badge">Not implemented</span>
    </header>
    {children}
    <div className="stub-section-grid">{sections.map((section) => <section className="stub-panel" key={section.title}>
      <div className="stub-panel-heading"><div><h2>{section.title}</h2>{section.description && <p>{section.description}</p>}</div><span className="stub-mark" aria-hidden="true">TODO</span></div>
      <SectionContent section={section} />
    </section>)}</div>
    <details className="stub-developer-notes"><summary>Developer tasks for this page</summary><ul>{developerTasks.map((task) => <li key={task}>{task}</li>)}</ul></details>
  </main>;
}

import { ArrowUpRight, Construction } from "lucide-react";

export function FeaturePlaceholder({ description, title }: Readonly<{ description: string; title: string }>) {
  return <div className="protected-page-content"><div className="feature-placeholder"><div className="feature-placeholder-icon"><Construction size={22} /></div><p className="eyebrow">Phase 3 foundation</p><h1>{title}</h1><p>{description}</p><span>This protected workspace is ready for the next implementation phase.</span><button className="secondary-button">Back to dashboard <ArrowUpRight size={15} /></button></div></div>;
}
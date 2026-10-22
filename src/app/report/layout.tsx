import { FlowProvider } from "@/lib/flow/context";

export default function ReportLayout({ children }: LayoutProps<"/report">) {
  return <FlowProvider>{children}</FlowProvider>;
}

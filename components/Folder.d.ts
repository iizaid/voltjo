declare module "@/components/Folder" {
  import type { ReactNode } from "react";

  export default function Folder(props: {
    color?: string;
    size?: number;
    items?: ReactNode[];
    className?: string;
  }): ReactNode;
}

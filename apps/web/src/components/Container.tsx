import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return <main className="container">{children}</main>;
}

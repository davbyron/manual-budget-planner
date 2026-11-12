import { Suspense } from "react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-center" role="status">
          Loading...
        </p>
      }
    >
      {children}
    </Suspense>
  );
}

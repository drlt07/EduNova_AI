import * as React from "react";

export default function dynamic<P extends object>(loader: () => Promise<React.ComponentType<P> | { default: React.ComponentType<P> }>, opts: { loading?: () => React.ReactNode } = {}) {
  const Lazy = React.lazy(async () => {
    const m = await loader();
    return { default: ("default" in m ? m.default : m) as React.ComponentType<P> };
  });
  return function Dynamic(props: P) {
    return (
      <React.Suspense fallback={opts.loading?.() ?? null}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };
}

import * as React from "react";
import { navigate } from "./router-store";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };

const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, onClick, ...rest }, ref) {
  void prefetch;
  return (
    <a
      ref={ref}
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (/^https?:/.test(href)) return;
        e.preventDefault();
        navigate(href, { replace, scroll });
      }}
    />
  );
});
export default Link;

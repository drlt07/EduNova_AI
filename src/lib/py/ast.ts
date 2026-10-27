export type Expr =
  | { type: "num"; value: number; isFloat: boolean; line: number }
  | { type: "str"; value: string; line: number }
  | { type: "fstr"; parts: (string | { expr: Expr; spec?: string })[]; line: number }
  | { type: "const"; value: boolean | null; line: number }
  | { type: "name"; id: string; line: number }
  | { type: "list"; items: Expr[]; line: number }
  | { type: "unary"; op: "-" | "+"; operand: Expr; line: number }
  | { type: "not"; operand: Expr; line: number }
  | { type: "binop"; op: string; left: Expr; right: Expr; line: number }
  | { type: "boolop"; op: "and" | "or"; left: Expr; right: Expr; line: number }
  | { type: "compare"; left: Expr; ops: string[]; rights: Expr[]; line: number }
  | { type: "call"; func: Expr; args: Expr[]; kwargs: Record<string, Expr>; line: number }
  | { type: "method"; obj: Expr; name: string; args: Expr[]; line: number }
  | { type: "index"; obj: Expr; index: Expr; line: number }
  | { type: "slice"; obj: Expr; lo?: Expr; hi?: Expr; line: number };

export type Stmt =
  | { type: "expr"; expr: Expr; line: number }
  | { type: "assign"; target: Expr; op: string; value: Expr; line: number }
  | { type: "if"; branches: { cond: Expr; body: Stmt[]; line: number }[]; orelse?: { body: Stmt[]; line: number }; line: number }
  | { type: "while"; cond: Expr; body: Stmt[]; line: number }
  | { type: "for"; target: string; iter: Expr; body: Stmt[]; line: number }
  | { type: "break" | "continue" | "pass"; line: number }
  | { type: "def"; name: string; params: string[]; body: Stmt[]; line: number }
  | { type: "return"; value?: Expr; line: number };

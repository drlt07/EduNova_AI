/** Lỗi theo đúng tên lỗi của Python, kèm giải thích tiếng Việt cho học sinh. */
export class PyError extends Error {
  constructor(
    public pyType: string,
    message: string,
    public line: number,
    public explain: string,
  ) {
    super(message);
    this.name = pyType;
  }
}

export const syntaxError = (line: number, message: string, explain: string) => new PyError("SyntaxError", message, line, explain);

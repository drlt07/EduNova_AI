import temml from "temml";

// Gói mhchem của temml đọc biến toàn cục `temml`; phải gán trước khi nạp gói.
(globalThis as unknown as { temml: typeof temml }).temml = temml;

export default temml;

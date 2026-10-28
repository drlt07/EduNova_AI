/**
 * Chuyên đề bồi dưỡng học sinh giỏi Tin học THPT: các thuật toán nổi bật, mỗi thuật toán có mô phỏng từng bước
 * (src/lib/algo) mở ở /thuat-toan/[id].
 */
export type AlgoId = "bubble" | "selection" | "insertion" | "merge" | "quick" | "linear" | "binary" | "bfs" | "dfs" | "dijkstra" | "knapsack" | "sieve";

export interface AlgoInfo {
  id: AlgoId;
  title: string;
  topic: HsgTopicId;
  /** Một câu: thuật toán làm gì. */
  summary: string;
  /** Ý tưởng cốt lõi, 1–2 câu. */
  idea: string;
  time: string;
  space: string;
  /** Lưu ý khi đi thi. */
  tip: string;
}

export type HsgTopicId = "sort" | "search" | "graph" | "dp" | "number";

export interface HsgTopic {
  id: HsgTopicId;
  no: number;
  title: string;
  blurb: string;
  algos: AlgoId[];
}

export const HSG_TOPICS: HsgTopic[] = [
  { id: "sort", no: 1, title: "Sắp xếp", blurb: "So sánh các cách sắp xếp từ O(n²) đến O(n log n).", algos: ["bubble", "selection", "insertion", "merge", "quick"] },
  { id: "search", no: 2, title: "Tìm kiếm", blurb: "Duyệt tuần tự và chia đôi trên mảng đã sắp.", algos: ["linear", "binary"] },
  { id: "graph", no: 3, title: "Đồ thị và loang", blurb: "Duyệt lưới, mê cung và tìm đường ngắn nhất có trọng số.", algos: ["bfs", "dfs", "dijkstra"] },
  { id: "dp", no: 4, title: "Quy hoạch động", blurb: "Lưu kết quả bài toán con vào bảng để không tính lại.", algos: ["knapsack"] },
  { id: "number", no: 5, title: "Số học", blurb: "Kĩ thuật xử lí số nguyên tố cho dữ liệu lớn.", algos: ["sieve"] },
];

export const ALGOS: Record<AlgoId, AlgoInfo> = {
  bubble: { id: "bubble", title: "Sắp xếp nổi bọt", topic: "sort", summary: "Đổi chỗ hai phần tử kề nhau nếu sai thứ tự, lặp lại đến khi hết.", idea: "Sau mỗi lượt, số lớn nhất còn lại \"nổi\" về cuối mảng.", time: "O(n²)", space: "O(1)", tip: "Chỉ dùng khi n nhỏ (≤ 10³); dễ viết, dễ kiểm tra." },
  selection: { id: "selection", title: "Sắp xếp chọn", topic: "sort", summary: "Mỗi lượt chọn số nhỏ nhất của phần chưa sắp, đưa về đầu.", idea: "Số lần đổi chỗ ít (n − 1), nhưng vẫn phải so sánh khoảng n²/2 lần.", time: "O(n²)", space: "O(1)", tip: "Hữu ích khi thao tác ghi tốn kém hơn so sánh." },
  insertion: { id: "insertion", title: "Sắp xếp chèn", topic: "sort", summary: "Lấy từng phần tử, chèn vào đúng chỗ trong phần đã sắp phía trước.", idea: "Giống xếp bài trên tay; rất nhanh nếu mảng gần như đã sắp.", time: "O(n²), tốt nhất O(n)", space: "O(1)", tip: "Mảng gần sắp hoặc n rất nhỏ: chèn thường thắng cả sắp xếp nhanh." },
  merge: { id: "merge", title: "Sắp xếp trộn", topic: "sort", summary: "Chia đôi, sắp từng nửa, rồi trộn hai nửa đã sắp.", idea: "Chia để trị: trộn hai dãy đã sắp chỉ mất O(n).", time: "O(n log n)", space: "O(n)", tip: "Ổn định, luôn O(n log n); dùng để đếm cặp nghịch thế." },
  quick: { id: "quick", title: "Sắp xếp nhanh", topic: "sort", summary: "Chọn chốt, dồn số nhỏ hơn sang trái, lớn hơn sang phải, đệ quy hai bên.", idea: "Sau mỗi lần phân hoạch, chốt nằm đúng vị trí cuối cùng.", time: "Trung bình O(n log n), xấu nhất O(n²)", space: "O(log n)", tip: "Chọn chốt ngẫu nhiên để tránh trường hợp xấu; trong C++ dùng sort() có sẵn." },
  linear: { id: "linear", title: "Tìm kiếm tuần tự", topic: "search", summary: "Xét lần lượt từng phần tử cho đến khi gặp giá trị cần tìm.", idea: "Không cần mảng sắp xếp, nhưng phải xét tới n phần tử.", time: "O(n)", space: "O(1)", tip: "Đủ tốt khi chỉ tìm một vài lần." },
  binary: { id: "binary", title: "Tìm kiếm nhị phân", topic: "search", summary: "Trên mảng đã sắp, so với phần tử giữa rồi bỏ đi một nửa.", idea: "Mỗi bước loại một nửa nên chỉ cần khoảng log₂ n bước.", time: "O(log n)", space: "O(1)", tip: "Cẩn thận điều kiện lo ≤ hi và cập nhật mid ± 1; còn dùng để chặt nhị phân đáp án." },
  bfs: { id: "bfs", title: "Loang BFS", topic: "graph", summary: "Duyệt theo chiều rộng: thăm các ô cách 1 bước, rồi 2 bước…", idea: "Dùng hàng đợi; lần đầu chạm tới một ô chính là đường ngắn nhất (lưới không trọng số).", time: "O(V + E)", space: "O(V)", tip: "Bài mê cung, lan truyền, số bước ít nhất: nghĩ tới BFS trước." },
  dfs: { id: "dfs", title: "Duyệt sâu DFS", topic: "graph", summary: "Đi sâu theo một hướng đến khi bế tắc thì quay lui.", idea: "Dùng ngăn xếp (hoặc đệ quy); tìm được đường nhưng không chắc ngắn nhất.", time: "O(V + E)", space: "O(V)", tip: "Đếm vùng liên thông, phát hiện chu trình; coi chừng tràn ngăn xếp đệ quy." },
  dijkstra: { id: "dijkstra", title: "Dijkstra", topic: "graph", summary: "Đường đi ngắn nhất từ một đỉnh trên đồ thị trọng số không âm.", idea: "Mỗi bước chốt đỉnh gần nhất chưa chốt rồi cập nhật các đỉnh kề.", time: "O((V + E) log V) với hàng đợi ưu tiên", space: "O(V)", tip: "Không dùng được khi có cạnh âm; cài bằng priority_queue / heapq." },
  knapsack: { id: "knapsack", title: "Cái túi 0/1", topic: "dp", summary: "Chọn đồ vật để tổng khối lượng không vượt sức chứa và tổng giá trị lớn nhất.", idea: "dp[i][c] = max(không lấy món i, lấy món i); mỗi ô dựa vào hàng trên.", time: "O(n·W)", space: "O(n·W), rút còn O(W)", tip: "Rút bảng một chiều thì duyệt c từ W giảm dần." },
  sieve: { id: "sieve", title: "Sàng Eratosthenes", topic: "number", summary: "Liệt kê mọi số nguyên tố ≤ n bằng cách gạch bỏ bội số.", idea: "Số nhỏ nhất chưa bị gạch là số nguyên tố; gạch bội của nó từ p².", time: "O(n log log n)", space: "O(n)", tip: "Sàng một lần đến n lớn nhất rồi trả lời nhiều truy vấn trong O(1)." },
};

export const ALGO_IDS = Object.keys(ALGOS) as AlgoId[];
export const isAlgoId = (x: string): x is AlgoId => x in ALGOS;
export const hsgCount = () => ({ topics: HSG_TOPICS.length, algos: ALGO_IDS.length });

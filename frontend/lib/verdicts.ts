export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case "accepted":
      return "var(--cm-green)";
    case "running":
      return "var(--cm-cyan)";
    case "pending":
      return "var(--text-secondary)";
    case "compile_error":
      return "var(--cm-yellow)";
    case "time_limit":
    case "time_limit_exceeded":
      return "var(--cm-orange)";
    default:
      // wrong_answer, runtime_error, etc.
      return "var(--cm-red)";
  }
}

export function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case "accepted":
      return "✓ AC";
    case "pending":
      return "○ Pending";
    case "running":
      return "⟳ Running…";
    case "wrong_answer":
      return "✗ WA";
    case "compile_error":
      return "✗ CE";
    case "runtime_error":
      return "✗ RE";
    case "time_limit":
    case "time_limit_exceeded":
      return "⏱ TLE";
    default:
      return verdict;
  }
}

export function getVerdictText(verdict: string): string {
  switch (verdict) {
    case "accepted":
      return "Accepted";
    case "wrong_answer":
      return "Wrong Answer";
    case "compile_error":
      return "Compile Error";
    case "runtime_error":
      return "Runtime Error";
    case "time_limit":
    case "time_limit_exceeded":
      return "Time Limit Exceeded";
    default:
      return "Failed";
  }
}

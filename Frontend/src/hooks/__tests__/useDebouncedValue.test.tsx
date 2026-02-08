import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

function Demo() {
  const [v, setV] = useState("a");
  const d = useDebouncedValue(v, 300);

  return (
    <div>
      <div data-testid="debounced">{d}</div>
      <button onClick={() => setV("b")}>set-b</button>
    </div>
  );
}

describe("useDebouncedValue", () => {
  it("updates debounced value after delay", async () => {
    vi.useFakeTimers();
    render(<Demo />);

    expect(screen.getByTestId("debounced").textContent).toBe("a");

    screen.getByText("set-b").click();
    expect(screen.getByTestId("debounced").textContent).toBe("a");

    vi.advanceTimersByTime(299);
    expect(screen.getByTestId("debounced").textContent).toBe("a");

    vi.advanceTimersByTime(1);
    expect(screen.getByTestId("debounced").textContent).toBe("b");

    vi.useRealTimers();
  });
});

import { describe, it, expect, beforeEach } from "vitest";

import {
  normalizeTaskName,
  isValidDateValue,
  createTodo,
  validateTaskName,
  isOverdue,
  formatDueDate,
  getFilteredTodos,
  state,
} from "../app.js";

describe("Advanced Todo App", () => {
  beforeEach(() => {
    state.todos = [];
    state.filter = "all";
    state.searchTerm = "";
  });

  describe("normalizeTaskName", () => {
    it("should trim leading and trailing spaces", () => {
      expect(
        normalizeTaskName("   Learn Testing   ")
      ).toBe("Learn Testing");
    });

    it("should collapse multiple spaces", () => {
      expect(
        normalizeTaskName("Learn     Testing")
      ).toBe("Learn Testing");
    });
  });

  describe("isValidDateValue", () => {
    it("should accept valid dates", () => {
      expect(
        isValidDateValue("2026-10-05")
      ).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(
        isValidDateValue("05/10/2026")
      ).toBe(false);
    });

    it("should reject null", () => {
      expect(
        isValidDateValue(null)
      ).toBe(false);
    });

    it("should reject random strings", () => {
      expect(
        isValidDateValue("invalid")
      ).toBe(false);
    });
  });

  describe("createTodo", () => {
    it("should create a valid todo", () => {
      const todo = createTodo(
        "Learn Vitest",
        "high",
        "2026-12-01"
      );

      expect(todo.id).toBeDefined();
      expect(todo.text).toBe("Learn Vitest");
      expect(todo.priority).toBe("high");
      expect(todo.completed).toBe(false);
      expect(todo.dueDate).toBe("2026-12-01");
    });

    it("should default invalid priority to medium", () => {
      const todo = createTodo(
        "Task",
        "invalid-priority",
        ""
      );

      expect(todo.priority).toBe("medium");
    });

    it("should clear invalid due dates", () => {
      const todo = createTodo(
        "Task",
        "medium",
        "bad-date"
      );

      expect(todo.dueDate).toBe("");
    });
  });

  describe("validateTaskName", () => {
    it("should reject empty names", () => {
      expect(
        validateTaskName("")
      ).toContain("Enter a task name");
    });

    it("should reject short names", () => {
      expect(
        validateTaskName("ab")
      ).toContain("at least");
    });

    it("should reject overlong names", () => {
      expect(
        validateTaskName("a".repeat(121))
      ).toContain("cannot exceed");
    });

    it("should allow valid names", () => {
      expect(
        validateTaskName("Learn Vitest")
      ).toBe("");
    });

    it("should reject duplicates", () => {
      state.todos = [
        {
          id: "1",
          text: "Learn Vitest",
          completed: false,
          priority: "medium",
          dueDate: "",
        },
      ];

      expect(
        validateTaskName("Learn Vitest")
      ).toContain("already exists");
    });

    it("should ignore the current todo when editing", () => {
      state.todos = [
        {
          id: "1",
          text: "Learn Vitest",
          completed: false,
          priority: "medium",
          dueDate: "",
        },
      ];

      expect(
        validateTaskName(
          "Learn Vitest",
          "1"
        )
      ).toBe("");
    });
  });

  describe("isOverdue", () => {
    it("should return false when no due date exists", () => {
      expect(
        isOverdue({
          completed: false,
          dueDate: "",
        })
      ).toBe(false);
    });

    it("should return false for completed tasks", () => {
      expect(
        isOverdue({
          completed: true,
          dueDate: "2020-01-01",
        })
      ).toBe(false);
    });

    it("should return true for overdue tasks", () => {
      expect(
        isOverdue({
          completed: false,
          dueDate: "2020-01-01",
        })
      ).toBe(true);
    });
  });

  describe("formatDueDate", () => {
    it('should return "No due date" for empty values', () => {
      expect(
        formatDueDate("")
      ).toBe("No due date");
    });

    it("should format valid dates", () => {
      expect(
        formatDueDate("2026-10-05")
      ).not.toBe("No due date");
    });
  });

  describe("getFilteredTodos", () => {
    beforeEach(() => {
      state.todos = [
        {
          id: "1",
          text: "Learn Claude",
          completed: false,
          priority: "high",
          dueDate: "",
        },
        {
          id: "2",
          text: "Learn Testing",
          completed: true,
          priority: "medium",
          dueDate: "",
        },
      ];
    });

    it("should return all todos", () => {
      state.filter = "all";

      expect(
        getFilteredTodos()
      ).toHaveLength(2);
    });

    it("should return active todos", () => {
      state.filter = "active";

      expect(
        getFilteredTodos()
      ).toHaveLength(1);
    });

    it("should return completed todos", () => {
      state.filter = "completed";

      expect(
        getFilteredTodos()
      ).toHaveLength(1);
    });

    it("should apply search filter", () => {
      state.filter = "all";
      state.searchTerm = "claude";

      expect(
        getFilteredTodos()
      ).toHaveLength(1);
    });

    it("should return empty array when search does not match", () => {
      state.searchTerm = "xyz";

      expect(
        getFilteredTodos()
      ).toHaveLength(0);
    });
  });
});

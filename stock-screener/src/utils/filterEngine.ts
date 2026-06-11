import type { Stock } from "@/types/stock";
import type {
  FilterRule,
  NumericFilterRule,
  CategoricalFilterRule,
  TextFilterRule,
  NumericOperator,
  CategoricalOperator,
  TextOperator,
} from "@/types/filter";

export type LogicalOperator = "AND" | "OR";

export interface LogicalGroup {
  id: string;
  kind: "logical";
  operator: LogicalOperator;
  rules: (FilterRule | LogicalGroup)[];
}

export type ASTNode = FilterRule | LogicalGroup;

/**
 * Singleton cache for compiled filter functions.
 * Keys are stringified representation of the AST node.
 */
const compilationCache = new Map<string, (stock: Stock) => boolean>();

/**
 * Stringifies an AST node for caching purposes.
 */
function serializeAST(node: ASTNode): string {
  return JSON.stringify(node);
}

/**
 * Compiles a single numeric rule into a high-speed boolean test.
 */
function compileNumericRule(rule: NumericFilterRule): (stock: Stock) => boolean {
  const { field, operator, value } = rule;

  if (operator === "between") {
    const [min, max] = value as [number, number];
    return (stock: Stock) => {
      const val = stock[field];
      if (val === null || val === undefined) return false;
      return val >= min && val <= max;
    };
  }

  const valCompare = value as number;

  switch (operator) {
    case "gt":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val > valCompare;
      };
    case "gte":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val >= valCompare;
      };
    case "lt":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val < valCompare;
      };
    case "lte":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val <= valCompare;
      };
    case "eq":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val === valCompare;
      };
    default:
      return () => true;
  }
}

/**
 * Compiles a single categorical rule (e.g. Sector in Technology, Healthcare)
 */
function compileCategoricalRule(rule: CategoricalFilterRule): (stock: Stock) => boolean {
  const { field, operator, value } = rule;
  
  // Set lookup is O(1)
  const valueSet = new Set(value);

  if (operator === "in") {
    return (stock: Stock) => {
      const val = stock[field];
      return val !== null && val !== undefined && valueSet.has(val as any);
    };
  } else if (operator === "notIn") {
    return (stock: Stock) => {
      const val = stock[field];
      return val === null || val === undefined || !valueSet.has(val as any);
    };
  }

  return () => true;
}

/**
 * Compiles a single text search rule (e.g. Name contains "Inc")
 */
function compileTextRule(rule: TextFilterRule): (stock: Stock) => boolean {
  const { field, operator, value } = rule;
  const searchStr = value.toLowerCase().trim();

  if (!searchStr) return () => true;

  switch (operator) {
    case "contains":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val.toLowerCase().includes(searchStr);
      };
    case "startsWith":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val.toLowerCase().startsWith(searchStr);
      };
    case "eq":
      return (stock: Stock) => {
        const val = stock[field];
        return val !== null && val !== undefined && val.toLowerCase() === searchStr;
      };
    default:
      return () => true;
  }
}

/**
 * Compiles a leaf rule node into a stock filter tester.
 */
export function compileRule(rule: FilterRule): (stock: Stock) => boolean {
  switch (rule.kind) {
    case "numeric":
      return compileNumericRule(rule);
    case "categorical":
      return compileCategoricalRule(rule);
    case "text":
      return compileTextRule(rule);
    default:
      return () => true;
  }
}

/**
 * Compiles a logical group of rules (AND/OR) with short-circuit evaluation.
 */
function compileLogicalGroup(group: LogicalGroup): (stock: Stock) => boolean {
  const { operator, rules } = group;

  if (rules.length === 0) return () => true;

  // Pre-compile all child nodes recursively
  const compiledChildren = rules.map((r) => compileAST(r));

  if (operator === "AND") {
    // Short-circuited AND logic
    return (stock: Stock) => {
      for (let i = 0; i < compiledChildren.length; i++) {
        if (!compiledChildren[i](stock)) {
          return false; // Exit early on first false
        }
      }
      return true;
    };
  } else {
    // Short-circuited OR logic
    return (stock: Stock) => {
      for (let i = 0; i < compiledChildren.length; i++) {
        if (compiledChildren[i](stock)) {
          return true; // Exit early on first true
        }
      }
      return false; // None matched
    };
  }
}

/**
 * Compiles any arbitrary AST Node (Rule or Group) into a compiled function.
 * Uses a caching mechanism to avoid re-compilation of identical structures.
 */
export function compileAST(node: ASTNode): (stock: Stock) => boolean {
  const cacheKey = serializeAST(node);
  const cached = compilationCache.get(cacheKey);
  if (cached) return cached;

  let compiled: (stock: Stock) => boolean;

  if (node.kind === "logical") {
    compiled = compileLogicalGroup(node);
  } else {
    compiled = compileRule(node);
  }

  compilationCache.set(cacheKey, compiled);
  return compiled;
}

/**
 * Filters a stock list using a compiled AST node.
 * Evaluates the 5000+ list under highly optimized, cached JIT execution.
 */
export function filterStocks(stocks: Stock[], node: ASTNode): Stock[] {
  const tester = compileAST(node);
  
  // Fast pre-allocated array filtering
  const result: Stock[] = [];
  for (let i = 0; i < stocks.length; i++) {
    if (tester(stocks[i])) {
      result.push(stocks[i]);
    }
  }
  return result;
}

/**
 * Utility: Compiles a flat array of rules and a combining operator
 * directly into a runnable test function (convenient for flatter UI setups).
 */
export function compileFlatRules(
  rules: FilterRule[],
  operator: LogicalOperator = "AND"
): (stock: Stock) => boolean {
  if (rules.length === 0) return () => true;

  const mockGroup: LogicalGroup = {
    id: "flat-root",
    kind: "logical",
    operator,
    rules,
  };

  return compileAST(mockGroup);
}

/**
 * Executes a high-performance filtering operation on an array of stocks.
 */
export function filterStocksFlat(
  stocks: Stock[],
  rules: FilterRule[],
  operator: LogicalOperator = "AND"
): Stock[] {
  const tester = compileFlatRules(rules, operator);
  const result: Stock[] = [];
  for (let i = 0; i < stocks.length; i++) {
    if (tester(stocks[i])) {
      result.push(stocks[i]);
    }
  }
  return result;
}

/**
 * Clears the compilation cache. Useful on theme changes,
 * garbage collection cycles, or dynamic resetting.
 */
export function clearCompilationCache(): void {
  compilationCache.clear();
}

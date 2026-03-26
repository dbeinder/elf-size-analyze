# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

elf-size-analyze is a Python CLI tool that parses ELF files using binutils (`readelf`, `nm`, `c++filt`) to analyze memory usage (ROM/RAM) of compiled programs. It presents symbol sizes organized by source file paths as an ASCII tree, JSON, HTML, or interactive Plotly graphs. Primarily used for embedded systems memory optimization.

## Development Setup

```bash
python -m venv venv
source ./venv/bin/activate
pip install -e ".[dev,plotly]"
```

## Commands

```bash
# Run the tool
elf-size-analyze <ELF_FILE> -R -F    # Show RAM and ROM stats
python -m elf_size_analyze <ELF_FILE> -R -F  # Alternative invocation

# Lint
pylint src/elf_size_analyze/

# Format
black src/

# Test
pytest
```

There are no tests in the repo currently. The `tree.py` module has an inline `test__TreeNode()` function (commented out) but no pytest tests exist.

## Architecture

Two entry points defined in `pyproject.toml`:
- `elf-size-analyze` → `__main__:main` — main CLI for analyzing ELF files
- `elf-size-graph` → `plotly:main` — standalone CLI for rendering Plotly graphs from JSON output

### Data flow in `__main__.main()`

1. **Parse symbols**: `Symbol.extract_elf_symbols_info()` runs `readelf --wide --syms` and parses output via regex
2. **Add file info**: `extract_elf_symbols_fileinfo()` runs `nm --portability --line-numbers` to get source file/line for each symbol
3. **Demangle**: `demangle_symbol_names()` pipes symbol names through `c++filt`
4. **Parse sections**: `Section.extract_sections_info()` runs `readelf --wide --section-headers`
5. **Filter**: Symbols filtered by section type (ROM=ALLOC+not NOBITS, RAM=ALLOC+WRITE)
6. **Build tree**: `SymbolsTreeByPath` organizes symbols into a file-path-based tree using `TreeNode`
7. **Output**: Renders as ASCII tree, JSON dict, HTML (static template in `html/`), or Plotly graph

### Key classes

- `TreeNode` (`tree.py`) — generic tree with pre/post-order iterators
- `SymbolsTreeByPath.Node` (`symbol_tree.py`) — extends TreeNode; nodes are either path components or Symbols. Handles path merging, cumulative size accumulation, and all output rendering
- `Symbol` (`symbol.py`) — parsed from readelf output via regex
- `Section` (`section.py`) — parsed from readelf output via regex; determines ROM/RAM classification via flags

### Versioning

Uses `setuptools-git-versioning` — version is derived from git tags, not hardcoded.

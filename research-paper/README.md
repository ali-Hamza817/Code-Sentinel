# CodeSentinel — Research Paper

LaTeX source for the paper *"CodeSentinel: A Local-First Platform for
Large-Language-Model-Assisted Static and Dynamic Source-Code Security
Auditing."*

- **Format:** IEEE conference, two columns (`\documentclass[conference]{IEEEtran}`).
- **Bibliography:** `biblatex` + `biber`, IEEE style — citations, cross-references,
  and URLs are all clickable (via `hyperref` + `cleveref`).
- **Figures:** three vector diagrams in TikZ (`figures/diagrams/`) plus the
  product screenshots (`figures/screens/`).

## Folder layout

```
research-paper/
├── main.tex                 # root document — set this as the main file
├── references.bib           # BibTeX database (biber backend)
├── sections/
│   ├── abstract.tex
│   ├── introduction.tex
│   ├── related-work.tex
│   ├── methodology.tex
│   ├── interface.tex
│   ├── results.tex
│   ├── discussion.tex
│   ├── conclusion.tex
│   ├── declarations.tex
│   └── tables/             # every table, one file each
├── figures/
│   ├── diagrams/           # fig-architecture / fig-pipeline / fig-riskmodel (TikZ)
│   └── screens/            # interface screenshots (PNG, 2880×1800)
└── README.md
```

## Build locally

```bash
cd research-paper
latexmk -pdf main.tex        # runs pdflatex + biber + pdflatex ×2
# or:  pdflatex main  &&  biber main  &&  pdflatex main  &&  pdflatex main
```

Output: `main.pdf`.

## Build on Overleaf

1. Compress this `research-paper/` folder to a `.zip`.
2. Overleaf → **New Project → Upload Project** → select the zip.
3. **Menu → Settings**: Compiler = **pdfLaTeX**, TeX Live = a recent
   version. Main document = `main.tex`.
4. Recompile. Overleaf runs `biber` automatically for the bibliography.

## Before submission

- The author block in `main.tex` has `[Institution]` / `[City, Country]` /
  `[author email]` placeholders — fill these in.
- `references.bib` carries a note: re-verify page ranges and DOIs against
  the publisher of record.
- The `Use of generative AI` paragraph in `sections/declarations.tex`
  discloses AI drafting assistance; keep or adapt it to the target venue's
  policy.
- The case study (`sections/results.tex`) is presented as an *illustrative
  walkthrough* on a synthetic subject, not an accuracy benchmark; the
  paper states this explicitly and lists empirical evaluation as future
  work.

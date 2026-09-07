# CodeSentinel — Research Paper

LaTeX source for the paper *"CodeSentinel: A Local-First Platform for
Large-Language-Model-Assisted Static and Dynamic Source-Code Security
Auditing."*

- **Format:** IEEE conference, two columns (`\documentclass[conference]{IEEEtran}`).
- **Bibliography:** classic `\bibliographystyle{IEEEtran}` + BibTeX (numbered
  `[n]` references). Citations, cross-references and URLs are all clickable
  (via `hyperref` + `cleveref`).
- **Figures:** three vector diagrams in TikZ (`figures/diagrams/`) plus the
  product screenshots (`figures/screens/`).
- **`main.pdf` in this folder** is a reference build produced with TeX Live 2026
  (`pdflatex` + `bibtex`) — the same toolchain Overleaf runs. 11 pages.

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
latexmk -pdf main.tex        # pdflatex + bibtex + pdflatex ×2
# or:  pdflatex main  &&  bibtex main  &&  pdflatex main  &&  pdflatex main
```

Output: `main.pdf`. Needs a TeX distribution with `IEEEtran`, `pgf/tikz`,
`biblatex`-free `IEEEtran.bst`, `hyperref`, `cleveref`, `subcaption`,
`makecell`, `stfloats` (all in a full TeX Live).

## Build on Overleaf

1. Compress this `research-paper/` folder to a `.zip`.
2. Overleaf → **New Project → Upload Project** → select the zip.
3. **Menu → Settings**: Compiler = **pdfLaTeX**, TeX Live = a recent
   version. Main document = `main.tex`.
4. Recompile. Overleaf runs `bibtex` automatically for the bibliography
   (you may need to recompile once more so all `[n]` citations resolve).

## Before submission

- The author block in `main.tex` has `[Institution]` / `[City, Country]` /
  `[author email]` placeholders — fill these in.
- `references.bib` carries a note: re-verify page ranges and DOIs against
  the publisher of record. If the target venue requires `biblatex`, switch
  the two bibliography lines in `main.tex` back to
  `\usepackage[style=ieee,backend=biber]{biblatex}` /
  `\addbibresource{references.bib}` / `\printbibliography` and set the
  Overleaf compiler bibliography engine to Biber.
- The `Use of generative AI` paragraph in `sections/declarations.tex`
  discloses AI drafting assistance; keep or adapt it to the target venue's
  policy.
- The case study (`sections/results.tex`) is presented as an *illustrative
  walkthrough* on a synthetic subject, not an accuracy benchmark; the
  paper states this explicitly and lists empirical evaluation as future
  work.

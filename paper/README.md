# Academic Research Paper Bundle

This directory contains the complete IEEE conference-style research paper for the project:
**"AI-Based Secure Online Voting System Using MERN Stack and Machine Learning"**

---

## Files in this Directory

1. **`paper.tex`**: The primary LaTeX source file formatted according to the official double-column IEEE conference specifications (`IEEEtran.cls`).
2. **`references.bib`**: Complete BibTeX database containing 30 academic citations covering e-voting protocols, biometric anti-spoofing, Isolation Forests, and cryptographic ledgers.
3. **`IEEEtran.cls`**: The official IEEE class file included locally so the bundle is completely standalone and portable.
4. **`confusion_matrix.png`**: The empirical confusion matrix plot generated from our held-out test partition evaluation ($N=2,650$).
5. **`roc_curve.png`**: The empirical Receiver Operating Characteristic (ROC) curve showing an AUC of 0.9885.
6. **`paper_preview.md`**: The full unified text of the paper rendered in GitHub-flavored Markdown for immediate reading, reviewing, or copying.

---

## How to Compile to PDF

### Option 1: Overleaf (1-Click & Recommended)
1. Go to [https://www.overleaf.com](https://www.overleaf.com) and log in.
2. Click **New Project** → **Upload Project**.
3. Select this `paper/` folder (or zip it and upload).
4. Set the main document to `paper.tex` and click **Recompile**.
5. Download your publication-ready **PDF**.

### Option 2: Local LaTeX Installation (TeX Live, MiKTeX, or MacTeX)
Run the standard LaTeX compilation cycle in your terminal inside the `paper/` directory:
```bash
pdflatex paper.tex
bibtex paper
pdflatex paper.tex
pdflatex paper.tex
```
This produces `paper.pdf` with complete cross-references and bibliography formatting.

---

## Citation Verification Notice
As requested for rigorous academic integrity, all 30 references in `references.bib` and `paper_preview.md` are tagged with `[NEEDS VERIFICATION]`. Verify author names, conference/journal volume numbers, and DOIs prior to camera-ready submission.


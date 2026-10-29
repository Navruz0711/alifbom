# Alifbo

Static Uzbek alphabet converter. Serve `dist` over HTTP; document processing stays in the browser.

## Features
- Live text conversion in either direction.
- DOCX and PPTX conversion with original package media, run properties, and layout XML retained. Digraphs spanning text runs are handled together; paragraph and explicit break boundaries are preserved.
- PDF text extraction and export as a new PDF using PDF.js, pdf-lib and an embedded Noto Sans font. TXT remains available as a secondary text-only download.
- Drag/drop or picker, progress, error messages, preview and download.
- Limits: 20 MB input, 80 MB expanded archive, 300 PDF pages, 1 million text characters.

## Limitations
No OCR, legacy DOC/PPT, encrypted documents, embedded documents, chart labels, image text, or guarantee of exact pagination with different text widths. PDF results are newly typeset text PDFs; source images, tables and exact layouts are not preserved. Strict OOXML namespaces are not yet supported. Main body/slide text is shown in preview; supported headers/footers/notes also convert in the downloaded document.

## Verification
Serve project root and open `/tests/runner.html` to run browser tests with synthetic fixtures. Tests cover split styled runs, unchanged media, headers, presentation relationship order, reverse capitalization, PDF extraction, no-text PDF errors, corrupt/unsupported files, and size limits. Fixtures are test inputs, not document templates.

## Bundled libraries
- JSZip 3.10.2 (MIT/GPL dual licensed), `dist/vendor/JSZIP-LICENSE.md`.
- pdf-lib 1.17.1 and @pdf-lib/fontkit 1.1.1; Noto Sans under SIL OFL.
- PDF.js 6.4.299 (Apache 2.0), `dist/vendor/pdfjs/LICENSE`.
- API references: https://mozilla.github.io/pdf.js/examples/ and https://stuk.github.io/jszip/documentation/api_jszip/load_async.html

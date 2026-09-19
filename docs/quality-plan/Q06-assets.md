# Q06 — Asset provenance

Status: planned. Dependencies: none. Required before public distribution.

## Work

- Inventory shipped and loaded artwork against [SOURCES.md](../../public/assets/SOURCES.md) and the [manifest](../../src/assets/assetManifest.ts).
- Seek original source/author and applicable usage evidence for the three owner-supplied backgrounds. Read actual source terms before drawing conclusions; filenames or owner delivery alone are not provenance.
- If provenance cannot be established, replace the backgrounds with self-created or explicitly licensed compatible artwork. Preserve the visual day/crossfade/night roles, readable food, and coherent pixel-art presentation. Follow applicable image-creation skills if generating raster art.
- Record author/source, modifications, and usage terms for replacements. Retain supplied documentation and explicit license files where available for character/food art; do not invent a license grant or relicense third-party files.
- Remove superseded unknown-source backgrounds from the deliverable when replacing them. Do not rewrite Git history. Record whether earlier commits still contain them and address that fact before any later public repository publication.

## Acceptance and verification

- Every distributed artwork file has a documented source and applicable usage evidence, or is documented as self-created. All three backgrounds have a resolved outcome.
- Required character/food assets and their attribution remain intact. Any unresolved usage terms are explicit acceptance gaps, not a completed provenance check.
- Replacement assets load in development and production and work through the complete background cycle. Browser inspection checks contrast, crop, dimensions, and console/load errors.
- Run checks appropriate to changed manifest/rendering files and verify local attribution links. Update README attribution status to reflect evidence.
- If resolution requires owner information, specify exactly what is missing and complete other independent work. Do not publish as part of this task.

## Evidence

Not started.

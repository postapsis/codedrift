/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */

import type { DiffChangeType, DiffFileData } from "../@types/diff.ts";

const diffContent = `diff --git a/flightdrift-frontend/src/routes/auth/signin.tsx b/flightdrift-frontend/src/routes/auth/signin.tsx
index 8de9e3d..e8b4d74 100644
--- a/flightdrift-frontend/src/routes/auth/signin.tsx
+++ b/flightdrift-frontend/src/routes/auth/signin.tsx
@@ -72,6 +72,7 @@ const Signin = (): JSX.Element => {
             }}>
             {(field) => {
               const error = getFieldError(field.state.meta.errors);
+              const errorId = \`\${field.name}-error\`;

               return (
                 <Field>
@@ -82,10 +83,11 @@ const Signin = (): JSX.Element => {
                     autoComplete="username"
                     value={field.state.value}
                     aria-invalid={Boolean(error)}
+                    aria-describedby={error ? errorId : undefined}
                     onBlur={field.handleBlur}
                     onChange={(event) => field.handleChange(event.target.value.trim())}
                   />
-                  <FieldError>{error}</FieldError>
+                  <FieldError id={errorId}>{error}</FieldError>
                 </Field>
               );
             }}
@@ -99,6 +101,7 @@ const Signin = (): JSX.Element => {
             }}>
             {(field) => {
               const error = getFieldError(field.state.meta.errors);
+              const errorId = \`\${field.name}-error\`;

               return (
                 <Field>
@@ -110,10 +113,11 @@ const Signin = (): JSX.Element => {
                     autoComplete="current-password"
                     value={field.state.value}
                     aria-invalid={Boolean(error)}
+                    aria-describedby={error ? errorId : undefined}
                     onBlur={field.handleBlur}
                     onChange={(event) => field.handleChange(event.target.value)}
                   />
-                  <FieldError>{error}</FieldError>
+                  <FieldError id={errorId}>{error}</FieldError>
                 </Field>
               );
             }}
diff --git a/flightdrift-frontend/src/routes/auth/signup.tsx b/flightdrift-frontend/src/routes/auth/signup.tsx
index afec1bc..45ddc13 100644
--- a/flightdrift-frontend/src/routes/auth/signup.tsx
+++ b/flightdrift-frontend/src/routes/auth/signup.tsx
@@ -81,6 +81,7 @@ const Signup = (): JSX.Element => {
             }}>
             {(field) => {
               const error = getFieldError(field.state.meta.errors);
+              const errorId = \`\${field.name}-error\`;

               return (
                 <Field>
@@ -91,10 +92,11 @@ const Signup = (): JSX.Element => {
                     autoComplete="name"
                     value={field.state.value}
                     aria-invalid={Boolean(error)}
+                    aria-describedby={error ? errorId : undefined}
                     onBlur={field.handleBlur}
                     onChange={(event) => field.handleChange(event.target.value.trim())}
                   />
-                  <FieldError>{error}</FieldError>
+                  <FieldError id={errorId}>{error}</FieldError>
                 </Field>
               );
             }}`;

/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
export class DiffService {

  static normalizeDiffPath(path: string): string {
    if (path === "/dev/null") {
      return path;
    }

    if (path.startsWith("a/") || path.startsWith("b/")) {
      return path.slice(2);
    }

    return path;
  }

  static getHeaderPath(lines: string[], prefix: string): string {
    const header = lines.find((line) => line.startsWith(prefix));

    if (!header) {
      return "";
    }

    return DiffService.normalizeDiffPath(header.slice(prefix.length).trim());
  }

  static getFileLanguage(fileName: string): string {
    const segments = fileName.split(".");

    return segments.length > 1 ? (segments.at(-1) ?? "text") : "text";
  };

  static getDiffChangeType(oldFileName: string, newFileName: string, rawDiff: string,): DiffChangeType {
    if (rawDiff.includes("\nnew file mode ") || oldFileName === "/dev/null") {
      return "added";
    }

    if (rawDiff.includes("\ndeleted file mode ") || newFileName === "/dev/null") {
      return "deleted";
    }

    if (rawDiff.includes("\nrename from ") || rawDiff.includes("\nrename to ")) {
      return "moved";
    }

    if (oldFileName && newFileName && oldFileName !== newFileName) {
      return "moved";
    }

    return "changed";
  }

  static splitDiffBlocks(diffContent: string): string[] {
    const normalizedDiff = diffContent.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    if (!normalizedDiff) {
      return [];
    }

    for (const line of normalizedDiff.split("\n")) {
      if (line.startsWith("diff --git ") && currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }

      currentBlock.push(line);
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join("\n"));
    }

    return blocks;
  }

  static parseDiffFiles(diffContent: string): DiffFileData[] {
    return DiffService.splitDiffBlocks(diffContent).map((rawDiff) => {
      const lines = rawDiff.split("\n");
      const oldFileName = DiffService.getHeaderPath(lines, "--- ");
      const newFileName = DiffService.getHeaderPath(lines, "+++ ");
      const fileName = newFileName === "/dev/null" ? oldFileName : newFileName || oldFileName;

      return {
        oldFileName,
        newFileName,
        fileLanguage: DiffService.getFileLanguage(fileName),
        rawDiff,
        changeType: DiffService.getDiffChangeType(oldFileName, newFileName, rawDiff),
      };
    });
  }

  static getDiffContent(): string {
    return diffContent;
  }
}

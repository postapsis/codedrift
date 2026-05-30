/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import "dotenv/config";
import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

const diffContent =
  "diff --git a/flightdrift-frontend/src/routes/auth/signin.tsx " +
  "b/flightdrift-frontend/src/routes/auth/signin.tsx\n" +
  `index 8de9e3d..e8b4d74 100644
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

fastify.addHook("onRequest", async (request, reply): Promise<void> => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    await reply.status(204).send();
  }
});

fastify.get("/", async function handler() {
  return { hello: "world" };
});

fastify.get("/diff", async (): Promise<string> => diffContent);

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

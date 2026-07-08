/*
 * Author: Jamius Siam
 * Since: 05/07/2026
 */
import type { JSX } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/review/mermaid-diagram.tsx";
import { THIN_SCROLLBAR_CLASS } from "@/lib/style-utils.ts";
import { cn } from "@/lib/utils.ts";

interface MarkdownContentProps {
  markdown: string;
  prose?: boolean;
  className?: string;
  markdownComponentClasses?: Partial<Record<keyof JSX.IntrinsicElements, string>>;
}

function getMarkdownComponents(
  classes: Partial<Record<keyof JSX.IntrinsicElements, string>>,
): Components {
  return {
    h1: ({ children }) => (
      <h1 className={cn("font-heading text-lg font-semibold text-foreground", classes["h1"])}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={cn("font-heading text-base font-semibold text-foreground", classes["h2"])}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={cn("font-heading text-sm font-semibold text-foreground", classes["h3"])}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className={cn("font-heading text-sm font-semibold text-foreground", classes["h4"])}>
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className={cn("text-sm leading-relaxed text-foreground/90", classes["p"])}>{children}</p>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "text-blue-600 underline underline-offset-2 hover:text-blue-700",
          classes["a"],
        )}>
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground/90">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-foreground/90">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          "border-l-2 border-border pl-3 text-sm italic text-muted-foreground",
          classes["blockquote"],
        )}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className={`overflow-x-auto ${THIN_SCROLLBAR_CLASS}`}>
        <table className={cn("w-full border-collapse text-sm", classes["table"])}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th
        className={cn(
          "border border-border bg-muted/40 px-2 py-1 text-left font-semibold",
          classes["th"],
        )}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={cn("border border-border px-2 py-1", classes["td"])}>{children}</td>
    ),
    hr: () => <hr className={cn("border-border", classes["hr"])} />,
    pre: ({ children }) => <span className={classes["pre"]}>{children}</span>,
    code: ({ className, children }) => {
      const language = /language-(\w+)/.exec(className ?? "")?.[1];

      if (language === "mermaid") {
        return <MermaidDiagram code={String(children).trim()} />;
      }

      if (language) {
        return (
          <pre
            className={cn(
              "overflow-x-auto rounded-md border border-border bg-muted/40 p-3 " +
                `font-mono text-xs leading-relaxed ${THIN_SCROLLBAR_CLASS}`,
              classes["pre"],
            )}>
            <code>{children}</code>
          </pre>
        );
      }

      return (
        <code className={cn("rounded bg-muted/70 px-1 py-0.5 font-mono text-xs", classes["code"])}>{children}</code>
      );
    },
  };
}

function getProseMarkdownComponents(classes: Partial<Record<string, string>>): Components {
  return {
    pre: ({ children }) => <span className={classes["pre"]}>{children}</span>,
    code: ({ className, children }) => {
      const language = /language-(\w+)/.exec(className ?? "")?.[1];

      if (language === "mermaid") {
        return (
          <div className="not-prose">
            <MermaidDiagram code={String(children).trim()} />
          </div>
        );
      }

      if (language) {
        return (
          <pre className={cn(`overflow-x-auto ${THIN_SCROLLBAR_CLASS}`, classes["pre"])}>
            <code>{children}</code>
          </pre>
        );
      }

      return <code>{children}</code>;
    },
  };
}

const MarkdownContent = ({
  markdown,
  prose = false,
  className = "",
  markdownComponentClasses = {},
}: MarkdownContentProps): JSX.Element => {
  if (prose) {
    return (
      <div className={cn("prose max-w-none prose-headings:font-heading", className)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={getProseMarkdownComponents(markdownComponentClasses)}>
          {markdown}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={getMarkdownComponents(markdownComponentClasses)}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;

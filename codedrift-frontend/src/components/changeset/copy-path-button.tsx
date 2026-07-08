/*
 * Author: Jamius Siam
 * Since: 08/07/2026
 */
import { type JSX, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const CopyPathButton = ({ value }: { value: string }): JSX.Element => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button variant="ghost" size="icon-xs" onClick={handleCopy} aria-label="Copy file path">
      {copied ? <Check /> : <Copy />}
    </Button>
  );
};

export default CopyPathButton;

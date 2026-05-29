import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import * as prettier from "prettier/standalone";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";

interface QueryInputProps {
  query: string;
  setQuery: (val: string) => void;
  loading: boolean;
  generateResult: (e?: React.FormEvent<HTMLFormElement>) => void;
  onRunClick?: () => void; // Optional handler for "Run"
}

export const QueryInput = ({
  query,
  setQuery,
  loading,
  generateResult,
}: QueryInputProps) => {

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text/plain");
    try {
      const formatted = await prettier.format(text, {
        parser: "babel",
        plugins: [prettierPluginBabel, prettierPluginEstree],
      });
      e.preventDefault();
      setQuery(query + formatted);
    } catch (err) {
      // Not JS code, let normal browser paste proceed
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={generateResult as any} className="relative flex items-end bg-[#1e1e24] rounded-3xl border border-white/10 shadow-lg focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all pr-14 pl-6 pt-4 pb-4 min-h-[56px]">
        <TextareaAutosize
          minRows={1}
          maxRows={8}
          placeholder="Ask CLARIX anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (query.trim() && !loading) {
                generateResult();
              }
            }
          }}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-base text-white placeholder:text-gray-500 scrollbar-hide flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !query.trim()}
          className="absolute right-3 bottom-3 h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50 disabled:bg-gray-700"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </Button>
      </form>
    </div>
  );
};

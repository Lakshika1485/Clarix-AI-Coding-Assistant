import ReactMarkdown from "react-markdown";

interface AIComparisonCardProps {
  data: any;
}

export const AIComparisonCard = ({ data }: AIComparisonCardProps) => {
  if (!data?.answer) return null;

  // Clean the answer - remove any JSON wrapper if AI accidentally included it
  let answer = data.answer;
  
  // If answer contains JSON structure, extract just the answer value
  if (typeof answer === "string") {
    // Remove escaped quotes artifacts
    answer = answer.replace(/\\"/g, '"').replace(/\\n/g, '\n');
    
    // If the whole answer looks like JSON, try to extract answer field
    if (answer.trim().startsWith("{") && answer.includes('"answer"')) {
      try {
        const parsed = JSON.parse(answer);
        if (parsed.answer) answer = parsed.answer;
      } catch {
        // keep as is
      }
    }
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }: any) {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <pre className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto text-xs font-mono my-3">
                <code>{children}</code>
              </pre>
            ) : (
              <code className="bg-gray-100 dark:bg-white/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 leading-relaxed text-sm">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-3 space-y-1 text-sm">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-sm leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-bold mb-1 text-gray-900 dark:text-white">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>;
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-500 my-3">{children}</blockquote>;
          },
        }}
      >
        {answer}
      </ReactMarkdown>
    </div>
  );
};

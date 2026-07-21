import React from 'react';

// Helper to format inline markdown formatting (**bold**, `code`)
function renderInlineText(text) {
  if (!text) return null;

  // Split by bold (**bold**) and inline code (`code`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-black text-black dark:text-white bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded-xs">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-[11px] bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white px-1.5 py-0.5 rounded-xs border border-black/20 dark:border-white/20">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function MarkdownMessage({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const blocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }
  let currentTable = null; // { headers: [], rows: [] }

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="space-y-2 my-2.5 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white shrink-0 mt-1.5" />
                <span className="flex-1">{renderInlineText(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="space-y-2 my-2.5 pl-1">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed">
                <span className="font-black bg-black text-white dark:bg-white dark:text-black text-[9px] px-1.5 py-0.5 shrink-0 border border-black dark:border-white leading-none mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{renderInlineText(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      blocks.push(
        <div key={`table-${blocks.length}`} className="my-3 overflow-x-auto border border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-900 border-b border-black dark:border-white">
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="p-2 font-black uppercase tracking-wider text-[10px] border-r border-neutral-300 dark:border-neutral-700 last:border-r-0">
                    {renderInlineText(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 text-xs">
                      {renderInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check table line
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1);
      // Ignore separator row like |---|---|
      if (cells.every(c => c.trim().match(/^:?-+:?$/))) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Check Unordered List (* item or - item)
    const ulMatch = line.match(/^[\*\-]\s+(.*)/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [ulMatch[1]] };
      } else {
        currentList.items.push(ulMatch[1]);
      }
      continue;
    }

    // Check Numbered List (1. item)
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [olMatch[1]] };
      } else {
        currentList.items.push(olMatch[1]);
      }
      continue;
    }

    // If not a list item, flush existing list
    flushList();

    // Blank line
    if (!line) {
      blocks.push(<div key={`space-${i}`} className="h-2" />);
      continue;
    }

    // Headings (### or ## or #)
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${i}`} className="font-black text-sm sm:text-base uppercase tracking-wider border-b-2 border-black dark:border-white pb-1.5 mt-4 mb-2">
            {renderInlineText(title)}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={`h2-${i}`} className="font-black text-xs sm:text-sm uppercase tracking-wider border-b border-black dark:border-white pb-1 mt-3 mb-2">
            {renderInlineText(title)}
          </h2>
        );
      } else {
        blocks.push(
          <h3 key={`h3-${i}`} className="font-extrabold text-xs uppercase tracking-wide mt-3 mb-1 text-black dark:text-white">
            {renderInlineText(title)}
          </h3>
        );
      }
      continue;
    }

    // Paragraph line
    blocks.push(
      <p key={`p-${i}`} className="text-xs leading-relaxed my-1">
        {renderInlineText(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className="space-y-1 text-black dark:text-white">{blocks}</div>;
}

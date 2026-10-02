export function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  let text = value == null ? '' : String(value);

  if (/^[=+\-@]/.test(text) || text.startsWith('\t') || text.startsWith('\r')) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

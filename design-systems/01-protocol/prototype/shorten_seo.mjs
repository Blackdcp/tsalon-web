import fs from 'fs';

const files = [
  'src/content/articles/memory-poisoning.md',
  'src/content/articles-en/memory-poisoning.md',
  'src/content/articles/dreaming-ai-memory.md',
  'src/content/articles-en/dreaming-ai-memory.md'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // replace seo.title
  content = content.replace(/seo:\n\s*title: "(.*)"/, (match, title) => {
    if (title.length > 65) {
      return `seo:\n  title: "${title.substring(0, 62)}..."`;
    }
    return match;
  });
  
  // replace seo.description
  content = content.replace(/description: "(.*)"/, (match, desc) => {
    if (desc.length > 180) {
      return `description: "${desc.substring(0, 177)}..."`;
    }
    return match;
  });
  
  fs.writeFileSync(file, content);
}

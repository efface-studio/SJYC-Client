export function EditorIndex({ sections }: { sections: string[] }) {
  return (
    <nav aria-label="편집 항목" className="editor-index">
      {sections.map((title) => (
        <a key={title} href={'#edit-' + title.replaceAll(' ', '-')}>
          {title}
        </a>
      ))}
    </nav>
  );
}

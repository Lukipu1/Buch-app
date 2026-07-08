import { bookRepository, getDatabase, pageRepository } from '@/services/database';

/**
 * Seeds a few sample books so the library, detail, reader and search screens
 * have content during development. Runs only when the database is empty and is
 * safe to call on every launch.
 *
 * The page images use remote placeholder URLs purely for the mock; real scans
 * are always stored locally.
 */

interface MockBook {
  title: string;
  author: string;
  pages: { imageUri: string; ocrText: string }[];
}

const PLACEHOLDER = (seed: string) =>
  `https://picsum.photos/seed/${seed}/800/1100`;

const MOCK_BOOKS: MockBook[] = [
  {
    title: 'Die Kunst des klaren Denkens',
    author: 'Rolf Dobelli',
    pages: [
      {
        imageUri: PLACEHOLDER('denken-1'),
        ocrText:
          'Warum wir systematische Denkfehler machen und wie wir sie vermeiden. Der Survivorship Bias führt dazu, dass wir Erfolge systematisch überschätzen.',
      },
      {
        imageUri: PLACEHOLDER('denken-2'),
        ocrText:
          'Der Bestätigungsfehler ist die Mutter aller Denkfehler. Wir filtern Informationen so, dass sie zu unseren bestehenden Überzeugungen passen.',
      },
      {
        imageUri: PLACEHOLDER('denken-3'),
        ocrText:
          'Sunk Cost Fallacy: Bereits investierte Zeit und Geld sollten für zukünftige Entscheidungen keine Rolle spielen, tun es aber oft doch.',
      },
    ],
  },
  {
    title: 'Notizen aus dem Untergrund',
    author: 'Fjodor Dostojewski',
    pages: [
      {
        imageUri: PLACEHOLDER('untergrund-1'),
        ocrText:
          'Ich bin ein kranker Mensch. Ich bin ein böser Mensch. Ein abstoßender Mensch bin ich. Ich glaube, meine Leber ist krank.',
      },
      {
        imageUri: PLACEHOLDER('untergrund-2'),
        ocrText:
          'Der Mensch braucht nur den selbständigen Willen, was dieser Selbständigkeit auch kosten und wohin sie auch führen möge.',
      },
    ],
  },
  {
    title: 'Reise-Skizzenbuch',
    author: 'Eigene Aufzeichnungen',
    pages: [
      {
        imageUri: PLACEHOLDER('reise-1'),
        ocrText:
          'Tag 1: Ankunft in Lissabon. Die Straßenbahn 28 schlängelt sich durch die Alfama. Notiz: den Aussichtspunkt Miradouro bei Sonnenuntergang besuchen.',
      },
    ],
  },
];

export async function seedMockDataIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM books;',
  );
  if ((row?.count ?? 0) > 0) return;

  for (const mock of MOCK_BOOKS) {
    const book = await bookRepository.create({
      title: mock.title,
      author: mock.author,
    });
    await pageRepository.addPages(
      book.id,
      mock.pages.map((p) => ({ imageUri: p.imageUri, ocrText: p.ocrText })),
    );
  }
}

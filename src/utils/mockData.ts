import { bookRepository, getDatabase, pageRepository } from '@/services/database';

/**
 * Seeds a few sample books so the library, detail, reader and search screens
 * have content during development. Runs only when the database is empty and is
 * safe to call on every launch.
 *
 * Texts are public domain (Kafka, Dostojewski) or invented. Paragraphs are
 * separated by blank lines and page breaks fall mid-sentence on purpose, so
 * the reflowing text mode can be tried out. The page images use remote
 * placeholder URLs purely for the mock; real scans are always stored locally.
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
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    pages: [
      {
        imageUri: PLACEHOLDER('verwandlung-1'),
        ocrText:
          'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.\n\n»Was ist mit mir geschehen?«, dachte er. Es war kein Traum. Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine auseinandergepackte Musterkollektion von Tuchwaren ausgebreitet war – Samsa war Reisender –, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einem hübschen, vergoldeten Rahmen untergebracht hatte. Es stellte eine Dame dar, die, mit einem Pelzhut und einer Pelzboa versehen, aufrecht dasaß und einen schweren Pelzmuff, in dem ihr ganzer Unterarm verschwunden war, dem Beschauer entgegen-',
      },
      {
        imageUri: PLACEHOLDER('verwandlung-2'),
        ocrText:
          'hob.\n\nGregors Blick richtete sich dann zum Fenster, und das trübe Wetter – man hörte Regentropfen auf das Fensterblech aufschlagen – machte ihn ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Narrheiten vergäße«, dachte er, aber das war gänzlich undurchführbar, denn er war gewöhnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen. Mit welcher Kraft er sich auch auf die rechte Seite warf, immer wieder schaukelte er in die Rückenlage zurück. Er versuchte es wohl hundertmal, schloss die Augen, um die zappelnden Beine nicht sehen zu müssen, und ließ erst ab, als er in der Seite einen noch nie gefühlten, leichten, dumpfen Schmerz zu fühlen begann.\n\n»Ach Gott«, dachte er, »was für einen anstrengenden Beruf habe ich gewählt! Tag aus, Tag ein auf der Reise. Die geschäftlichen Aufregungen sind viel größer als im eigentlichen Geschäft zu Hause, und außerdem ist mir noch diese Plage des Reisens auferlegt, die Sorgen um die Zuganschlüsse, das unregelmäßige, schlechte Essen, ein immer wechselnder, nie andauernder, nie herzlich werdender menschlicher',
      },
      {
        imageUri: PLACEHOLDER('verwandlung-3'),
        ocrText:
          'Verkehr. Der Teufel soll das alles holen!« Er fühlte ein leichtes Jucken oben auf dem Bauch; schob sich auf dem Rücken langsam näher zum Bettpfosten, um den Kopf besser heben zu können; fand die juckende Stelle, die mit lauter kleinen weißen Pünktchen besetzt war, die er nicht zu beurteilen verstand; und wollte mit einem Bein die Stelle betasten, zog es aber gleich zurück, denn bei der Berührung umwehten ihn Kälteschauer.',
      },
    ],
  },
  {
    title: 'Aufzeichnungen aus dem Kellerloch',
    author: 'Fjodor Dostojewski',
    pages: [
      {
        imageUri: PLACEHOLDER('kellerloch-1'),
        ocrText:
          'Ich bin ein kranker Mensch … Ich bin ein böser Mensch. Ein abstoßender Mensch bin ich. Ich glaube, meine Leber ist krank.\n\nÜbrigens verstehe ich rein gar nichts von meiner Krankheit und weiß nicht einmal genau, was mir eigentlich weh tut.',
      },
      {
        imageUri: PLACEHOLDER('kellerloch-2'),
        ocrText:
          'Der Mensch braucht einzig und allein ein selbständiges Wollen, was diese Selbständigkeit auch kosten und wohin sie auch führen möge.',
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
          'Tag 1: Ankunft in Lissabon. Die Straßenbahn 28 schlängelt sich durch die Alfama.\n\nNotiz: den Aussichtspunkt Miradouro bei Sonnenuntergang besuchen.',
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
    await bookRepository.update(book.id, { coverImageUri: mock.pages[0].imageUri });
  }
}

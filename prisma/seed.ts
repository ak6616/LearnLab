import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log("Czyszczenie istniejących danych...");
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ─── Instructors ───────────────────────────────
  console.log("Tworzenie instruktorów...");
  const instructors = await Promise.all([
    prisma.user.create({
      data: {
        email: "dr.kowalski@learnlab.pl",
        name: "dr Marek Kowalski",
        role: "INSTRUCTOR",
        avatarUrl: "https://placehold.co/200x200/6366f1/ffffff?text=MK",
      },
    }),
    prisma.user.create({
      data: {
        email: "mgr.nowak@learnlab.pl",
        name: "mgr Agnieszka Nowak",
        role: "INSTRUCTOR",
        avatarUrl: "https://placehold.co/200x200/ec4899/ffffff?text=AN",
      },
    }),
  ]);

  // ─── Password hash for seeded users ────────────
  const passwordHash = await bcrypt.hash("Test123!", 10);

  // ─── Admin ─────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "admin@learnlab.pl",
      name: "Administrator",
      role: "ADMIN",
      passwordHash,
    },
  });

  // ─── Test user (advertised on login page) ──────
  await prisma.user.create({
    data: {
      email: "test@learnlab.app",
      name: "Test User",
      role: "STUDENT",
      passwordHash,
    },
  });

  // ─── Students (20) ─────────────────────────────
  console.log("Tworzenie studentów...");
  const studentNames = [
    "Jan Wiśniewski", "Anna Zielińska", "Piotr Lewandowski", "Katarzyna Kamińska",
    "Tomasz Szymański", "Monika Woźniak", "Krzysztof Dąbrowski", "Ewa Stępień",
    "Rafał Kaczmarek", "Dorota Pawlak", "Łukasz Michalak", "Barbara Jabłońska",
    "Grzegorz Olejnik", "Joanna Rutkowska", "Michał Czarnecki", "Karolina Baran",
    "Adam Mazur", "Paulina Witkowska", "Dawid Sikora", "Natalia Krajewska",
  ];

  const students = await Promise.all(
    studentNames.map((name, i) => {
      const [first, last] = name.split(" ");
      return prisma.user.create({
        data: {
          email: `${first.toLowerCase().replace("ł", "l").replace("ó", "o")}.${last.toLowerCase().replace("ń", "n").replace("ó", "o").replace("ę", "e")}@student.pl`,
          name,
          role: "STUDENT",
        },
      });
    })
  );

  // ─── Courses with modules ──────────────────────
  console.log("Tworzenie kursów i modułów...");

  const courseDefs = [
    {
      slug: "python-dla-poczatkujacych",
      title: "Python dla początkujących",
      description: "Kompletny kurs programowania w Pythonie od zera. Nauczysz się podstaw składni, struktur danych, programowania obiektowego i tworzenia prostych aplikacji.",
      price: 19900,
      instructorIdx: 0,
      modules: [
        { title: "Wprowadzenie do Pythona", lessons: ["Instalacja i konfiguracja środowiska", "Pierwszy program — Hello World", "Zmienne i typy danych"] },
        { title: "Struktury danych", lessons: ["Listy i krotki", "Słowniki i zbiory", "Operacje na kolekcjach"] },
        { title: "Sterowanie przepływem", lessons: ["Instrukcje warunkowe if/else", "Pętle for i while", "Wyjątki i obsługa błędów"] },
        { title: "Funkcje i moduły", lessons: ["Definiowanie funkcji", "Parametry i wartości zwracane", "Import modułów i pakietów"] },
        { title: "Programowanie obiektowe", lessons: ["Klasy i obiekty", "Dziedziczenie", "Projekt końcowy — aplikacja konsolowa"] },
      ],
      quizzes: [
        { moduleIdx: 0, title: "Quiz: Podstawy Pythona", questions: [
          { body: "Która funkcja służy do wyświetlania tekstu w konsoli?", options: [{ text: "print()", correct: true }, { text: "echo()", correct: false }, { text: "display()", correct: false }, { text: "write()", correct: false }] },
          { body: "Jak zadeklarować zmienną tekstową?", options: [{ text: "x = 'tekst'", correct: true }, { text: "String x = 'tekst'", correct: false }, { text: "var x: string = 'tekst'", correct: false }] },
          { body: "Który typ danych jest niemutowalny?", options: [{ text: "lista", correct: false }, { text: "słownik", correct: false }, { text: "krotka", correct: true }, { text: "zbiór", correct: false }] },
        ]},
        { moduleIdx: 1, title: "Quiz: Struktury danych", questions: [
          { body: "Jak dodać element do listy?", options: [{ text: "lista.append(x)", correct: true }, { text: "lista.add(x)", correct: false }, { text: "lista.push(x)", correct: false }] },
          { body: "Jak uzyskać wartość ze słownika?", options: [{ text: "dict[klucz]", correct: true }, { text: "dict.value(klucz)", correct: false }, { text: "dict->klucz", correct: false }] },
          { body: "Co zwraca len()?", options: [{ text: "Długość kolekcji", correct: true }, { text: "Typ kolekcji", correct: false }, { text: "Ostatni element", correct: false }] },
        ]},
        { moduleIdx: 2, title: "Quiz: Sterowanie przepływem", questions: [
          { body: "Które słowo kluczowe przerywa pętlę?", options: [{ text: "break", correct: true }, { text: "stop", correct: false }, { text: "exit", correct: false }, { text: "end", correct: false }] },
          { body: "Co robi blok try/except?", options: [{ text: "Obsługuje wyjątki", correct: true }, { text: "Powtarza kod", correct: false }, { text: "Testuje warunki", correct: false }] },
          { body: "Jak napisać pętlę od 0 do 9?", options: [{ text: "for i in range(10)", correct: true }, { text: "for i = 0 to 9", correct: false }, { text: "loop(0, 9)", correct: false }] },
        ]},
        { moduleIdx: 3, title: "Quiz: Funkcje", questions: [
          { body: "Jak zdefiniować funkcję w Pythonie?", options: [{ text: "def nazwa():", correct: true }, { text: "function nazwa():", correct: false }, { text: "func nazwa():", correct: false }] },
          { body: "Co zwraca funkcja bez return?", options: [{ text: "None", correct: true }, { text: "0", correct: false }, { text: "Błąd", correct: false }, { text: "undefined", correct: false }] },
          { body: "Jak importować moduł math?", options: [{ text: "import math", correct: true }, { text: "include math", correct: false }, { text: "require('math')", correct: false }] },
        ]},
        { moduleIdx: 4, title: "Quiz: OOP", questions: [
          { body: "Jak zdefiniować klasę?", options: [{ text: "class Nazwa:", correct: true }, { text: "struct Nazwa:", correct: false }, { text: "type Nazwa:", correct: false }] },
          { body: "Co to jest __init__?", options: [{ text: "Konstruktor klasy", correct: true }, { text: "Destruktor", correct: false }, { text: "Metoda statyczna", correct: false }] },
          { body: "Jak dziedziczyć po klasie bazowej?", options: [{ text: "class Dziecko(Rodzic):", correct: true }, { text: "class Dziecko extends Rodzic:", correct: false }, { text: "class Dziecko inherits Rodzic:", correct: false }] },
        ]},
      ],
    },
    {
      slug: "marketing-cyfrowy",
      title: "Marketing cyfrowy",
      description: "Praktyczny kurs marketingu online. SEO, social media, Google Ads, analityka — wszystko czego potrzebujesz, by skutecznie promować firmę w internecie.",
      price: 24900,
      instructorIdx: 1,
      modules: [
        { title: "Podstawy marketingu cyfrowego", lessons: ["Czym jest marketing cyfrowy", "Kanały komunikacji online", "Budowanie strategii"] },
        { title: "SEO i pozycjonowanie", lessons: ["Badanie słów kluczowych", "Optymalizacja on-page", "Link building"] },
        { title: "Social media marketing", lessons: ["Facebook i Instagram Ads", "LinkedIn dla B2B", "Tworzenie contentu"] },
        { title: "Google Ads", lessons: ["Kampanie w wyszukiwarce", "Display i remarketing", "Optymalizacja budżetu"] },
        { title: "Analityka i raportowanie", lessons: ["Google Analytics 4", "KPI i metryki", "Raportowanie wyników"] },
      ],
      quizzes: [
        { moduleIdx: 0, title: "Quiz: Podstawy marketingu", questions: [
          { body: "Co to jest CTR?", options: [{ text: "Click-Through Rate — współczynnik klikalności", correct: true }, { text: "Cost To Revenue", correct: false }, { text: "Customer Total Reach", correct: false }] },
          { body: "Który kanał jest najlepszy dla B2B?", options: [{ text: "LinkedIn", correct: true }, { text: "TikTok", correct: false }, { text: "Snapchat", correct: false }] },
          { body: "Co to jest persona zakupowa?", options: [{ text: "Profil idealnego klienta", correct: true }, { text: "Nazwa firmy", correct: false }, { text: "Typ reklamy", correct: false }] },
        ]},
        { moduleIdx: 1, title: "Quiz: SEO", questions: [
          { body: "Co to jest meta description?", options: [{ text: "Opis strony w wynikach wyszukiwania", correct: true }, { text: "Nazwa domeny", correct: false }, { text: "Tytuł artykułu", correct: false }] },
          { body: "Czy backlinki wpływają na SEO?", options: [{ text: "Tak, to ważny czynnik rankingowy", correct: true }, { text: "Nie mają znaczenia", correct: false }, { text: "Obniżają pozycję", correct: false }] },
          { body: "Co to jest long-tail keyword?", options: [{ text: "Fraza kluczowa z 3+ słów", correct: true }, { text: "Najpopularniejsze słowo kluczowe", correct: false }, { text: "Nazwa marki", correct: false }] },
        ]},
        { moduleIdx: 2, title: "Quiz: Social media", questions: [
          { body: "Jaki format ma najwyższy zasięg na Instagramie?", options: [{ text: "Reels", correct: true }, { text: "Zdjęcie", correct: false }, { text: "Stories", correct: false }] },
          { body: "Co to jest engagement rate?", options: [{ text: "Wskaźnik zaangażowania odbiorców", correct: true }, { text: "Koszt reklamy", correct: false }, { text: "Liczba obserwujących", correct: false }] },
          { body: "Kiedy najlepiej publikować na LinkedIn?", options: [{ text: "Wtorek-czwartek, godziny poranne", correct: true }, { text: "Weekend, wieczorem", correct: false }, { text: "Nie ma znaczenia", correct: false }] },
        ]},
        { moduleIdx: 3, title: "Quiz: Google Ads", questions: [
          { body: "Co to jest CPC?", options: [{ text: "Cost Per Click", correct: true }, { text: "Cost Per Conversion", correct: false }, { text: "Click Per Customer", correct: false }] },
          { body: "Czym jest remarketing?", options: [{ text: "Reklama skierowana do osób, które już odwiedziły stronę", correct: true }, { text: "Reklama w telewizji", correct: false }, { text: "Pierwsza kampania reklamowa", correct: false }] },
          { body: "Co to jest Quality Score?", options: [{ text: "Ocena jakości reklamy przez Google", correct: true }, { text: "Wynik sprzedaży", correct: false }, { text: "Ranking strony", correct: false }] },
        ]},
        { moduleIdx: 4, title: "Quiz: Analityka", questions: [
          { body: "Co mierzy bounce rate?", options: [{ text: "Procent odwiedzin z jedną odsłoną", correct: true }, { text: "Szybkość ładowania strony", correct: false }, { text: "Liczbę konwersji", correct: false }] },
          { body: "Co to jest konwersja?", options: [{ text: "Pożądane działanie użytkownika", correct: true }, { text: "Wyświetlenie strony", correct: false }, { text: "Kliknięcie reklamy", correct: false }] },
          { body: "Który raport GA4 pokazuje źródła ruchu?", options: [{ text: "Acquisition", correct: true }, { text: "Engagement", correct: false }, { text: "Monetization", correct: false }] },
        ]},
      ],
    },
    {
      slug: "zarzadzanie-projektami",
      title: "Zarządzanie projektami",
      description: "Kurs zarządzania projektami IT oparty na metodykach Agile i Scrum. Nauczysz się planowania sprintów, zarządzania backlogiem i prowadzenia retrospektyw.",
      price: 29900,
      instructorIdx: 0,
      modules: [
        { title: "Wprowadzenie do Agile", lessons: ["Manifest Agile", "Scrum vs Kanban", "Role w zespole Scrum"] },
        { title: "Planowanie i backlog", lessons: ["Tworzenie user stories", "Priorytetyzacja backlogu", "Estymacja — story points"] },
        { title: "Sprint i daily", lessons: ["Planowanie sprintu", "Daily standup", "Sprint review i demo"] },
        { title: "Narzędzia PM", lessons: ["Jira i Linear", "Confluence i dokumentacja", "Automatyzacja workflow"] },
        { title: "Retrospektywy i doskonalenie", lessons: ["Formaty retrospektyw", "Action items i follow-up", "Metryki zespołu — velocity, cycle time"] },
      ],
      quizzes: [
        { moduleIdx: 0, title: "Quiz: Agile", questions: [
          { body: "Ile wartości ma Manifest Agile?", options: [{ text: "4", correct: true }, { text: "10", correct: false }, { text: "7", correct: false }] },
          { body: "Kto jest odpowiedzialny za backlog produktu?", options: [{ text: "Product Owner", correct: true }, { text: "Scrum Master", correct: false }, { text: "Developer", correct: false }] },
          { body: "Jak długo trwa typowy sprint?", options: [{ text: "2 tygodnie", correct: true }, { text: "1 miesiąc", correct: false }, { text: "1 dzień", correct: false }] },
        ]},
        { moduleIdx: 1, title: "Quiz: Backlog", questions: [
          { body: "Co to jest user story?", options: [{ text: "Opis funkcjonalności z perspektywy użytkownika", correct: true }, { text: "Dokument techniczny", correct: false }, { text: "Raport z testów", correct: false }] },
          { body: "Co to są story points?", options: [{ text: "Względna miara złożoności", correct: true }, { text: "Godziny pracy", correct: false }, { text: "Priorytet zadania", correct: false }] },
          { body: "Kto priorytetyzuje backlog?", options: [{ text: "Product Owner", correct: true }, { text: "Zespół deweloperski", correct: false }, { text: "CEO", correct: false }] },
        ]},
        { moduleIdx: 2, title: "Quiz: Sprint", questions: [
          { body: "Co to jest sprint goal?", options: [{ text: "Cel biznesowy sprintu", correct: true }, { text: "Lista zadań", correct: false }, { text: "Deadline projektu", correct: false }] },
          { body: "Kto prowadzi daily standup?", options: [{ text: "Zespół deweloperski (Scrum Master facylituje)", correct: true }, { text: "Product Owner", correct: false }, { text: "Manager", correct: false }] },
          { body: "Co prezentuje się na sprint review?", options: [{ text: "Działający przyrost produktu", correct: true }, { text: "Slajdy PowerPoint", correct: false }, { text: "Plan na następny sprint", correct: false }] },
        ]},
        { moduleIdx: 3, title: "Quiz: Narzędzia", questions: [
          { body: "Do czego służy Jira?", options: [{ text: "Zarządzanie zadaniami i sprintami", correct: true }, { text: "Pisanie kodu", correct: false }, { text: "Projektowanie UI", correct: false }] },
          { body: "Co to jest Confluence?", options: [{ text: "Narzędzie do dokumentacji", correct: true }, { text: "System kontroli wersji", correct: false }, { text: "Baza danych", correct: false }] },
          { body: "Czym jest workflow automation?", options: [{ text: "Automatyzacja powtarzalnych procesów", correct: true }, { text: "Ręczne raportowanie", correct: false }, { text: "Kodowanie botów", correct: false }] },
        ]},
        { moduleIdx: 4, title: "Quiz: Retro", questions: [
          { body: "Jaki jest cel retrospektywy?", options: [{ text: "Ciągłe doskonalenie procesu", correct: true }, { text: "Ocena wydajności pracowników", correct: false }, { text: "Planowanie budżetu", correct: false }] },
          { body: "Co to jest velocity?", options: [{ text: "Ilość story points ukończonych w sprincie", correct: true }, { text: "Szybkość deploymentu", correct: false }, { text: "Liczba bugów", correct: false }] },
          { body: "Co to jest cycle time?", options: [{ text: "Czas od rozpoczęcia do ukończenia zadania", correct: true }, { text: "Długość sprintu", correct: false }, { text: "Czas odpowiedzi API", correct: false }] },
        ]},
      ],
    },
  ];

  const courses = [];
  const allModules: any[][] = [];
  const allQuizzes: any[][] = [];

  for (const cDef of courseDefs) {
    const course = await prisma.course.create({
      data: {
        slug: cDef.slug,
        title: cDef.title,
        description: cDef.description,
        price: cDef.price,
        currency: "PLN",
        status: "PUBLISHED",
        instructorId: instructors[cDef.instructorIdx].id,
        thumbnailUrl: `https://placehold.co/800x450/1e293b/f1f5f9?text=${encodeURIComponent(cDef.title.split(" ").slice(0, 2).join("+"))}`,
      },
    });
    courses.push(course);

    const mods = [];
    for (let mi = 0; mi < cDef.modules.length; mi++) {
      const mDef = cDef.modules[mi];
      const mod = await prisma.module.create({
        data: {
          courseId: course.id,
          title: mDef.title,
          order: mi + 1,
          description: `Moduł ${mi + 1}: ${mDef.title}`,
          lessons: {
            create: mDef.lessons.map((title, li) => ({
              title,
              order: li + 1,
              kind: "VIDEO" as const,
              duration: 600 + li * 120,
            })),
          },
        },
        include: { lessons: true },
      });
      mods.push(mod);
    }
    allModules.push(mods);

    // Create quizzes
    const quizzes = [];
    for (const qDef of cDef.quizzes) {
      const quiz = await prisma.quiz.create({
        data: {
          courseId: course.id,
          moduleId: mods[qDef.moduleIdx].id,
          title: qDef.title,
          passMark: 70,
          questions: {
            create: qDef.questions.map((q, qi) => ({
              body: q.body,
              order: qi + 1,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  isCorrect: o.correct,
                })),
              },
            })),
          },
        },
      });
      quizzes.push(quiz);
    }
    allQuizzes.push(quizzes);
  }

  // ─── Enrollments & Progress ────────────────────
  console.log("Tworzenie zapisów i postępu...");

  // Distribute 20 students across courses with varying progress
  // 0% progress, ~50% progress, 100% progress
  const progressLevels = [0, 0.5, 1.0]; // roughly

  for (let si = 0; si < students.length; si++) {
    // Each student enrolls in 1-2 courses
    const courseIndices = si < 8 ? [0] : si < 14 ? [1] : si < 18 ? [2] : [0, 1];

    for (const ci of courseIndices) {
      const progressLevel = progressLevels[si % 3];
      const isCompleted = progressLevel >= 1.0;

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: students[si].id,
          courseId: courses[ci].id,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
          completedAt: isCompleted ? new Date(Date.now() - (20 - si) * 86400000) : null,
        },
      });

      // Create payment
      await prisma.payment.create({
        data: {
          userId: students[si].id,
          courseId: courses[ci].id,
          amountCents: courseDefs[ci].price,
          currency: "PLN",
          status: "SUCCEEDED",
        },
      });

      // Create lesson progress
      const mods = allModules[ci];
      const totalLessons = mods.reduce((s, m) => s + m.lessons.length, 0);
      const completedCount = Math.floor(totalLessons * progressLevel);
      let count = 0;

      for (const mod of mods) {
        for (const lesson of mod.lessons) {
          if (count < completedCount) {
            await prisma.lessonProgress.create({
              data: {
                userId: students[si].id,
                lessonId: lesson.id,
                enrollmentId: enrollment.id,
                completed: true,
                watchedSecs: lesson.duration || 600,
                completedAt: new Date(Date.now() - (totalLessons - count) * 86400000),
              },
            });
          }
          count++;
        }
      }
    }
  }

  // ─── Certificates (5) ─────────────────────────
  console.log("Tworzenie certyfikatów...");
  const completedStudents = students.filter((_, i) => i % 3 === 2); // progress 100%
  let certCount = 0;
  for (const student of completedStudents) {
    if (certCount >= 5) break;
    const courseIdx = certCount < 3 ? 0 : certCount < 4 ? 1 : 2;
    await prisma.certificate.create({
      data: {
        userId: student.id,
        courseId: courses[courseIdx].id,
        pdfUrl: `https://placehold.co/800x600/1e293b/f1f5f9?text=Certyfikat+${encodeURIComponent(student.name || "")}`,
      },
    });
    certCount++;
  }

  // ─── Quiz Attempts ────────────────────────────
  console.log("Tworzenie prób quizów...");
  for (let si = 0; si < students.length; si++) {
    if (si % 3 === 0) continue; // 0% progress students didn't take quizzes
    const courseIndices = si < 8 ? [0] : si < 14 ? [1] : si < 18 ? [2] : [0, 1];

    for (const ci of courseIndices) {
      const quizzesToAttempt = si % 3 === 2 ? allQuizzes[ci] : allQuizzes[ci].slice(0, 2);
      for (const quiz of quizzesToAttempt) {
        const score = si % 3 === 2 ? 85 + (si % 15) : 55 + (si % 30);
        await prisma.quizAttempt.create({
          data: {
            userId: students[si].id,
            quizId: quiz.id,
            score,
            passed: score >= 70,
            answers: {},
          },
        });
      }
    }
  }

  console.log("\n✅ Seed zakończony pomyślnie!");
  console.log("   Kursy: 3");
  console.log("   Moduły: 15 (5 per kurs)");
  console.log("   Lekcje: 45 (3 per moduł)");
  console.log("   Quizy: 15 (1 per moduł)");
  console.log("   Instruktorzy: 2");
  console.log("   Studenci: 20");
  console.log("   Certyfikaty: 5");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

export type Mood = "leve" | "calmo" | "pesado" | "sensivel" | "ansioso";
export type PieceKind = "feature" | "note" | "recorte" | "pull" | "fio";

export type TimelinePiece = {
  id: string;
  kind: PieceKind;
  day: string;
  time?: string;
  fio?: "limites" | "casa" | "trabalho" | "descanso" | "corpo";
  mood?: Mood;
  duration?: string;
  title?: string;
  said?: string;
  excerpt?: string;
  reading?: {
    head?: string;
    body: string;
  };
};

export type DayGroup = {
  id: string;
  day: string;
  dek: string;
  pieces: TimelinePiece[];
};

export const threadMap = {
  limites: {
    id: "limites",
    title: "Limites e presença",
    color: "var(--aurora-pink)",
    desc: "Voltou 4 vezes, com formas diferentes.",
    question: "O que muda quando o seu sim chega depois de você?",
  },
  casa: {
    id: "casa",
    title: "A casa e o silêncio",
    color: "var(--aurora-blue)",
    desc: "O silêncio entre abrigo e ausência.",
    question: "O que você leva para dentro de casa quando atravessa a porta?",
  },
  trabalho: {
    id: "trabalho",
    title: "Trabalho e valor",
    color: "var(--aurora-mint)",
    desc: "Esperar reconhecimento de fora, e o próprio valor.",
    question: "De quem é a frase que diria que você fez bem?",
  },
  descanso: {
    id: "descanso",
    title: "Descanso sem culpa",
    color: "var(--aurora-warm)",
    desc: "Parar sem sentir que está devendo.",
    question: "Descanso precisa ser merecido para acontecer?",
  },
  corpo: {
    id: "corpo",
    title: "O corpo avisa antes",
    color: "var(--accent-soft)",
    desc: "O corpo sinaliza antes da mente nomear.",
    question: "Onde você sente, antes de saber o que sente?",
  },
} as const;

const seed = [
  {
    title: "O peso de parecer bem",
    said: "Sorri, concordei, e fiquei com aquilo entalado o resto do dia. De novo. Era só dizer não, e de novo eu não disse.",
    reading: {
      head: "Há uma diferença entre ceder e desaparecer.",
      body: "Hoje você notou o instante exato em que se entregou: o segundo antes do tudo bem. Reparar nesse instante já é um tipo de presença. O limite não começa na regra; começa em perceber onde ele foi cruzado.",
    },
  },
  {
    title: "A casa ficou quieta",
    said: "Todo mundo dormiu e sobrou esse silêncio que eu não sei se é paz ou solidão.",
    reading: {
      head: "O mesmo silêncio pode ser abrigo ou ausência.",
      body: "A casa não mudou entre um segundo e outro. Você mudou. Reparar nessa virada é começar a escolher como entrar nela amanhã.",
    },
  },
  {
    title: "O elogio que não veio",
    said: "Entreguei o projeto e ninguém disse nada. Fiquei o dia esperando uma frase que não chegou.",
    reading: {
      head: "O próprio valor não precisa ficar do lado de fora.",
      body: "Esperar reconhecimento de fora é deixar o próprio valor na mão dos outros. O que mudaria se você nomeasse, em voz alta, o que fez bem?",
    },
  },
  {
    title: "Quase falei",
    said: "Tinha a frase pronta na boca e engoli. Da próxima eu falo, é o que eu sempre digo.",
    reading: {
      head: "Da próxima também é uma forma de hoje.",
      body: "Você não precisa ser corajosa de uma vez. Basta ficar um segundo a mais com a frase antes de engolir.",
    },
  },
  {
    title: "Pedi um tempo",
    said: "Falei que ia pensar antes de responder. Pareceu pouco, mas pra mim foi muito.",
    reading: {
      head: "Pedir tempo também é limite.",
      body: "Você deu à sua resposta o direito de existir depois de você. Às vezes o limite começa como uma pausa pequena.",
    },
  },
];

const fioCycle: TimelinePiece["fio"][] = ["limites", "casa", "trabalho", undefined, "limites", "descanso", "corpo"];
const moodCycle: Mood[] = ["sensivel", "pesado", "ansioso", "leve", "calmo"];
const dayNames = ["Hoje", "Ontem", "Sábado 26", "Sexta 25", "Quinta 24", "Quarta 23", "Terça 22", "Segunda 21"];
const deks = [
  "A casa ficou quieta e você ficou acordada só mais um pouco.",
  "Você chegou e a casa estava do jeito que deixou.",
  "Algumas frases voltaram com menos pressa.",
  "O corpo avisou antes da agenda.",
  "Uma pausa pequena mudou o ritmo inteiro.",
  "A resposta apareceu quando você parou de empurrar.",
  "O silêncio ficou menos inimigo.",
  "O dia guardou uma pergunta em vez de uma conclusão.",
];

export function buildTimelineGroups(): DayGroup[] {
  let count = 0;
  return dayNames.map((day, dayIndex) => {
    const pieces: TimelinePiece[] = [];
    const perDay = dayIndex < 2 ? 7 : 6;
    for (let i = 0; i < perDay && count < 50; i += 1) {
      const item = seed[count % seed.length];
      const fio = fioCycle[count % fioCycle.length];
      const mood = moodCycle[count % moodCycle.length];
      const hour = 22 - ((count + i) % 12);
      const minute = String((count * 7) % 60).padStart(2, "0");
      const id = `m-${count + 1}`;

      if (i === 0) {
        pieces.push({
          id,
          kind: "feature",
          day,
          time: `${hour}:${minute}`,
          fio: fio ?? "limites",
          mood,
          duration: `${2 + (count % 5)}:${String((10 + count) % 60).padStart(2, "0")}`,
          title: item.title,
          said: item.said,
          reading: item.reading,
        });
      } else if (i === 3) {
        pieces.push({
          id,
          kind: "pull",
          day,
          said: count % 2 === 0 ? "Algumas coisas voltam porque ainda querem lugar." : "Nem tudo que importa chega como conclusão.",
        });
      } else if (i === 5) {
        pieces.push({
          id,
          kind: "recorte",
          day,
          time: `${hour}:${minute}`,
          mood,
          duration: "0:20",
          said: count % 2 === 0 ? "Reparei que respirei fundo antes de responder." : "Hoje eu não pedi desculpa por precisar pensar.",
        });
      } else {
        pieces.push({
          id,
          kind: "note",
          day,
          time: `${hour}:${minute}`,
          fio,
          mood,
          duration: `${1 + (count % 4)}:${String((20 + count) % 60).padStart(2, "0")}`,
          title: item.title,
          excerpt: item.said,
          reading: item.reading,
        });
      }
      count += 1;
    }

    return { id: day.toLowerCase().replace(/\s/g, "-"), day, dek: deks[dayIndex], pieces };
  });
}

export const selectedThreadMoments: TimelinePiece[] = [
  {
    id: "fio-1",
    kind: "feature",
    day: "Hoje",
    time: "22:00",
    fio: "limites",
    mood: "sensivel",
    duration: "4:12",
    title: "Onde o fio está agora",
    said: seed[0].said,
    reading: seed[0].reading,
  },
  {
    id: "fio-2",
    kind: "note",
    day: "Sábado 26",
    time: "18:10",
    fio: "limites",
    mood: "sensivel",
    duration: "2:20",
    title: "A voz tremeu, mas eu falei",
    excerpt: "Falei pra ele que aquilo me machucou. A voz tremeu, mas eu falei mesmo assim.",
    reading: {
      body: "Dizer em voz alta o que dói é o primeiro limite. A voz que treme não é fraqueza; é o som de algo atravessando para fora pela primeira vez.",
    },
  },
  {
    id: "fio-3",
    kind: "pull",
    day: "Quarta 23",
    said: "Algumas coisas voltam porque ainda querem lugar.",
  },
  {
    id: "fio-4",
    kind: "note",
    day: "Quarta 17",
    time: "14:22",
    fio: "limites",
    mood: "ansioso",
    duration: "0:55",
    title: "Quase falei",
    excerpt: seed[3].said,
    reading: seed[3].reading,
  },
  {
    id: "fio-5",
    kind: "recorte",
    day: "Há duas semanas",
    time: "09:13",
    mood: "pesado",
    duration: "0:18",
    said: "Nem percebi que tinha cedido. Só fui sentir no corpo, bem depois.",
  },
  {
    id: "fio-6",
    kind: "note",
    day: "Há duas semanas",
    time: "21:40",
    fio: "limites",
    mood: "pesado",
    duration: "1:40",
    title: "Disse sim no automático",
    excerpt: "Aceitei antes de pensar. Quando vi, já tinha concordado com mais uma coisa.",
    reading: {
      body: "O automático também é um hábito que se pode desacelerar. Entre o pedido e o sim cabe uma respiração; e nela mora a escolha.",
    },
  },
  {
    id: "fio-7",
    kind: "note",
    day: "Há três semanas",
    time: "16:05",
    fio: "limites",
    mood: "calmo",
    duration: "2:05",
    title: "Pedi um tempo",
    excerpt: seed[4].said,
    reading: seed[4].reading,
  },
];

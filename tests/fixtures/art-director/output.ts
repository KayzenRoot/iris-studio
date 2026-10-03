import type { ProjectBrief } from "../../../src/server/db/store";
import { antiGenericPatternIds, ART_DIRECTOR_PROMPT_VERSION, type ArtDirectionOutput } from "../../../src/server/art-director/schemas";

type MediaStrategy = ArtDirectionOutput["siteBlueprint"]["pages"][number]["sections"][number]["media"]["strategy"];
type LoadTiming = ArtDirectionOutput["siteBlueprint"]["pages"][number]["sections"][number]["media"]["loadTiming"];
type RuntimeCost = ArtDirectionOutput["siteBlueprint"]["pages"][number]["sections"][number]["media"]["runtimeCost"];
type PerformanceSensitivity = ArtDirectionOutput["siteBlueprint"]["pages"][number]["sections"][number]["performanceSensitivity"];

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function makeGoldenArtDirection(brief: ProjectBrief): ArtDirectionOutput {
  const pages = brief.pages.map((name, pageIndex) => {
    const requested = brief.requiredSections.find((entry) => entry.page === name)?.sections ?? [];
    const titles = [...requested];
    if (!titles.length) titles.push("Abertura", "Prova", "Próximo passo");
    else if (titles.length === 1) titles.push("Próximo passo");

    const sections = titles.map((title, sectionIndex) => {
      const hero = pageIndex === 0 && sectionIndex === 0;
      const strategy: MediaStrategy = hero && brief.qualityMode === "ABSURD"
        ? "REALTIME_3D"
        : hero && brief.qualityMode === "PREMIUM"
          ? "SHORT_LOOP"
          : hero && brief.qualityMode === "STANDARD"
            ? "STILL_IMAGE"
            : "HTML_CSS";
      const fallbackStrategy: MediaStrategy = strategy === "REALTIME_3D" ? "SHADER_CANVAS" : "HTML_CSS";
      const loadTiming: LoadTiming = strategy === "REALTIME_3D" || strategy === "SHORT_LOOP" ? "ON_INTERACTION" : "INITIAL";
      const estimatedPayloadKB = strategy === "REALTIME_3D" ? 1800 : strategy === "SHORT_LOOP" ? 1200 : strategy === "STILL_IMAGE" ? 460 : 0;
      const runtimeCost: RuntimeCost = strategy === "REALTIME_3D" ? "HIGH" : strategy === "SHORT_LOOP" ? "MEDIUM" : "LOW";
      const performanceSensitivity: PerformanceSensitivity = runtimeCost === "HIGH" ? "HIGH" : "LOW";
      const downstreamAssets = strategy === "STILL_IMAGE"
        ? [{ kind: "IMAGE" as const, intent: "Fotografia de processo que demonstre escala e superfície do trabalho descrito.", constraints: "Enquadrar a matéria real com luz lateral consistente e espaço suficiente para a composição editorial." }]
        : strategy === "SHORT_LOOP"
          ? [{ kind: "VIDEO_LOOP" as const, intent: "Loop curto que revele uma transformação material ligada ao argumento da abertura.", constraints: "Limitar duração e peso, evitar texto embutido e fornecer um quadro estático equivalente." }]
          : strategy === "REALTIME_3D"
            ? [{ kind: "3D_SCENE" as const, intent: "Cena interativa que explica a leitura espacial de um sinal oceânico sem fingir medição real.", constraints: "Carregar sob interação, limitar geometria e manter uma composição estática utilizável como fallback." }]
            : [];
      return {
        id: slug(name + "-" + title),
        title,
        contentIntent: "Apresente uma ideia verificável com contexto suficiente para que a pessoa entenda por que esta seção existe e qual informação deve levar consigo.",
        visualRole: "Crie uma mudança deliberada de escala e alinhamento que retome o motivo visual sem repetir a composição da seção anterior.",
        media: {
          strategy,
          impactRationale: "Este meio preserva a escala material da história e torna a ação principal perceptível sem depender de uma camada decorativa ou de uma cena sem interação.",
          loadTiming,
          estimatedPayloadKB,
          runtimeCost,
          fallbackStrategy,
          fallbackRationale: "Na ausência do meio principal, uma composição estática continua explicando o mesmo conteúdo com menor transferência e menor custo de processamento.",
        },
        interactionIntent: "A interação deve revelar contexto sob demanda e manter a ação principal sempre visível e compreensível.",
        mobileTreatment: "Em telas estreitas, priorize uma coluna, reduza profundidade simultânea e mantenha o conteúdo e a ação acessíveis sem depender de hover.",
        reducedMotionTreatment: "Com movimento reduzido, remova deslocamentos e loops; mantenha um quadro estático que preserve hierarquia, contraste e entendimento.",
        performanceSensitivity,
        downstreamAssets,
        continuityRole: "Esta seção retoma o motivo assinatura com uma escala diferente e prepara a informação que conduz à próxima página.",
      };
    });

    return {
      pageId: slug(name),
      name,
      purpose: "Organize a informação desta página para esclarecer uma necessidade específica antes da ação principal.",
      primaryUserAction: pageIndex === 0 ? "Conhecer a abordagem" : "Explorar os detalhes",
      sections,
      crossPageContinuity: "A página retoma a mesma tese e varia o ritmo para não repetir o início da experiência.",
    };
  });

  const payloads = pages.flatMap((page) => page.sections.map((section) => section.media.estimatedPayloadKB));
  const totalPayload = payloads.reduce((sum, value) => sum + value, 0);
  const initialPayload = pages.flatMap((page) => page.sections)
    .filter((section) => section.media.loadTiming === "INITIAL")
    .reduce((sum, section) => sum + section.media.estimatedPayloadKB, 0);
  const sitemap = pages.map((page) => ({
    pageId: page.pageId,
    name: page.name,
  }));

  return {
    visualDNA: {
      schemaVersion: 1,
      promptVersion: ART_DIRECTOR_PROMPT_VERSION,
      qualityMode: brief.qualityMode,
      concept: {
        title: "Cartografia de gestos materiais",
        creativeThesis: "Uma sequência de gestos materiais conduz da observação à decisão: cada página usa escala, silêncio e contraste para tornar o trabalho verificável, em vez de depender de efeitos decorativos que poderiam pertencer a qualquer marca.",
        signatureMotif: {
          name: "Margem de observação",
          visualRule: "Uma faixa lateral muda de espessura conforme o conteúdo avança, funcionando como índice de leitura e nunca como ornamento solto.",
          pageDeployments: ["Abre como índice ao lado da tese.", "Retorna como marca de escala junto aos detalhes.", "Encerra como guia discreto para a ação principal."],
        },
      },
      brandPersonality: [
        { trait: "criteriosa", visualImplication: "Use hierarquia tipográfica curta, alinhamentos estáveis e evidências visuais próximas às afirmações." },
        { trait: "sensorial", visualImplication: "Mostre textura e luz por enquadramento próximo, mantendo contraste suficiente para a leitura." },
        { trait: "generosa", visualImplication: "Reserve espaço para explicações e use pausas de composição antes de pedidos de ação." },
      ],
      palette: [
        { name: "papel", role: "CANVAS", hex: "#f2efe8", usage: "Sustente a leitura longa sem competir com imagens de material.", contrastIntent: "Combine com tinta escura para texto corrido e áreas de leitura prolongada." },
        { name: "argila", role: "SURFACE", hex: "#d8c7a6", usage: "Separe superfícies de apoio sem transformar cada informação em cartão.", contrastIntent: "Reserve texto escuro e bordas explícitas para manter a superfície legível." },
        { name: "carvão verde", role: "INK", hex: "#24362d", usage: "Conduza títulos, texto principal e a navegação persistente.", contrastIntent: "Use em texto sobre papel claro e evite texto pequeno sobre acentos." },
        { name: "óxido", role: "ACCENT", hex: "#a85d42", usage: "Marque uma ação ou detalhe de evidência por contexto.", contrastIntent: "Não use a cor sozinha para indicar estado ou prioridade." },
      ],
      typography: {
        displayDirection: "Títulos serifados de contraste moderado podem carregar a voz editorial, com largura de linha controlada e quebras ligadas ao sentido.",
        readingDirection: "Texto de leitura usa desenho sans de abertura generosa, peso regular e linhas curtas que sobrevivem a telas estreitas.",
        hierarchy: [
          { role: "tese", treatment: "Escala expressiva com poucas linhas e uma quebra semântica deliberada." },
          { role: "seção", treatment: "Peso médio e índice consistente para facilitar a orientação durante a rolagem." },
          { role: "metadado", treatment: "Tamanho compacto, contraste suficiente e rótulos textuais além da cor." },
        ],
        readabilityRules: ["Não comprimir linhas de texto longo.", "Manter foco visível e hierarquia independente de cor."],
      },
      composition: {
        grid: "Grade assimétrica de colunas largas e margem de observação persistente.",
        hierarchy: "Uma afirmação por bloco, seguida de evidência e ação secundária claramente identificada.",
        spatialRhythm: "Alterne trechos densos com pausas vazias que indiquem mudança de assunto.",
        scrollNarrative: "Conduza de contexto a evidência e, por fim, a uma ação sem repetir o mesmo hero.",
      },
      materialLanguage: [
        { material: "papel fibroso", role: "Dá uma base quieta para informação e texto.", behavior: "A textura permanece discreta e não interfere no contraste." },
        { material: "metal oxidado", role: "Assinala evidência e passagem de tempo.", behavior: "Aparece em detalhes pequenos, sem brilho especular gratuito." },
      ],
      geometryLanguage: [
        { form: "faixa lateral", meaning: "Transforma a margem em instrumento de orientação.", rule: "A faixa muda de largura apenas quando muda o capítulo." },
        { form: "recorte oblíquo", meaning: "Evoca um gesto de observação e enquadramento.", rule: "Use uma ocorrência por página e mantenha o conteúdo fora da zona de corte." },
      ],
      lightingAndDepth: {
        lighting: "Luz lateral ampla descreve volume real sem esconder textura ou criar brilho artificial.",
        depth: "Profundidade vem da sobreposição editorial e da distância de enquadramento, sem parallax automático.",
        atmosphere: "Uma atmosfera calma permite perceber detalhes antes de solicitar uma ação.",
      },
      imageDirection: {
        subjects: "Mostre mãos, matéria ou instrumentos diretamente ligados ao trabalho descrito.",
        framing: "Alterne plano de contexto e macro de superfície com espaço de composição para texto.",
        treatment: "Preserve tonalidade material e luz consistente; evite retoque que transforme evidência em publicidade.",
        avoid: "Evite bancos de imagem genéricos, pessoas posando sem ação e cenários que afirmem fatos ausentes.",
      },
      motion: {
        principles: ["Apareça apenas para orientar a leitura entre capítulos.", "Responda somente a uma ação identificável da pessoa.", "Diminua a intensidade após a primeira exposição do motivo."],
        pacing: "Uma transição curta separa capítulos; conteúdo essencial não espera animação para ficar legível.",
        easingCharacter: "Use desaceleração suave, sem mola ou overshoot que sugira urgência artificial.",
        mobileBehavior: "Reduza deslocamentos, carregue detalhes fora da tela sob demanda e preserve controles grandes.",
        reducedMotionBehavior: "Substitua deslocamentos por estado final estático e mantenha transições essenciais instantâneas.",
        performanceBudget: "Limite animação simultânea, respeite carga adiada e prefira CSS nativo a runtime permanente.",
      },
      interactionPrinciples: [
        { trigger: "Abrir um detalhe", response: "Revele informação relacionada no mesmo contexto e mantenha a orientação da página.", userFeedback: "O estado aberto fica claro por texto, ícone e foco." },
        { trigger: "Enviar uma solicitação", response: "Confirme os campos antes do envio e associe erros ao campo correspondente.", userFeedback: "Informe sucesso ou correção necessária sem depender de movimento ou cor." },
      ],
      continuityRules: ["Mantenha a margem de observação em todas as páginas.", "Varie escala sem trocar a linguagem material.", "Repita a hierarquia de ação principal e secundária."],
      accessibility: {
        contrast: "Texto e controles mantêm contraste verificável em cada superfície e em todos os estados.",
        reading: "Corpo confortável, linha curta e hierarquia sem depender apenas de caixa alta.",
        focusAndInput: "Foco visível, ordem de teclado previsível e rótulo persistente em todo campo.",
        colorIndependence: "Estados sempre recebem rótulo ou forma adicional à cor.",
      },
      performance: {
        posture: "Priorize conteúdo e HTML/CSS; adie mídia pesada e remova qualquer camada que não melhore entendimento.",
        initialTransferBudgetKB: 1000,
        deferredMediaBudgetKB: 5000,
        runtimeBudget: "Nenhuma cena contínua sem interação; limite tarefas por quadro e encerre mídia fora da área ativa.",
        measurementCue: "Observe payload inicial, trabalho de thread principal e estabilidade de layout em mobile.",
      },
      antiGenericConstraints: antiGenericPatternIds.map((patternId) => ({
        patternId,
        prohibition: "Não use este padrão como resposta visual automática nem como preenchimento de espaço sem função.",
        distinctAlternative: "Substitua por uma decisão derivada da tese, do conteúdo e do comportamento esperado nesta seção.",
        onlyJustifyWhen: "Só considere a exceção se o briefing demonstrar função clara e a revisão humana aprovar o motivo.",
      })),
      referenceInterpretations: brief.references.map((_reference, referenceIndex) => ({
        referenceIndex,
        abstractSignal: "Ritmo editorial e atenção a evidências materiais.",
        transformation: "Converta o sinal em uma regra de margem e escala própria, sem repetir layout, texto ou identidade.",
        identityBoundary: "Use apenas a qualidade abstrata; não reproduza marca, composição reconhecível ou expressão protegida.",
      })),
      assumptions: [],
      decisionNeeds: [],
    },
    siteBlueprint: {
      schemaVersion: 1,
      promptVersion: ART_DIRECTOR_PROMPT_VERSION,
      qualityMode: brief.qualityMode,
      goalSummary: "A experiência conduz da observação do trabalho a uma ação qualificada, com conteúdo verificável em cada etapa.",
      navigationModel: "A navegação nomeia páginas com os termos do briefing e mantém a ação principal acessível sem cobrir o conteúdo.",
      crossPageNarrative: "Contexto abre a leitura, evidências aprofundam a confiança e a ação encerra cada percurso sem repetir a mesma abertura.",
      sitemap,
      pages,
      assumptions: [],
      decisionNeeds: [],
      performance: {
        initialTransferBudgetKB: Math.max(initialPayload, 1000),
        totalMediaBudgetKB: Math.max(totalPayload, 5000),
        maximumConcurrentRichMedia: 1,
        degradationRule: "Em conexão lenta, preferência reduced-motion ou ausência de WebGL, use o fallback estático mais leve e mantenha texto, navegação e ação principal.",
      },
    },
  };
}

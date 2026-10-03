import type { ProjectBrief } from "../../../src/server/db/store";

export interface ArtDirectorGoldenCase {
  name: string;
  brief: ProjectBrief;
}

export const artDirectorGoldenCases: ArtDirectorGoldenCase[] = [
  {
    name: "restrained-simple-professional",
    brief: {
      siteType: "institutional",
      description: "Uma cooperativa de restauração de edifícios históricos que documenta materiais e técnicas locais.",
      goal: "Receber pedidos de diagnóstico para edifícios históricos de pequeno porte.",
      audience: "Gestores de patrimônio e proprietários que precisam preservar fachadas existentes.",
      pages: ["Início"],
      requiredSections: [{ page: "Início", sections: ["Apresentação", "Como trabalhamos"] }],
      references: [],
      tone: "preciso, próximo e paciente",
      colors: ["#24362d", "#d8c7a6", "#f2efe8"],
      mediaDirection: "Fotografia documental de materiais e detalhes construtivos reais.",
      mediaPreference: "2D_ONLY",
      motionDirection: "Movimento mínimo, com foco na leitura e nas etapas do trabalho.",
      qualityMode: "STANDARD",
    },
  },
  {
    name: "premium-luxury-editorial",
    brief: {
      siteType: "portfolio",
      description: "Um atelier de tapeçaria contemporânea que combina fibras naturais, pesquisa cromática e encomendas limitadas.",
      goal: "Apresentar o processo artesanal e abrir conversas de encomenda qualificada.",
      audience: "Arquitetos e colecionadores interessados em peças têxteis feitas sob medida.",
      pages: ["Atelier", "Obras", "Caderno"],
      requiredSections: [{ page: "Obras", sections: ["Peças em contexto", "Ficha de materiais"] }],
      references: ["Uma revista impressa de arte com margens amplas e fotografias táteis."],
      tone: "íntimo, material e editorial",
      colors: ["#372e28", "#ede7d9", "#8b6652", "#d3b782"],
      mediaDirection: "Luz lateral suave, trama visível e escala real das peças.",
      mediaPreference: "DIRECTOR_CHOICE",
      motionDirection: "Ritmo lento apenas em transições que conectem processo e obra.",
      qualityMode: "PREMIUM",
    },
  },
  {
    name: "absurd-experimental-technology",
    brief: {
      siteType: "product-presentation",
      description: "Uma plataforma de observação oceânica que traduz leituras de sensores em alertas para equipes de pesquisa costeira.",
      goal: "Explicar como os sinais oceânicos viram decisões de pesquisa verificáveis.",
      audience: "Equipes científicas e operadores de monitoramento costeiro.",
      pages: ["Sinais", "Método"],
      requiredSections: [{ page: "Sinais", sections: ["Campo de dados", "Como ler o sinal"] }],
      references: ["Cartografia batimétrica anotada e cadernos técnicos de campo."],
      tone: "experimental, rigoroso e orientado por evidência",
      colors: ["#102b34", "#c8e0d8", "#e6a45c", "#f2f1e8"],
      mediaDirection: "Dados abstratos derivados de leituras, sem simular medições ausentes.",
      mediaPreference: "2D_AND_3D_ALLOWED",
      motionDirection: "Movimento só quando explica profundidade ou mudança de estado.",
      qualityMode: "ABSURD",
    },
  },
];

# Evidence Bundle — IRIS-STUDIO-WO-0003 / M01

## Veredito independente
**APPROVED**

## Identidade do incremento
- Work Order: `IRIS-STUDIO-WO-0003`
- Módulo: M01 — Local Core & Dashboard
- PR: #13
- Base `main`: `f30937d57980ee4280487ba167677ab0cb170d8d`
- Candidato entregue pelo executor: `f8515dd874a5e96bd810e641dfdb9b3214a602f9`
- Correção da auditoria independente: `1b6758e0fe1cc6197fe785368c4b883153416c91`

## Escopo auditado
O incremento entrega o shell local do IRIS Studio, persistência SQLite, migrations, abstração de workspace, criação/listagem/detalhe de projetos, System Health, configuração, logging, error boundaries e testes. Não há execução de Codex, ComfyUI, Blender, MCP ou geração de websites.

## Revisão técnica independente

### Filesystem e isolamento
- `IRIS_DATA_DIR` deve ser absoluto.
- Dados/workspaces dentro do source repository são rejeitados.
- Canonicalização por ancestral existente + `realpath` cobre escapes por symlink.
- Workspace usa UUID e é confinado ao diretório de projetos.
- API pública remove `workspacePath`.

### Persistência
- SQLite usa foreign keys, WAL e busy timeout.
- Migrations são ordenadas e registradas em `schema_migrations`.
- Criação de projeto + brief é transacional.
- Falha de gravação tenta remover apenas o diretório vazio criado pela operação.
- Testes comprovam reabertura do store e persistência após reinício real do processo Next em produção.

### Health
- Codex e Blender: apenas presença de executável no PATH.
- ComfyUI: apenas GET loopback `127.0.0.1:8188/system_stats` com timeout.
- Disponibilidade não é confundida com autenticação, MCP, modelos ou execução.
- Estados AVAILABLE/UNAVAILABLE/MISCONFIGURED possuem testes.

### API / entrada
- Brief validado por Zod.
- Limites de páginas, strings, referências, paleta e qualidade são aplicados.
- Respostas públicas são allowlisted.

## Testes e CI no candidato do executor
O executor registrou PASS para instalação limpa, baseline GEF/repositório, lint, typecheck, build, 11 testes unitários, 2 E2E, audit e diff check. O baseline remoto do candidato `f8515dd...` passou.

## Finding independente e correção
Foi encontrada uma inconsistência de supply-chain/documentação: o CI já usava o Playwright instalado pelo lockfile, mas o README ainda orientava `npx playwright install chromium`. A auditoria corrigiu o README para `npm run ci:install:playwright` no commit `1b6758e...`.

O HEAD corrigido foi revalidado:
- GitHub Actions `IRIS Studio Baseline` run `37082708189`: **SUCCESS**
- job `repository-baseline` / check `111086483876`: **SUCCESS**
- SonarCloud check `111086620232`: **SUCCESS / Quality Gate passed**
- Sonar Security Hotspots: **0**
- Socket Pull Request Alerts check `111086496270`: **SUCCESS / no new dependency alerts**
- Socket Project Report check `111086485264`: **SUCCESS**

## Sonar e cobertura
O Sonar reporta 30 novos issues/annotations de análise estática, porém seu próprio Quality Gate permaneceu verde, com zero Security Hotspots e 0% de coverage importado para o Sonar. Os 0% não significam ausência de testes: os testes unitários/E2E são executados pelo baseline; apenas o relatório de coverage não está integrado ao Sonar neste M01. O endpoint detalhado de annotations não foi usado como evidência de PASS e nenhum finding Sonar foi silenciado/aceito para fabricar aprovação.

## CodeRabbit
A PR originalmente estava Draft e o CodeRabbit pulou a revisão. A auditoria marcou a PR Ready e disparou `@coderabbitai review`. No momento de fechar este Evidence Bundle, o CodeRabbit ainda estava processando. Portanto:
- status usado no checkpoint: **UNKNOWN / PENDING**
- não é tratado como PASS
- não é gate obrigatório do WO-0003

## GEF
`gef doctor/status` executam no pipeline, mas os estados históricos de provenance, mutable refs, operator stale e drift UNEXPECTED continuam registrados como REVIEW. Eles não foram resetados/adotados artificialmente para produzir um falso estado verde.

## Riscos remanescentes
- Autenticação/execução do Codex não pertence ao M01 e será M02.
- ComfyUI workflows/modelos não são testados no M01.
- Blender MCP/automação não é testado no M01.
- Sonar coverage ainda não está integrado como métrica; isso pode ser reavaliado em um incremento posterior se se tornar gate útil.

## Checkpoint Delta
- M01: PENDING -> **APPROVED**
- módulos aprovados: 1 / 8
- progresso estrutural do MVP: **12.5%**
- próximo incremento legal: **M02 / IRIS-STUDIO-WO-0004 — Codex Bridge**

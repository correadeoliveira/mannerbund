# Verificação do protótipo

Verificação local em 6 de novembro de 2026. Prévia final em `http://localhost:5187`.

## Automatizada

- 32 testes em três arquivos: domínio, serviços com IndexedDB de teste e contraste das cores customizadas.
- Cobertura de soma coletiva, desempate, virada mensal de São Paulo, intervalos sobrepostos, sessões concorrentes, lacunas/reabertura, GPS impreciso/fora da área, limites/Premium, permissões, DMs, canais, convites, insígnias idempotentes e rateio exato.
- TypeScript e build de produção: `npm run build`.
- Código formatado com Prettier. Detector visual do Impeccable sem ocorrências; 13 imagens com origem/prompt incorporado.

## Navegador real

| Fluxo                     | Resultado observado                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Mapa em 390, 768 e 1440px | Ruas e points renderizados; sem overflow horizontal do documento                         |
| Legibilidade do mapa      | Filtros com texto de 12px e altura de 44px; regras e participantes com 12px              |
| Comunidade e evento novos | Criados com Sofia, preset/símbolo, convite e dados da insígnia                           |
| Presença em evento        | Check-in demonstrativo, pausa fora do raio, retomada, encerramento e concessão do troféu |
| Mensagem privada          | Envio e permanência após recarregar                                                      |
| Publicação com imagem     | Imagem salva como blob local, publicação e leitura após recarregar                       |
| Cor preta na comunidade   | Valor `#000000` salvo; símbolo e total usam tinta derivada legível (`rgb(142,138,129)`)  |
| Restauração               | Cancelar preserva o estado; confirmar retorna ao cenário inicial                         |

A revisão independente do Impeccable marcou como resolvidos os três ajustes solicitados: texto/alvos do mapa, contraste de cores customizadas e contenção do selo “Local” no tablet. Disposição final da revisão: **ship**, no escopo desses ajustes.

Capturas estão em `.impeccable/review/`, incluindo `desktop.jpg`, `mobile.jpg`, `tablet.jpg`, `black-accent-desktop.jpg` e `conquest-mobile.jpg`.

## Limites da verificação

A localização foi testada de forma determinística no serviço; não houve coleta de GPS físico do usuário. O comportamento de erro de armazenamento e de indisponibilidade do mapa foi implementado, mas não foi induzida uma falha global de IndexedDB ou uma interrupção externa do provedor no navegador real. Não há backend, autenticação real, cobranças, repasses ou rastreamento em segundo plano.

O cenário da prévia final foi restaurado após os testes para manter os seis grupos e oito points iniciais disponíveis para exploração.

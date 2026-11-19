# Mannerbund

Um protótipo local de comunidades que conquistam lugares pelo tempo que passam juntas. Interface em português, mapa real de São Paulo e identidade de bronze, pedra e cartografia.

## App público

O protótipo está disponível para qualquer pessoa em:

- **Aplicativo principal:** <https://saif-cy.github.io/mannerbund/inicio>
- **Guildas:** <https://saif-cy.github.io/mannerbund/>

É uma demonstração estática: cada visitante tem seus próprios dados no navegador, sem cadastro nem sincronização entre pessoas. O mapa e a localização real funcionam porque o GitHub Pages entrega o app por HTTPS. Detalhes de build e limites em [DEPLOY.md](DEPLOY.md).

## Rodar no PC

Requer Node.js 22.12+ e npm. Testado com Node 26.

```sh
npm install
npm run dev
```

Abra [http://localhost:5187](http://localhost:5187). O servidor também informa um endereço da rede local para conferir o visual no celular. A localização real exige um contexto seguro: use localhost no PC ou HTTPS; o endereço HTTP da rede local serve para explorar a interface e a simulação.

```sh
npm test          # regras e serviços com IndexedDB de teste
npm run build    # TypeScript e build de produção
npm run preview  # visualizar o build
```

## Visitar as guildas

O app abre em **Início**, com as histórias da sua comunidade e uma aba para descobrir outras. Para visitar as guildas, use **Mais → Guildas** no celular ou **Visitar as guildas** na barra lateral. Escolha uma das seis comunidades, toque em **Fazer parte** e converse com o anfitrião e os dois membros simulados. Confirme o convite, toque em **Cheguei ao local** e escolha quanto tempo ficar. Os 30 minutos completos rendem uma insígnia e levam a guilda a 90 minutos coletivos, superando os 75 da rival. A saída após 10 minutos registra uma visita e deixa a rival na liderança.

O relógio avança pelas suas ações. Reabrir a página retoma a visita. As respostas usam roteiros locais e podem ser pausadas na conversa. Em **Meu perfil** você pode mudar seu nome, personalizar seu personagem e rever troféus e visitas. Ao trocar de comunidade, uma confirmação explica o destino do check-in atual.

A visita usa o IndexedDB `mannerbund-guildas-v1`. Quando o navegador bloqueia esse armazenamento, **Continuar nesta aba** inicia uma sessão em memória. O link **Explorar o protótipo original** abre o mapa em `/mapa` com as personas e o banco original. Os endereços antigos de território, como `/?point=p1`, continuam abrindo o mapa original.

## O que funciona

- Mapa MapLibre/OpenFreeMap com estilo próprio, oito points compartilhados, geofences de 100 m, busca, filtros, ranking territorial e lista utilizável quando o mapa falha.
- Descoberta de comunidades por categoria, nome e distância. Distâncias usam a posição escolhida ou o centro do cenário em São Paulo.
- Criação e personalização de comunidades: seis presets, símbolos, cor, descrição e capa com prévia. Edição só pelo criador.
- Eventos, convites individuais, confirmação, horários de São Paulo, tempo mínimo e imagem de insígnia. Cadastro de novos points no mapa, com sugestão de locais próximos.
- Visitas livres e presenças em eventos. Uma sessão ativa por pessoa. Simulação de tempo e raio; GPS real opcional em primeiro plano, com intervalo fresco e precisão conservadora.
- Histórico de lugares no próprio perfil, com visitas por GPS e simuladas separadas e atalhos para o mapa. A aba aproveita os check-ins salvos no navegador.
- Conexões entre participantes com presença válida no mesmo encontro. Cada pessoa escolhe aparecer na lista, pode aceitar ou recusar pedidos e abrir o chat privado após o aceite.
- Níveis permanentes por comunidade com histórico de XP e atalho para a próxima oportunidade.
- Editor visual de personagem com penteados, trajes, tons de pele, traços, fundos e acessórios. Concluir um Caminho libera o broche da comunidade.
- Duelos com três cartas secretas, aviso de jogada pendente, revelação por rodada, revanche e treino solo. Os duelos entre pessoas aparecem no histórico privado dos dois perfis.
- Troféus únicos por pessoa/evento, com dados preservados após alterações e saída da comunidade.
- Caminhos com três encontros escolhidos pelo ADM. A inscrição é voluntária e o progresso vem das insígnias, inclusive as já conquistadas. Caminhos concluídos podem ser compartilhados no feed pelo perfil.
- Vários canais por comunidade, mensagens privadas entre duas pessoas, não lidas e moderação.
- Tela inicial com duas abas: histórias da sua comunidade e de outras comunidades. Posts pessoais e da comunidade, imagens, curtidas e comentários.
- Perfis editáveis, fotos locais, seguidores/seguindo e abas de histórias e troféus.
- Temporadas mensais, ranking, histórico e fundo fictício de R$ 1.000 por comunidade, dividido proporcionalmente às horas.
- Plano gratuito com uma comunidade própria e uma de outro usuário; Premium demonstrativo remove os dois limites.

## Demonstração de ponta a ponta

1. O app abre com **Rafael Almeida**, administrador de **Aurora Running** e membro de **Círculo de Barro**.
2. Abra o encontro **O primeiro sol é nosso** pelo mapa ou pela comunidade. Confirme o convite caso ainda não esteja confirmado.
3. Use **Demonstração: avançar até o início**. Clique em **Registrar presença** e escolha **Demonstração**.
4. No **Laboratório de encontros**, some **+30 min**. Experimente **Fora do raio** e avance novamente: esse tempo não conta. Volte para **Dentro do raio** para retomar.
5. Avance até o fim. A insígnia aparece em **Perfil → Troféus** uma única vez.
6. Para demonstrar uma conquista territorial, inicie uma visita livre no mapa e escolha outra comunidade da qual participa. Some horas até superar o líder do point.
7. Troque de perfil pelo avatar ou pelo laboratório. **Sofia Nunes** começa sem comunidade e permite testar criação e adesão. **Marina Costa** administra o Círculo de Barro e participa da Aurora.
8. Envie uma mensagem privada e troque para o destinatário: ambos veem a mesma conversa no navegador.
9. **Próxima temporada** inicia o mês seguinte sem apagar histórico e troféus.
10. **Restaurar demonstração** pede confirmação e substitui todos os dados e imagens enviados pelo cenário inicial.

O relógio demonstrativo avança para todos os perfis locais. Só sessões demonstrativas ativas e dentro do raio ganham os minutos explicitamente avançados. O tempo passado com a página fechada não é recompensado. Encerrar uma presença também não preenche lacunas de tempo.

Para testar um Caminho no cenário inicial, abra **Aurora Running → Caminhos → Três parques com a Aurora** como Rafael e toque em **Começar caminho**. Você começa com **1 de 3**. Complete **O primeiro sol é nosso** e **Uma volta pela Água Branca** pelo check-in demonstrativo. Depois do fim dos encontros, abra **Perfil → Troféus → Meus caminhos** para conferir a conclusão e compartilhar no feed.

Bancos locais de versões anteriores recebem a aba Caminhos e mantêm os dados existentes. O caminho de exemplo está disponível em um cenário novo. Para experimentá-lo com os dados atuais intactos, use outro perfil de navegador.

Para ver visitas de exemplo em uma sessão nova, abra **Perfil → Lugares visitados → Ver demonstração**. Os check-ins que você fizer aparecem após o encerramento da sessão e ficam disponíveis enquanto o navegador conservar os dados do site.

Para experimentar uma conexão em um cenário novo, abra **Aurora Running → Encontros → Passos que deixam história** como Rafael. Em **Conexões do encontro**, toque em **Aparecer neste encontro** e envie um pedido para Marina. Troque para Marina no mesmo navegador e aceite em **Perfil → Conexões**. O botão **Conversar** abre a conversa privada entre as duas contas.

Para experimentar os três recursos em conjunto, troque para **Marina** em um cenário novo. Em **Perfil → Troféus → Meus níveis** você vê o XP da Aurora. Use **Personalizar personagem**, depois abra **Perfil → Conexões** e desafie **Pedro**. Troque para Pedro para aceitar e enviar três jogadas. Volte para Marina e envie as dela para revelar o resultado. Em uma instalação atualizada, use qualquer conexão já aceita ou crie uma antes de desafiar.

Para jogar em uma sessão nova sem alternar perfis, abra **Perfil → Conexões → Treinar sozinho**, escolha três cartas e toque em **Jogar treino**. Para ganhar um broche, conclua o Caminho da Aurora e equipe a peça em **Personalizar personagem → Acessórios**.

## Dados e limites

Os dados ficam em **IndexedDB**, neste navegador e nesta origem. Recarregar preserva as alterações; limpar dados do site remove o protótipo. Fotos enviadas ficam em IndexedDB, até 5 MB cada. Fontes, fotografias ilustrativas e medalhões estão no projeto; apenas o mapa precisa de conexão externa.

**Este não é um backend multiusuário.** Os perfis são personas locais, e os controles de permissão validam o fluxo de demonstração. Não há autenticação segura, sincronização entre dispositivos, proteção contra adulteração do navegador, pagamentos, saldo real ou GPS em segundo plano.

A localização real não é solicitada automaticamente. Só contamos intervalos entre amostras recentes, dentro do raio inclusive sua margem de precisão, com a página visível. Posições imprecisas, negadas, fora da área, antigas ou com lacuna de mais de 30 segundos pausam o crédito. Uma presença GPS ativa impede avanços artificiais no relógio.

No downgrade de Premium, vínculos existentes permanecem; novas criações e entradas voltam aos limites gratuitos. Remover membros não apaga suas contribuições. O ADM só modera a própria comunidade; conversas privadas pertencem aos seus participantes.

## Arquitetura

| Camada             | Código                        | Responsabilidade                                                        |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------- |
| Interface          | `src/pages`, `src/components` | Rotas, temas, formulários e feedback                                    |
| Aplicação          | `src/services`                | Permissões e operações transacionais; relógio/localização substituíveis |
| Domínio            | `src/domain`                  | Intervalos, limites, temporadas, domínio e recompensas                  |
| Persistência       | `src/data`                    | Repositório Dexie, mídia e cenário inicial                              |
| Estado transitório | `src/state`                   | Perfil selecionado, laboratório e avisos                                |

As mutações leem o estado mais recente e escrevem dentro de uma transação IndexedDB, inclusive check-ins concorrentes. O protótipo usa um agregado de estado para manter operações atômicas e simples; mídia fica em uma tabela separada. Horas e rankings são derivados de intervalos, não números mantidos manualmente.

Veja [ARCHITECTURE.md](ARCHITECTURE.md) para a evolução conectada e mobile. As decisões de produto e visuais estão em [PRODUCT.md](PRODUCT.md) e [DESIGN.md](DESIGN.md). Créditos dos assets: [public/images/CREDITS.md](public/images/CREDITS.md).

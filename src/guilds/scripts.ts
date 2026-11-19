export interface GuildScript {
  communityId: string;
  pointId: string;
  hour: number;
  title: string;
  badge: string;
  memory: string;
  badgeImage: string;
  members: [string, string];
  notice: string;
  welcome: string;
  chatter: [string, string];
  meeting: string;
  newcomer: string;
  closing: string;
}

export const guilds: GuildScript[] = [
  {
    communityId: 'c1',
    hour: 7,
    pointId: 'p1',
    title: 'Corrida do primeiro sol',
    badge: 'Passo da Aurora',
    memory: 'Pelos primeiros quilômetros em companhia da Aurora no Ibirapuera.',
    badgeImage: '/images/medallion.jpg',
    members: ['Lia Moraes', 'Caio Reis'],
    notice: 'Vou levar café para a volta. Quem traz os copinhos?',
    welcome: 'Vem correr com a gente! Te mandei o convite para a volta no parque.',
    chatter: [
      'Separei os copinhos! Posso ir com quem quiser correr mais devagar.',
      'Já amarrei os tênis. A primeira volta é de aquecimento.',
    ],
    meeting: 'A gente se encontra perto do portão 3 do Ibirapuera. Procure o estandarte do sol.',
    newcomer:
      'Fica comigo na primeira volta. A gente corre no seu ritmo e encontra a turma no café.',
    closing: 'Passamos pelo portão juntos e voltamos para dividir o café.',
  },
  {
    communityId: 'c2',
    hour: 10,
    pointId: 'p6',
    title: 'Roda de argila',
    badge: 'Marca das mãos',
    memory: 'Pela roda de cerâmica que reuniu a guilda no Centro Cultural.',
    badgeImage: '/images/medallion-ceramic.jpg',
    members: ['Nina Luz', 'Tom Vieira'],
    notice: 'Já separei o barro. Hoje cada pessoa leva a marca da própria mão.',
    welcome: 'Chega mais para a roda! Enviei o convite. Que peça você gostaria de modelar?',
    chatter: [
      'Trouxe um avental extra para quem precisar.',
      'Quero tentar uma caneca que caiba certinho na minha mão.',
    ],
    meeting: 'Vamos montar a mesa junto à entrada da Rua Vergueiro no Centro Cultural São Paulo.',
    newcomer: 'Senta aqui do meu lado. A gente começa fazendo uma tigelinha só com os polegares.',
    closing: 'Guardamos as ferramentas e deixamos as peças da turma secando.',
  },
  {
    communityId: 'c3',
    hour: 17,
    pointId: 'p2',
    title: 'Trilha do último raio',
    badge: 'Guia do poente',
    memory: 'Pela caminhada em grupo até o mirante da Praça Pôr do Sol.',
    badgeImage: '/images/medallion-trail.jpg',
    members: ['Iara Lopes', 'Bento Dias'],
    notice: 'Achei uma sombra boa no alto da praça para a nossa parada.',
    welcome: 'Que bom ter companhia para a caminhada. Seu convite já está aqui!',
    chatter: [
      'Enchi minha garrafa e trouxe água extra.',
      'Eu guardo um lugar no mirante para a turma.',
    ],
    meeting: 'O grupo sai da parte alta da Praça Pôr do Sol, ao lado do gramado.',
    newcomer: 'Vem na minha dupla. A gente faz uma parada na subida e chega junto no mirante.',
    closing: 'A turma chegou ao mirante a tempo de ver a luz mudar.',
  },
  {
    communityId: 'c4',
    hour: 13,
    pointId: 'p5',
    title: 'Piquenique na Roosevelt',
    badge: 'Lugar à mesa',
    memory: 'Pela tarde de partilha na toalha da Mesa Aberta.',
    badgeImage: '/images/medallion-ceramic.jpg',
    members: ['Dora Melo', 'Davi Prado'],
    notice: 'A toalha é grande. Sempre cabe mais um prato.',
    welcome: 'Puxa um lugar! Te enviei o convite do piquenique. Tem alguma receita que você adora?',
    chatter: [
      'Trouxe bolo de fubá. Quem gosta das pontinhas?',
      'Eu levo os guardanapos e a limonada.',
    ],
    meeting: 'Procure a toalha xadrez ao lado dos bancos da Praça Roosevelt.',
    newcomer: 'Guardei um canto na toalha para você. Quer experimentar um pedaço do bolo?',
    closing: 'No fim do piquenique, cada pessoa saiu com uma receita nova.',
  },
  {
    communityId: 'c5',
    hour: 8,
    pointId: 'p8',
    title: 'Corpo em pausa',
    badge: 'Fôlego da manhã',
    memory: 'Pela prática de movimento com a guilda no Parque da Água Branca.',
    badgeImage: '/images/medallion-trail.jpg',
    members: ['Eva Alves', 'Rui Nery'],
    notice: 'Escolhi um trecho de grama à sombra. Tragam uma canga.',
    welcome: 'Reservei um lugar na roda. O convite está aqui. Hoje você escolhe o ritmo!',
    chatter: [
      'Tenho uma canga extra. Posso guardar para quem estiver chegando.',
      'Vou começar com um alongamento bem leve.',
    ],
    meeting: 'Estamos no gramado perto da entrada principal do Parque da Água Branca.',
    newcomer: 'Pode começar sentado na canga comigo. A primeira sequência é só de respiração.',
    closing: 'Encerramos a roda descalços na grama, cada qual no seu ritmo.',
  },
  {
    communityId: 'c6',
    hour: 16,
    pointId: 'p4',
    title: 'Caça aos reflexos',
    badge: 'Olho de bronze',
    memory: 'Pelo passeio fotográfico entre os reflexos do Largo da Batata.',
    badgeImage: '/images/medallion.jpg',
    members: ['Cris Sá', 'Léo Ramos'],
    notice: 'Quem consegue encontrar dois reflexos na mesma foto hoje?',
    welcome: 'Seu convite para o passeio chegou! Vamos procurar a cidade refletida nas vitrines.',
    chatter: [
      'Achei uma vitrine que reflete o céu inteiro.',
      'Vou só com o celular para brincar com os ângulos.',
    ],
    meeting: 'A saída é no Largo da Batata, perto do acesso ao metrô Faria Lima.',
    newcomer: 'Vem fotografar comigo. Uma poça ou uma janela já rendem o primeiro reflexo.',
    closing: 'Demos a volta no largo e voltamos para comparar os reflexos que cada um encontrou.',
  },
];

export const visitorId = 'visitante';
export const actors = (id: string) => [id + '-a', id + '-b'] as const;
export const channelId = (id: string) => 'ch-' + id;

export function replyTo(script: GuildScript, message: string, time: string) {
  const clean = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/hora|quando|horario|comeca/.test(clean))
    return 'O encontro começa às ' + time + ' no relógio da visita. Ficamos juntos por 30 minutos.';
  if (/onde|local|encontra|portao|endereco|chegar/.test(clean)) return script.meeting;
  if (/primeir|iniciante|novat|novo|nova|nunca/.test(clean)) return script.newcomer;
  return 'Valeu pela mensagem! ' + script.meeting;
}

# Comandeiro — os dois sites

Este README vale para `comandeiro.com` e `comandeiro.com.br`. Os dois são o
mesmo site em línguas diferentes, com o mesmo CSS e o mesmo JavaScript.

---

## O que é o Comandeiro

É o produto de plataforma gastronômica da Ávila Ops: o garçom anota na mesa, a
cozinha recebe no segundo em que ele envia, e a conta fecha certa.

O nome é a palavra que o setor já usa. **Comandeiro** é o aparelho que o garçom
carrega para anotar na mesa — todo dono de restaurante e todo garçom no Brasil
sabe o que é. Não precisa explicar o que o produto faz: o nome já diz.

Três camadas, e vale não confundir:

| Camada | O que é | Exemplo |
| --- | --- | --- |
| **Ávila Ops** | a empresa que vende, implanta e cobra | `avilaops.com` |
| **Comandeiro** | o produto | `comandeiro.com.br` |
| **Estabelecimento** | quem usa, com marca e endereço próprios | `minas.comandeiro.com.br` |

O Minas Espetinhos é o Tenant #1 e continua atendendo em `minas.avilaops.com`
enquanto os adesivos e links antigos existirem.

---

## A estratégia dos dois domínios

`comandeiro.com` em **inglês**, `comandeiro.com.br` em **português**. Não é
tradução de conveniência — são dois mercados com decisões diferentes:

- **`.com.br`** é onde está o cliente de hoje. Espetaria, bar, pizzaria: gente
  que decide sozinha, paga do próprio bolso e não tem departamento de
  tecnologia. O texto assume esse leitor.
- **`.com`** é a porta para fora, e existe antes de haver cliente fora. Custa um
  arquivo e um registro DNS; abrir depois custaria o dobro, porque conteúdo em
  inglês feito às pressas sai ruim.

Os dois se conhecem: `hreflang` liga um ao outro nos dois sentidos, e cada um
tem seu `canonical`. Sem isso o Google escolheria uma versão e enterraria a
outra.

**O produto em si ainda é só em português.** O painel, o cardápio e a tela da
cozinha têm o texto direto no código, sem camada de tradução. O site em inglês
vende; o sistema em inglês é internacionalização de verdade, e entra quando
existir o primeiro cliente de fora — não antes.

---

## Por que é estático

Sem container, sem Node, sem build. O Caddy serve arquivo do disco.

Três razões, em ordem de peso:

1. **O servidor é compartilhado.** São 2 vCPU e 3,8 GB para nove sites, o ERP,
   o Odoo e a plataforma do Minas. O site do produto não pode disputar CPU com
   a cozinha de um cliente num sábado.
2. **A primeira visita inteira dá ~99 KB** e nenhuma requisição a domínio de
   terceiro: HTML 15 KB, CSS 13 KB, JS 6 KB, fontes 65 KB.
3. **Deploy é `rsync`.** Segundos, sem imagem para construir, sem container
   para reiniciar.

**O que isso custa:** não há CMS. Mudar texto é editar HTML e publicar. Para uma
página de produto que muda algumas vezes por mês, é troca boa. No dia em que
virar blog com vinte posts, deixa de ser — e aí a conversa é outra.

---

## Estrutura

```text
Websites/comandeiro.com/          inglês  (canônico do desenho)
  index.html                      a página
  404.html
  assets/comandeiro.css           a folha — byte a byte igual nos dois sites
  assets/comandeiro.js            a demo ao vivo — byte a byte igual nos dois
  fonts/*.woff2                   Archivo e JetBrains Mono, servidas por nós
  og.png                          cartão de link 1200x630, com o texto da língua
  favicon.svg  robots.txt  sitemap.xml

Websites/comandeiro.com.br/       português, mesma estrutura
```

### A demo ao vivo

O herói não é captura de tela: é o produto funcionando. O garçom toca nos itens,
o total sobe, a comanda cai na cozinha e o cronômetro corre — passando de normal
para atenção e para atrasado nos mesmos limites que o sistema usa de verdade.

São 6 KB de JavaScript, sem dependência. Captura de tela envelhece a cada
deploy; isto é a mesma lógica do produto.

Três regras no código, e nenhuma é enfeite:

- **Para quando sai da tela** (`IntersectionObserver`). Aba esquecida não fica
  queimando bateria de celular.
- **Respeita `prefers-reduced-motion`**: mostra o estado final, sem animar.
- **Sem JavaScript, a página continua completa.** A comanda já vem no HTML.

### As fontes são nossas

Archivo no texto, JetBrains Mono no que imita cupom. Servidas do nosso servidor,
com `preload` e `font-display: swap`.

Google Fonts seria uma requisição a terceiro em toda visita e o IP de cada
visitante entregue de graça. São 65 KB para não fazer isso.

---

## Manter os dois em sincronia

**CSS e JS são o mesmo arquivo nos dois sites.** Duas folhas de estilo seriam
duas verdades, e a segunda sempre atrasa. Ao mexer no visual, edite em
`comandeiro.com/assets/` e copie para o `.com.br`. Para conferir se não
divergiram:

```powershell
"comandeiro.css","comandeiro.js" | ForEach-Object {
  $en = (Get-FileHash "Websites/comandeiro.com/assets/$_").Hash
  $br = (Get-FileHash "Websites/comandeiro.com.br/assets/$_").Hash
  "$_  $(if ($en -eq $br) { 'igual' } else { 'DIVERGIU' })"
}
```

Diferem de propósito: `index.html`, `404.html`, `sitemap.xml` e `og.png` — o
cartão de link tem o texto da língua desenhado dentro dele.

**O texto é escrito, não traduzido.** "Sold out is one tap" virou "marcar
esgotado é um toque". O cardápio da demo em inglês tem *beef skewer*; em
português tem espeto de carne, coração e cerveja 600ml, porque é o cardápio que
o leitor brasileiro reconhece.

**O limite, dito antes de doer:** hoje as duas páginas são dois arquivos
mantidos à mão. Mudança de estrutura precisa ser feita nos dois, e quem esquecer
deixa as versões diferentes sem ninguém perceber. Funciona com uma página por
língua. Na terceira página, vira gerador — não antes, para não construir
pipeline para dois arquivos.

---

## Publicar

```bash
# do repositório, para o site em inglês
tar -C Websites/comandeiro.com -czf /tmp/site.tar.gz .
scp -i ~/.ssh/hetzner_avilaops /tmp/site.tar.gz root@178.105.82.48:/tmp/

ssh -i ~/.ssh/hetzner_avilaops root@178.105.82.48 '
  rm -rf /tmp/novo && mkdir -p /tmp/novo
  tar -xzf /tmp/site.tar.gz -C /tmp/novo
  rsync -a --delete /tmp/novo/ /var/www/comandeiro.com/
  chown -R www-data:www-data /var/www/comandeiro.com
'
```

O `--delete` importa: sem ele, arquivo apagado no repositório fica vivo no
servidor para sempre.

### Onde as coisas moram

| Peça | Onde |
| --- | --- |
| Arquivos | `/var/www/comandeiro.com` e `/var/www/comandeiro.com.br` |
| Borda | Caddy no host, bloco por domínio, TLS automático |
| DNS | Cloudflare, registro A para `178.105.82.48`, **proxy cinza** |
| E-mail | Cloudflare Email Routing → `hello@` e `contato@` caem no Gmail do dono |

**Cinza e não laranja**, como o resto do servidor: o Caddy redireciona HTTP para
HTTPS com 308, e o proxy laranja em modo *Flexible* transforma isso em loop.

---

## O que o site promete — e o que não

Vale o `docs/cultura-e-voz.md`, e duas regras dele aparecem inteiras aqui.

**Só promete o que existe.** Pedido na mesa, cozinha em tempo real, cardápio por
QR, impressão, relatório, papéis por função. Nada de "IA" e nada de integração
que ainda não foi escrita.

**Diz o limite antes de o cliente descobrir.** Duas ficaram no ar de propósito:

> É um sistema conectado, e salão sem wi-fi confiável ainda não é a casa certa
> para ele.
>
> Hoje o caixa registra o que entrou. Integração com maquininha entra uma de
> cada vez, só com ferramenta oficial do provedor.

É melhor perder o lead na página do que na primeira sexta-feira.

**Preço sem número.** Está a estrutura — implantação uma vez, mensalidade por
casa, **zero comissão sobre a venda** — e um pedido de orçamento. O número
depende de praça e de quantas casas o cliente tem; inventar valor em dólar para
um mercado que ainda não foi definido seria chute com cara de compromisso.

---

## Estado hoje

| Frente | Situação |
| --- | --- |
| `comandeiro.com` | no ar, com e-mail roteando |
| `comandeiro.com.br` | zona **pendente** no registro.br; arquivos prontos |
| Produto em inglês | não existe — só o site |
| Preço público | não publicado, por decisão |

**Falta, quando o `.com.br` propagar:** subir os arquivos, ligar o bloco no
Caddy, criar `contato@comandeiro.com.br` e virar o domínio primário do Minas —
que é o que libera os adesivos de mesa para a gráfica, porque o QR impresso
carrega o domínio dentro dele.

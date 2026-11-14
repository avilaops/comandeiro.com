# Cloudflare Pages

## Descoberta pública • ARD e WebMCP

Depois das versões textuais, o mesmo publicador gera a descoberta sobre `pages-dist`,
o diretório efetivamente enviado ao Pages:

```sh
node .publicacao-texto/bin/publicar-descoberta.mjs --diretorio pages-dist --origem https://comandeiro.com
```

O gerador central publica `/.well-known/ard.json`, o catálogo de compatibilidade
`/ai-catalog.json`, o link `rel="ard"` e o adaptador leve de leitura WebMCP.
Somente HTML público e indexável participa. O adaptador lê o conteúdo e os links
públicos da página; não preenche formulários nem efetua envios ou transações.
Browsers sem a API mantêm a navegação existente, sem polyfill global.
Não há biblioteca de cliente duplicada neste repositório.

O workflow fixa o `motor-web` no commit revisado
`d5067bbbe3522f459367af3b58b4298324801f82`, com os CLIs de texto e descoberta.
Os checks, ações, diretórios, retries e bloqueio de deploy em pull requests
continuam no workflow. Nenhum build ou teste do projeto foi executado localmente
nesta preparação; a validação do artefato e da geração cabe ao CI do Pages.

Na revisão do artefato, valide o JSON e os recursos anunciados, ausência de
rotas privadas/noindex, conteúdo público preservado e funcionamento com e sem
WebMCP. Preserve configurações de DNS, robots, consentimento e medição.
Para rollback, restaure juntos o workflow e o pin anterior e publique o artefato
Pages anterior pelo fluxo existente.


Projeto: `comandeiro`. Saída pública: `pages-dist`. Fonte: este repositório.

O workflow `.github/workflows/cloudflare-pages.yml` publica cada push na main. O segredo `CLOUDFLARE_API_TOKEN` tem somente acesso ao Pages da conta Avila Ops.

Domínios e redirecionamento de www são configurados na zona Cloudflare. Não alterar MX, TXT nem subdomínios de outros aplicativos.

## MDX e Markdown na publicação

O workflow gera as versões textuais depois do build e da preparação de `pages-dist`,
antes de `Publish Pages`. O publicador usa o repositório público
[avilaops/motor-web](https://github.com/avilaops/motor-web/tree/d5067bbbe3522f459367af3b58b4298324801f82)
fixado no commit `d5067bbbe3522f459367af3b58b4298324801f82`. Suas dependências de produção
são instaladas em `.publicacao-texto` com scripts de instalação desativados.

```sh
node .publicacao-texto/bin/publicar-texto.mjs --diretorio pages-dist --origem https://comandeiro.com
```

O mesmo artefato recebe `.md`, `.mdx`, `publicacao-texto.json`, os links de descoberta,
a seção gerada em `llms.txt` e os cabeçalhos das cópias textuais em `_headers`.
O conversor exclui rotas privadas, páginas de erro e conteúdo `noindex` ou `none`.
Arquivos manuais são preservados; um shell sem conteúdo renderizado faz a geração
falhar e impede a etapa de publicação.

Pull requests executam o build e a geração. A condição existente de `Publish Pages`
continua impedindo deploy em eventos `pull_request`. Para atualizar o publicador,
altere o commit fixado no workflow e valide o novo manifesto em CI.
Para rollback, restaure o workflow anterior e use o artefato ou deploy anterior
conforme o fluxo de publicação do projeto.


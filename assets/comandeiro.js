/* ==========================================================================
   Demo ao vivo do Comandeiro.

   Simula o que o produto faz: o garçom toca nos itens, envia, e a comanda cai
   na cozinha com o cronômetro correndo — passando de normal para atenção e
   para atrasado nos mesmos limites que o sistema real usa (10 e 15 minutos,
   acelerados aqui para caber na atenção de quem está lendo).

   Vanilla, sem dependência, ~4 KB. Um carrossel de screenshots pesaria mais e
   mostraria menos: aqui o produto se explica sozinho, em movimento.

   Três cuidados que separam demo de enfeite:
     - para quando sai da tela (IntersectionObserver), para não queimar bateria
       de celular numa aba esquecida;
     - respeita `prefers-reduced-motion`: mostra o estado final, sem animar;
     - sem JS, o HTML já traz a comanda pronta — a página nunca fica vazia.
   ========================================================================== */

(() => {
  "use strict";

  const demo = document.querySelector("[data-demo]");
  if (!demo) return;

  const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const itens = Array.from(demo.querySelectorAll("[data-item]"));
  const enviar = demo.querySelector("[data-enviar]");
  const totalEl = demo.querySelector("[data-total]");
  const kds = demo.querySelector("[data-kds]");
  const vazio = demo.querySelector("[data-vazio]");
  const cronEl = demo.querySelector("[data-cron]");
  const estadoEl = demo.querySelector("[data-estado-texto]");
  const comanda = demo.querySelector("[data-comanda]");
  const botaoRepetir = demo.querySelector("[data-repetir]");

  const textos = JSON.parse(demo.getAttribute("data-textos") || "{}");
  const moeda = demo.getAttribute("data-moeda") || "R$";

  const ATENCAO = 22; // segundos simulados até o amarelo
  const ATRASO = 38; // até o vermelho

  let temporizadores = [];
  let rodando = false;

  const limpar = () => {
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
  };

  const daqui = (ms, fn) => temporizadores.push(setTimeout(fn, ms));

  const formatar = (centavos) =>
    `${moeda} ${(centavos / 100).toFixed(2).replace(".", ",")}`;

  function reiniciar() {
    itens.forEach((item) => {
      item.classList.remove("tocado");
      item.querySelector("[data-qtd]").textContent = "";
    });
    totalEl.textContent = formatar(0);
    comanda.classList.remove("entrou");
    comanda.setAttribute("data-estado", "normal");
    cronEl.textContent = "00:00";
    estadoEl.textContent = textos.aguardando || "";
    if (vazio) vazio.hidden = false;
    if (kds) kds.hidden = true;
  }

  function cronometro() {
    let s = 0;
    const passo = () => {
      s += 1;
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      cronEl.textContent = `${mm}:${ss}`;

      if (s >= ATRASO) {
        comanda.setAttribute("data-estado", "atrasado");
        estadoEl.textContent = textos.atrasado || "";
      } else if (s >= ATENCAO) {
        comanda.setAttribute("data-estado", "atencao");
        estadoEl.textContent = textos.atencao || "";
      }

      if (s < ATRASO + 6) daqui(1000, passo);
      else daqui(2200, ciclo); // recomeça a história
    };
    daqui(1000, passo);
  }

  function ciclo() {
    if (!rodando) return;
    limpar();
    reiniciar();

    let total = 0;

    // 1. o garçom toca nos itens, um a um
    itens.forEach((item, i) => {
      const qtd = Number(item.getAttribute("data-qtd-final") || 1);
      const preco = Number(item.getAttribute("data-preco") || 0);

      daqui(500 + i * 650, () => {
        item.classList.add("tocado");
        item.querySelector("[data-qtd]").textContent = `${qtd}×`;
        total += preco * qtd;
        totalEl.textContent = formatar(total);
      });
    });

    // 2. envia
    const quandoEnvia = 500 + itens.length * 650 + 500;
    daqui(quandoEnvia, () => {
      enviar.classList.add("disparando");
      daqui(220, () => enviar.classList.remove("disparando"));
    });

    // 3. a comanda cai na cozinha e o cronômetro começa
    daqui(quandoEnvia + 320, () => {
      if (vazio) vazio.hidden = true;
      if (kds) kds.hidden = false;
      requestAnimationFrame(() => comanda.classList.add("entrou"));
      estadoEl.textContent = textos.naChapa || "";
      cronometro();
    });
  }

  function estadoFinal() {
    // Sem animação: mostra o resultado, que é o que a pessoa precisa entender.
    let total = 0;
    itens.forEach((item) => {
      const qtd = Number(item.getAttribute("data-qtd-final") || 1);
      total += Number(item.getAttribute("data-preco") || 0) * qtd;
      item.classList.add("tocado");
      item.querySelector("[data-qtd]").textContent = `${qtd}×`;
    });
    totalEl.textContent = formatar(total);
    if (vazio) vazio.hidden = true;
    if (kds) kds.hidden = false;
    comanda.classList.add("entrou");
    cronEl.textContent = "04:12";
    estadoEl.textContent = textos.naChapa || "";
  }

  if (menosMovimento) {
    estadoFinal();
    if (botaoRepetir) botaoRepetir.hidden = true;
    return;
  }

  // Só roda enquanto estiver à vista.
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting && !rodando) {
          rodando = true;
          ciclo();
        } else if (!entrada.isIntersecting && rodando) {
          rodando = false;
          limpar();
        }
      });
    },
    { threshold: 0.25 },
  );

  observador.observe(demo);

  if (botaoRepetir) {
    botaoRepetir.addEventListener("click", () => {
      rodando = true;
      ciclo();
    });
  }
})();

/* Revelação no rolar — dois elementos por vez, sem biblioteca. */
(() => {
  const alvos = document.querySelectorAll(".revela");
  if (!alvos.length || !("IntersectionObserver" in window)) {
    alvos.forEach((a) => a.classList.add("dentro"));
    return;
  }

  const obs = new IntersectionObserver(
    (entradas, o) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("dentro");
          o.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  alvos.forEach((a) => obs.observe(a));
})();

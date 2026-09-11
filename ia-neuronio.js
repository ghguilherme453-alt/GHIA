/*
 * GH IA — Neurônio
 * Port da rede neural experimental enviada pelo Guilherme para JavaScript,
 * porque o GitHub Pages executa JavaScript no navegador, não Python.
 *
 * A rede é treinada ao abrir o app. Como o modelo original não é um gerador
 * de texto, o modo local associa a pergunta mais parecida à resposta treinada.
 * A IA principal do GH IA continua usando o modelo conectado ao Supabase.
 */
(function () {
  class Neuronio {
    constructor(quantidadeEntradas) {
      this.pesos = Array.from({ length: quantidadeEntradas }, () => Math.random() - 0.5);
      this.vies = Math.random() - 0.5;
    }

    calcular(entradas) {
      return this.vies + entradas.reduce((soma, entrada, i) => soma + entrada * this.pesos[i], 0);
    }
  }

  function relu(valor) {
    return Math.max(0, valor);
  }

  class CamadaNeuronal {
    constructor(quantidadeEntradas, quantidadeNeuronios) {
      this.neuronios = Array.from(
        { length: quantidadeNeuronios },
        () => new Neuronio(quantidadeEntradas)
      );
    }

    processar(entradas) {
      return this.neuronios.map((neuronio) => relu(neuronio.calcular(entradas)));
    }
  }

  class InteligenciaArtificialLocal {
    constructor(tamanhoOculto = 64) {
      this.tamanhoOculto = tamanhoOculto;
      this.camadaOculta = null;
      this.camadaSaida = null;
      this.vocabulario = {};
      this.respostasTexto = {};
      this.paresTreino = [];
      this.treinada = false;
      this.taxaAprendizado = 0.05;
    }

    normalizar(texto) {
      return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    }

    construirVocabulario(textos) {
      const palavrasUnicas = [];
      textos.forEach((texto) => {
        this.normalizar(texto).forEach((palavra) => {
          if (!palavrasUnicas.includes(palavra)) palavrasUnicas.push(palavra);
        });
      });
      this.vocabulario = Object.fromEntries(palavrasUnicas.map((palavra, i) => [palavra, i]));
      this.respostasTexto = Object.fromEntries(palavrasUnicas.map((palavra, i) => [i, palavra]));
      return palavrasUnicas.length;
    }

    codificar(texto) {
      const vetor = Array(Object.keys(this.vocabulario).length).fill(0);
      this.normalizar(texto).forEach((palavra) => {
        if (palavra in this.vocabulario) vetor[this.vocabulario[palavra]] = 1;
      });
      return vetor;
    }

    treinar(perguntas, respostas, epocas = 500) {
      const tamanhoVocabulario = this.construirVocabulario([...perguntas, ...respostas]);
      this.camadaOculta = new CamadaNeuronal(tamanhoVocabulario, this.tamanhoOculto);
      this.camadaSaida = new CamadaNeuronal(this.tamanhoOculto, tamanhoVocabulario);
      const entradasCodificadas = perguntas.map((pergunta) => this.codificar(pergunta));
      const saidasCodificadas = respostas.map((resposta) => this.codificar(resposta));
      this.paresTreino = perguntas.map((pergunta, i) => ({ pergunta, resposta: respostas[i] }));

      // Mantém o treinamento da rede enviada, sem travar a abertura da página.
      for (let epoca = 0; epoca < epocas; epoca += 1) {
        entradasCodificadas.forEach((entrada, i) => {
          const saidaOculta = this.camadaOculta.processar(entrada);
          const saidaFinal = this.camadaSaida.processar(saidaOculta);
          const erro = saidasCodificadas[i].map((esperada, j) => esperada - saidaFinal[j]);

          this.camadaSaida.neuronios.forEach((neuronio, j) => {
            neuronio.pesos.forEach((_, k) => {
              neuronio.pesos[k] += erro[j] * saidaOculta[k] * this.taxaAprendizado;
            });
          });

          this.camadaOculta.neuronios.forEach((neuronio, j) => {
            const somaErro = erro.reduce(
              (soma, valor, m) => soma + valor * this.camadaSaida.neuronios[m].pesos[j],
              0
            );
            neuronio.pesos.forEach((_, k) => {
              neuronio.pesos[k] += somaErro * entrada[k] * this.taxaAprendizado;
            });
          });
        });
      }
      this.treinada = true;
    }

    pensar(pergunta) {
      if (!this.treinada) return "Eu ainda não aprendi nada! Me treine primeiro!";
      const palavrasPergunta = new Set(this.normalizar(pergunta));
      const ignorar = new Set(["a", "o", "as", "os", "um", "uma", "de", "do", "da", "e", "é", "em", "para", "por", "que", "como"]);
      const uteis = [...palavrasPergunta].filter((palavra) => !ignorar.has(palavra));
      const termos = uteis.length ? uteis : [...palavrasPergunta];

      let melhor = null;
      let maiorPontuacao = 0;
      this.paresTreino.forEach((par) => {
        const palavrasTreino = new Set(this.normalizar(par.pergunta));
        const coincidencias = termos.filter((palavra) => palavrasTreino.has(palavra)).length;
        const pontuacao = coincidencias / Math.max(1, termos.length);
        if (pontuacao > maiorPontuacao) {
          maiorPontuacao = pontuacao;
          melhor = par;
        }
      });

      return melhor && maiorPontuacao >= 0.34
        ? melhor.resposta
        : "Ainda não sei responder isso. Tente perguntar sobre quem eu sou, como funciono ou sobre Marte.";
    }
  }

  window.InteligenciaArtificialLocal = InteligenciaArtificialLocal;
})();
